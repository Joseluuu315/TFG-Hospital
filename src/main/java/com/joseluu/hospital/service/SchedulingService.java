package com.joseluu.hospital.service;

import com.joseluu.hospital.dto.HospitalSettingsDto;
import com.joseluu.hospital.dto.ManualShiftRequestDto;
import com.joseluu.hospital.dto.ShiftAssignmentDto;
import com.joseluu.hospital.dto.ShiftRequirementDto;
import com.joseluu.hospital.entity.ShiftAssignmentDocument;
import com.joseluu.hospital.entity.ShiftRequirementDocument;
import com.joseluu.hospital.entity.ShiftTypeDocument;
import com.joseluu.hospital.entity.UserDocument;
import com.joseluu.hospital.entity.enums.NotificationType;
import com.joseluu.hospital.entity.enums.ShiftAssignmentSource;
import com.joseluu.hospital.entity.enums.ShiftAssignmentStatus;
import com.joseluu.hospital.entity.enums.UserRole;
import com.joseluu.hospital.exception.NotFoundException;
import com.joseluu.hospital.repository.LeaveRequestRepository;
import com.joseluu.hospital.repository.ShiftAssignmentRepository;
import com.joseluu.hospital.repository.ShiftRequirementRepository;
import com.joseluu.hospital.repository.ShiftTypeRepository;
import com.joseluu.hospital.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

/**
 * Servicio encargado de las demandas de turno y de las asignaciones manuales o automaticas.
 */
@Service
public class SchedulingService {
    private final ShiftRequirementRepository shiftRequirementRepository;
    private final ShiftAssignmentRepository shiftAssignmentRepository;
    private final ShiftTypeRepository shiftTypeRepository;
    private final UserRepository userRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final HospitalSettingsService hospitalSettingsService;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;

    public SchedulingService(ShiftRequirementRepository shiftRequirementRepository,
                             ShiftAssignmentRepository shiftAssignmentRepository,
                             ShiftTypeRepository shiftTypeRepository,
                             UserRepository userRepository,
                             LeaveRequestRepository leaveRequestRepository,
                             HospitalSettingsService hospitalSettingsService,
                             NotificationService notificationService,
                             AuditLogService auditLogService) {
        this.shiftRequirementRepository = shiftRequirementRepository;
        this.shiftAssignmentRepository = shiftAssignmentRepository;
        this.shiftTypeRepository = shiftTypeRepository;
        this.userRepository = userRepository;
        this.leaveRequestRepository = leaveRequestRepository;
        this.hospitalSettingsService = hospitalSettingsService;
        this.notificationService = notificationService;
        this.auditLogService = auditLogService;
    }

    /**
     * Crea una demanda de turno para un hospital.
     */
    public ShiftRequirementDto createRequirement(String hospitalId, ShiftRequirementDto dto) {
        ShiftRequirementDocument document = ShiftRequirementDocument.builder()
                .id(UUID.randomUUID().toString())
                .hospitalId(hospitalId)
                .department(dto.getDepartment())
                .date(dto.getDate())
                .shiftTypeCode(dto.getShiftTypeCode())
                .requiredWorkers(dto.getRequiredWorkers())
                .build();

        return toRequirementDto(shiftRequirementRepository.save(document));
    }

    /**
     * Ejecuta la autoasignacion de turnos en un rango de fechas.
     */
    public List<ShiftAssignmentDto> autoAssign(String hospitalId,
                                               String actorUserId,
                                               String startDate,
                                               String endDate) {
        HospitalSettingsDto settings = hospitalSettingsService.getByHospital(hospitalId);
        List<ShiftRequirementDocument> requirements = getSortedRequirements(hospitalId, startDate, endDate);
        List<UserDocument> workers = getWorkersForHospital(hospitalId);
        int version = getNextAssignmentVersion(hospitalId);
        List<ShiftAssignmentDto> assignments = new ArrayList<>();

        for (ShiftRequirementDocument requirement : requirements) {
            ShiftTypeDocument shiftType = requireShiftType(hospitalId, requirement.getShiftTypeCode());
            List<UserDocument> candidates = buildCandidates(requirement, shiftType, workers, settings);
            int covered = assignRequirement(hospitalId, requirement, shiftType, version, candidates, assignments);

            if (covered < requirement.getRequiredWorkers()) {
                notifyUncoveredRequirement(hospitalId, requirement, covered);
            }
        }

        auditLogService.log(
                hospitalId,
                actorUserId,
                "SHIFT_AUTO_ASSIGNED",
                "shift_assignments",
                hospitalId,
                "Asignacion automatica entre " + startDate + " y " + endDate
        );

        if (assignments.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Asignados 0 turnos. Ningun trabajador cumple los requisitos para las demandas registradas."
            );
        }

        return assignments;
    }

    /**
     * Crea una asignacion manual para un trabajador.
     */
    public ShiftAssignmentDto manualAssign(String hospitalId, String actorUserId, ManualShiftRequestDto dto) {
        UserDocument worker = userRepository.findById(dto.getWorkerId())
                .orElseThrow(() -> new NotFoundException("Trabajador no encontrado"));

        ShiftDateRange range = buildManualRange(hospitalId, dto);
        LocalDateTime now = LocalDateTime.now();

        ShiftAssignmentDocument assignment = ShiftAssignmentDocument.builder()
                .id(UUID.randomUUID().toString())
                .hospitalId(hospitalId)
                .workerId(worker.getId())
                .workerFullName(worker.getFirstName() + " " + worker.getLastName())
                .department(worker.getDepartment())
                .shiftTypeCode(range.shiftTypeCode())
                .startAt(range.start().toString())
                .endAt(range.end().toString())
                .status(ShiftAssignmentStatus.ASSIGNED)
                .source(ShiftAssignmentSource.MANUAL)
                .version(0)
                .createdAt(now.toString())
                .updatedAt(now.toString())
                .build();

        ShiftAssignmentDocument saved = shiftAssignmentRepository.save(assignment);
        notificationService.createNotification(
                worker.getId(),
                NotificationType.SHIFT_ASSIGNED,
                "Turno asignado manualmente para " + dto.getDate() + " (" + dto.getType() + ")"
        );
        auditLogService.log(
                hospitalId,
                actorUserId,
                "SHIFT_MANUAL_ASSIGNED",
                "shift_assignments",
                saved.getId(),
                "Asignacion manual para " + worker.getFirstName() + " " + worker.getLastName() + " en " + dto.getDate()
        );

        return toDto(saved);
    }

    /**
     * Cancela una asignacion existente.
     */
    public void cancelAssignment(String hospitalId, String actorUserId, String shiftId) {
        ShiftAssignmentDocument assignment = shiftAssignmentRepository.findById(shiftId)
                .orElseThrow(() -> new NotFoundException("Asignacion no encontrada"));

        if (!hospitalId.equals(assignment.getHospitalId())) {
            throw new IllegalArgumentException("La asignacion no pertenece a este hospital.");
        }

        assignment.setStatus(ShiftAssignmentStatus.CANCELLED);
        assignment.setUpdatedAt(LocalDateTime.now().toString());
        shiftAssignmentRepository.save(assignment);

        auditLogService.log(
                hospitalId,
                actorUserId,
                "SHIFT_CANCELLED",
                "shift_assignments",
                shiftId,
                "Asignacion cancelada"
        );
    }

    /**
     * Lista las demandas de turno de un hospital.
     */
    public List<ShiftRequirementDto> getRequirementsForHospital(String hospitalId, String startDate, String endDate) {
        List<ShiftRequirementDocument> requirements;
        if (startDate != null && endDate != null) {
            requirements = shiftRequirementRepository.findInDateRange(hospitalId, startDate, endDate);
        } else {
            requirements = shiftRequirementRepository.findByHospitalId(hospitalId);
        }

        List<ShiftRequirementDto> result = new ArrayList<>();
        for (ShiftRequirementDocument requirement : requirements) {
            result.add(toRequirementDto(requirement));
        }
        return result;
    }

    /**
     * Elimina una demanda de turno.
     */
    public void deleteRequirement(String hospitalId, String actorUserId, String requirementId) {
        ShiftRequirementDocument requirement = shiftRequirementRepository.findById(requirementId)
                .orElseThrow(() -> new NotFoundException("Demanda no encontrada"));

        if (!hospitalId.equals(requirement.getHospitalId())) {
            throw new IllegalArgumentException("La demanda no pertenece a este hospital.");
        }

        shiftRequirementRepository.delete(requirement);
        auditLogService.log(
                hospitalId,
                actorUserId,
                "REQUIREMENT_DELETED",
                "shift_requirements",
                requirementId,
                "Demanda eliminada"
        );
    }

    /**
     * Lista las asignaciones de un trabajador.
     */
    public List<ShiftAssignmentDto> getAssignmentsForWorker(String workerId) {
        List<ShiftAssignmentDto> assignments = new ArrayList<>();
        for (ShiftAssignmentDocument assignment : shiftAssignmentRepository.findByWorkerId(workerId)) {
            assignments.add(toDto(assignment));
        }
        return assignments;
    }

    /**
     * Lista las asignaciones activas de un hospital.
     */
    public List<ShiftAssignmentDto> getAssignmentsForHospital(String hospitalId, String startDate, String endDate) {
        List<ShiftAssignmentDocument> documents = getAssignmentsByRange(hospitalId, startDate, endDate);
        List<ShiftAssignmentDto> assignments = new ArrayList<>();

        for (ShiftAssignmentDocument assignment : documents) {
            if (assignment.getStatus() != ShiftAssignmentStatus.CANCELLED) {
                assignments.add(toDto(assignment));
            }
        }

        return assignments;
    }

    /**
     * Ordena las demandas por fecha y tipo de turno.
     */
    private List<ShiftRequirementDocument> getSortedRequirements(String hospitalId, String startDate, String endDate) {
        List<ShiftRequirementDocument> requirements = shiftRequirementRepository.findInDateRange(hospitalId, startDate, endDate);
        if (requirements.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "No hay demandas de turno registradas entre " + startDate + " y " + endDate + "."
            );
        }

        requirements.sort(Comparator.comparing(ShiftRequirementDocument::getDate)
                .thenComparing(ShiftRequirementDocument::getShiftTypeCode));
        return requirements;
    }

    /**
     * Devuelve los trabajadores activos del hospital.
     */
    private List<UserDocument> getWorkersForHospital(String hospitalId) {
        List<UserDocument> workers = userRepository.findByHospitalIdAndRole(hospitalId, UserRole.WORKER);
        if (workers.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No hay trabajadores activos en el hospital.");
        }
        return workers;
    }

    /**
     * Calcula la siguiente version para un lote de autoasignacion.
     */
    private int getNextAssignmentVersion(String hospitalId) {
        int version = 0;
        for (ShiftAssignmentDocument assignment : shiftAssignmentRepository.findByHospitalId(hospitalId)) {
            if (assignment.getVersion() > version) {
                version = assignment.getVersion();
            }
        }
        return version + 1;
    }

    /**
     * Obtiene el tipo de turno o lanza error.
     */
    private ShiftTypeDocument requireShiftType(String hospitalId, String shiftTypeCode) {
        return shiftTypeRepository.findByHospitalIdAndCode(hospitalId, shiftTypeCode)
                .orElseThrow(() -> new NotFoundException("Tipo de turno no encontrado: " + shiftTypeCode));
    }

    /**
     * Construye la lista final de candidatos por fases.
     */
    private List<UserDocument> buildCandidates(ShiftRequirementDocument requirement,
                                               ShiftTypeDocument shiftType,
                                               List<UserDocument> workers,
                                               HospitalSettingsDto settings) {
        List<UserDocument> baseCandidates = getBaseCandidates(requirement, shiftType, workers);
        List<UserDocument> candidates = new ArrayList<>();

        addStrictCandidates(candidates, baseCandidates, requirement, shiftType, settings);
        addRelaxedCandidates(candidates, baseCandidates, requirement, shiftType, settings);
        addDepartmentCandidates(candidates, baseCandidates, requirement, shiftType);
        addAnyFreeWorkerCandidates(candidates, baseCandidates, shiftType, requirement);

        return candidates;
    }

    /**
     * Filtra trabajadores que no se solapan con el turno pedido.
     */
    private List<UserDocument> getBaseCandidates(ShiftRequirementDocument requirement,
                                                 ShiftTypeDocument shiftType,
                                                 List<UserDocument> workers) {
        List<UserDocument> candidates = new ArrayList<>();
        for (UserDocument worker : workers) {
            if (!hasOverlap(worker.getId(), requirement.getDate(), shiftType)) {
                candidates.add(worker);
            }
        }
        return candidates;
    }

    /**
     * Anade candidatos que cumplen todos los criterios.
     */
    private void addStrictCandidates(List<UserDocument> target,
                                     List<UserDocument> baseCandidates,
                                     ShiftRequirementDocument requirement,
                                     ShiftTypeDocument shiftType,
                                     HospitalSettingsDto settings) {
        List<UserDocument> matches = new ArrayList<>();
        for (UserDocument worker : baseCandidates) {
            if (isIdealCandidate(worker, requirement)
                    && respectsRest(worker.getId(), requirement.getDate(), shiftType, settings.getMinRestHours())
                    && respectsWeeklyHours(worker.getId(), requirement.getDate(), shiftType, settings.getMaxWeeklyHours())) {
                matches.add(worker);
            }
        }
        addSortedUnique(target, matches, requirement, shiftType);
    }

    /**
     * Anade candidatos ignorando el limite semanal si hace falta.
     */
    private void addRelaxedCandidates(List<UserDocument> target,
                                      List<UserDocument> baseCandidates,
                                      ShiftRequirementDocument requirement,
                                      ShiftTypeDocument shiftType,
                                      HospitalSettingsDto settings) {
        List<UserDocument> matches = new ArrayList<>();
        for (UserDocument worker : baseCandidates) {
            if (!target.contains(worker)
                    && isIdealCandidate(worker, requirement)
                    && respectsRest(worker.getId(), requirement.getDate(), shiftType, settings.getMinRestHours())) {
                matches.add(worker);
            }
        }
        addSortedUnique(target, matches, requirement, shiftType);
    }

    /**
     * Anade candidatos del mismo departamento aunque no cumplan descansos u horas.
     */
    private void addDepartmentCandidates(List<UserDocument> target,
                                         List<UserDocument> baseCandidates,
                                         ShiftRequirementDocument requirement,
                                         ShiftTypeDocument shiftType) {
        List<UserDocument> matches = new ArrayList<>();
        for (UserDocument worker : baseCandidates) {
            if (!target.contains(worker) && isIdealCandidate(worker, requirement)) {
                matches.add(worker);
            }
        }
        addSortedUnique(target, matches, requirement, shiftType);
    }

    /**
     * Anade cualquier trabajador libre restante.
     */
    private void addAnyFreeWorkerCandidates(List<UserDocument> target,
                                            List<UserDocument> baseCandidates,
                                            ShiftTypeDocument shiftType,
                                            ShiftRequirementDocument requirement) {
        List<UserDocument> matches = new ArrayList<>();
        for (UserDocument worker : baseCandidates) {
            if (!target.contains(worker)) {
                matches.add(worker);
            }
        }
        addSortedUnique(target, matches, requirement, shiftType);
    }

    /**
     * Indica si el trabajador es candidato ideal por estado, departamento y ausencias.
     */
    private boolean isIdealCandidate(UserDocument worker, ShiftRequirementDocument requirement) {
        boolean sameDepartment = worker.getDepartment() != null
                && requirement.getDepartment().equalsIgnoreCase(worker.getDepartment());
        return worker.isEnabled()
                && sameDepartment
                && !isOnApprovedLeave(worker.getId(), requirement.getDate());
    }

    /**
     * Ordena candidatos por puntuacion y evita duplicados.
     */
    private void addSortedUnique(List<UserDocument> target,
                                 List<UserDocument> source,
                                 ShiftRequirementDocument requirement,
                                 ShiftTypeDocument shiftType) {
        source.sort(Comparator.comparingDouble(worker -> calculateScore(worker.getId(), requirement.getDate(), shiftType)));
        for (UserDocument worker : source) {
            if (!target.contains(worker)) {
                target.add(worker);
            }
        }
    }

    /**
     * Asigna una demanda a los mejores candidatos disponibles.
     */
    private int assignRequirement(String hospitalId,
                                  ShiftRequirementDocument requirement,
                                  ShiftTypeDocument shiftType,
                                  int version,
                                  List<UserDocument> candidates,
                                  List<ShiftAssignmentDto> assignments) {
        int covered = 0;
        for (UserDocument candidate : candidates) {
            if (covered >= requirement.getRequiredWorkers()) {
                break;
            }

            ShiftAssignmentDocument saved = shiftAssignmentRepository.save(
                    buildAssignment(hospitalId, candidate, requirement, shiftType, version)
            );
            assignments.add(toDto(saved));
            covered++;

            notificationService.createNotification(
                    candidate.getId(),
                    NotificationType.SHIFT_ASSIGNED,
                    "Nuevo turno asignado para " + requirement.getDate() + " (" + requirement.getShiftTypeCode() + ")"
            );
        }
        return covered;
    }

    /**
     * Avisa a los administradores si una demanda queda sin cubrir.
     */
    private void notifyUncoveredRequirement(String hospitalId,
                                            ShiftRequirementDocument requirement,
                                            int covered) {
        int required = requirement.getRequiredWorkers();
        String message = "Cobertura incompleta en " + requirement.getDepartment()
                + " para " + requirement.getDate()
                + " (" + covered + "/" + required + ")";

        userRepository.findByHospitalIdAndRole(hospitalId, UserRole.HOSPITAL_ADMIN)
                .forEach(admin -> notificationService.createNotification(
                        admin.getId(),
                        NotificationType.SHIFT_UNCOVERED,
                        message
                ));
    }

    /**
     * Construye el rango temporal de una asignacion manual.
     */
    private ShiftDateRange buildManualRange(String hospitalId, ManualShiftRequestDto dto) {
        if ("SHIFT".equalsIgnoreCase(dto.getType())) {
            return buildShiftRange(hospitalId, dto);
        }

        LocalDateTime start = LocalDate.parse(dto.getDate()).atStartOfDay();
        LocalDateTime end = start.plusDays(1);
        return new ShiftDateRange(start, end, dto.getType());
    }

    /**
     * Construye el rango temporal de un turno normal.
     */
    private ShiftDateRange buildShiftRange(String hospitalId, ManualShiftRequestDto dto) {
        if (dto.getShiftTypeCode() == null || dto.getShiftTypeCode().isBlank()) {
            throw new IllegalArgumentException("El codigo de tipo de turno es obligatorio para asignaciones SHIFT.");
        }

        ShiftTypeDocument shiftType = requireShiftType(hospitalId, dto.getShiftTypeCode());
        LocalDateTime start = combine(dto.getDate(), shiftType.getStartTime());
        LocalDateTime end = combine(dto.getDate(), shiftType.getEndTime());
        if (shiftType.isCrossesMidnight() || !end.isAfter(start)) {
            end = end.plusDays(1);
        }

        return new ShiftDateRange(start, end, shiftType.getCode());
    }

    /**
     * Obtiene asignaciones por rango o todas las del hospital.
     */
    private List<ShiftAssignmentDocument> getAssignmentsByRange(String hospitalId, String startDate, String endDate) {
        if (startDate != null && endDate != null) {
            return shiftAssignmentRepository.findByHospitalIdAndStartAtBetween(
                    hospitalId,
                    LocalDate.parse(startDate).atStartOfDay().toString(),
                    LocalDate.parse(endDate).plusDays(1).atStartOfDay().toString()
            );
        }
        return shiftAssignmentRepository.findByHospitalId(hospitalId);
    }

    /**
     * Comprueba si el trabajador tiene una ausencia aprobada en esa fecha.
     */
    private boolean isOnApprovedLeave(String workerId, String date) {
        LocalDate target = LocalDate.parse(date);
        return leaveRequestRepository.findByUserId(workerId).stream()
                .filter(request -> "APPROVED".equals(request.getStatus().name()))
                .anyMatch(request -> !target.isBefore(LocalDate.parse(request.getStartDate()))
                        && !target.isAfter(LocalDate.parse(request.getEndDate())));
    }

    /**
     * Comprueba si un turno se solapa con otro ya existente.
     */
    private boolean hasOverlap(String workerId, String date, ShiftTypeDocument shiftType) {
        LocalDateTime start = combine(date, shiftType.getStartTime());
        LocalDateTime end = combine(date, shiftType.getEndTime());
        if (shiftType.isCrossesMidnight() || !end.isAfter(start)) {
            end = end.plusDays(1);
        }

        LocalDateTime finalEnd = end;
        return shiftAssignmentRepository.findByWorkerId(workerId).stream()
                .filter(assignment -> assignment.getStatus() != ShiftAssignmentStatus.CANCELLED)
                .anyMatch(assignment -> start.isBefore(LocalDateTime.parse(assignment.getEndAt()))
                        && LocalDateTime.parse(assignment.getStartAt()).isBefore(finalEnd));
    }

    /**
     * Comprueba si se respeta el descanso minimo entre turnos.
     */
    private boolean respectsRest(String workerId, String date, ShiftTypeDocument shiftType, int minRestHours) {
        LocalDateTime start = combine(date, shiftType.getStartTime());
        return shiftAssignmentRepository.findByWorkerId(workerId).stream()
                .filter(assignment -> assignment.getStatus() != ShiftAssignmentStatus.CANCELLED)
                .noneMatch(assignment -> {
                    long hours = Duration.between(LocalDateTime.parse(assignment.getEndAt()), start).toHours();
                    return hours < minRestHours && hours > -24;
                });
    }

    /**
     * Comprueba si el trabajador sigue dentro del limite semanal de horas.
     */
    private boolean respectsWeeklyHours(String workerId, String date, ShiftTypeDocument shiftType, int maxWeeklyHours) {
        LocalDate target = LocalDate.parse(date);
        LocalDate weekStart = target.minusDays(target.getDayOfWeek().getValue() - 1L);
        LocalDate weekEnd = weekStart.plusDays(6);

        double assignedHours = shiftAssignmentRepository.findByWorkerIdAndStartAtBetween(
                        workerId,
                        weekStart.atStartOfDay().toString(),
                        weekEnd.plusDays(1).atStartOfDay().toString()
                ).stream()
                .filter(assignment -> assignment.getStatus() != ShiftAssignmentStatus.CANCELLED)
                .mapToDouble(this::getAssignmentHours)
                .sum();

        return assignedHours + getShiftHours(shiftType, target) <= maxWeeklyHours;
    }

    /**
     * Calcula una puntuacion simple para repartir carga de trabajo.
     */
    private double calculateScore(String workerId, String date, ShiftTypeDocument shiftType) {
        LocalDate target = LocalDate.parse(date);
        LocalDate monthStart = YearMonth.from(target).atDay(1);
        LocalDate monthEnd = YearMonth.from(target).atEndOfMonth();

        List<ShiftAssignmentDocument> assignments = shiftAssignmentRepository.findByWorkerIdAndStartAtBetween(
                workerId,
                monthStart.atStartOfDay().toString(),
                monthEnd.plusDays(1).atStartOfDay().toString()
        );

        long nightCount = assignments.stream()
                .filter(assignment -> "NIGHT".equalsIgnoreCase(assignment.getShiftTypeCode()))
                .count();
        long weekendCount = assignments.stream()
                .filter(assignment -> LocalDateTime.parse(assignment.getStartAt()).getDayOfWeek().getValue() >= 6)
                .count();
        double totalHours = assignments.stream().mapToDouble(this::getAssignmentHours).sum();

        double score = totalHours * 2 + weekendCount * 2;
        if ("NIGHT".equalsIgnoreCase(shiftType.getCode())) {
            score += nightCount * 3;
        }
        return score;
    }

    /**
     * Construye la entidad de asignacion persistida.
     */
    private ShiftAssignmentDocument buildAssignment(String hospitalId,
                                                    UserDocument worker,
                                                    ShiftRequirementDocument requirement,
                                                    ShiftTypeDocument shiftType,
                                                    int version) {
        LocalDateTime start = combine(requirement.getDate(), shiftType.getStartTime());
        LocalDateTime end = combine(requirement.getDate(), shiftType.getEndTime());
        if (shiftType.isCrossesMidnight() || !end.isAfter(start)) {
            end = end.plusDays(1);
        }

        LocalDateTime now = LocalDateTime.now();
        return ShiftAssignmentDocument.builder()
                .id(UUID.randomUUID().toString())
                .hospitalId(hospitalId)
                .workerId(worker.getId())
                .workerFullName(worker.getFirstName() + " " + worker.getLastName())
                .department(worker.getDepartment())
                .shiftTypeCode(shiftType.getCode())
                .startAt(start.toString())
                .endAt(end.toString())
                .status(ShiftAssignmentStatus.ASSIGNED)
                .source(ShiftAssignmentSource.AUTO)
                .version(version)
                .createdAt(now.toString())
                .updatedAt(now.toString())
                .build();
    }

    /**
     * Calcula las horas de una asignacion existente.
     */
    private double getAssignmentHours(ShiftAssignmentDocument assignment) {
        return Duration.between(
                LocalDateTime.parse(assignment.getStartAt()),
                LocalDateTime.parse(assignment.getEndAt())
        ).toHours();
    }

    /**
     * Calcula las horas de un tipo de turno.
     */
    private double getShiftHours(ShiftTypeDocument shiftType, LocalDate date) {
        LocalDateTime start = combine(date.toString(), shiftType.getStartTime());
        LocalDateTime end = combine(date.toString(), shiftType.getEndTime());
        if (shiftType.isCrossesMidnight() || !end.isAfter(start)) {
            end = end.plusDays(1);
        }
        return Duration.between(start, end).toHours();
    }

    /**
     * Une una fecha y una hora en un LocalDateTime.
     */
    private LocalDateTime combine(String date, String time) {
        return LocalDateTime.of(LocalDate.parse(date), LocalTime.parse(time));
    }

    /**
     * Convierte una demanda persistida a DTO.
     */
    private ShiftRequirementDto toRequirementDto(ShiftRequirementDocument requirement) {
        return ShiftRequirementDto.builder()
                .id(requirement.getId())
                .date(requirement.getDate())
                .department(requirement.getDepartment())
                .shiftTypeCode(requirement.getShiftTypeCode())
                .requiredWorkers(requirement.getRequiredWorkers())
                .build();
    }

    /**
     * Convierte una asignacion persistida a DTO.
     */
    private ShiftAssignmentDto toDto(ShiftAssignmentDocument document) {
        return ShiftAssignmentDto.builder()
                .id(document.getId())
                .hospitalId(document.getHospitalId())
                .workerId(document.getWorkerId())
                .workerFullName(document.getWorkerFullName())
                .department(document.getDepartment())
                .shiftTypeCode(document.getShiftTypeCode())
                .startAt(document.getStartAt())
                .endAt(document.getEndAt())
                .status(document.getStatus())
                .source(document.getSource())
                .version(document.getVersion())
                .createdAt(document.getCreatedAt())
                .updatedAt(document.getUpdatedAt())
                .build();
    }

    /**
     * Record simple para reutilizar el rango temporal de una asignacion manual.
     */
    private record ShiftDateRange(LocalDateTime start, LocalDateTime end, String shiftTypeCode) {
    }
}
