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
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

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

    // ──────────────────────────────────────────────────────────────────────────
    // Requisitos de turnos
    // ──────────────────────────────────────────────────────────────────────────

    public ShiftRequirementDto createRequirement(String hospitalId, ShiftRequirementDto dto) {
        ShiftRequirementDocument saved = shiftRequirementRepository.save(
                ShiftRequirementDocument.builder()
                        .id(UUID.randomUUID().toString())
                        .hospitalId(hospitalId)
                        .department(dto.getDepartment())
                        .date(dto.getDate())
                        .shiftTypeCode(dto.getShiftTypeCode())
                        .requiredWorkers(dto.getRequiredWorkers())
                        .build());
        return ShiftRequirementDto.builder()
                .id(saved.getId())
                .date(saved.getDate())
                .department(saved.getDepartment())
                .shiftTypeCode(saved.getShiftTypeCode())
                .requiredWorkers(saved.getRequiredWorkers())
                .build();
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Autoasignación
    // ──────────────────────────────────────────────────────────────────────────

    public List<ShiftAssignmentDto> autoAssign(String hospitalId, String actorUserId,
                                               String startDate, String endDate) {
        HospitalSettingsDto settings = hospitalSettingsService.getByHospital(hospitalId);

        List<ShiftRequirementDocument> requirements = shiftRequirementRepository
                .findByHospitalIdAndDateBetween(hospitalId, startDate, endDate);

        if (requirements.isEmpty()) {
            throw new IllegalStateException(
                    "No hay demandas de turno registradas entre " + startDate + " y " + endDate
                    + ". Crea al menos una demanda antes de lanzar la autoasignación.");
        }

        List<UserDocument> workers = userRepository.findByHospitalIdAndRole(hospitalId, UserRole.WORKER);
        if (workers.isEmpty()) {
            throw new IllegalStateException("No hay trabajadores activos en el hospital.");
        }

        // Versión = max versión existente + 1 (filtrado por hospital)
        int version = shiftAssignmentRepository.findByHospitalId(hospitalId).stream()
                .map(ShiftAssignmentDocument::getVersion)
                .max(Integer::compareTo)
                .orElse(0) + 1;

        List<ShiftAssignmentDto> assignments = new ArrayList<>();

        for (ShiftRequirementDocument requirement : requirements.stream()
                .sorted(Comparator.comparing(ShiftRequirementDocument::getDate)
                        .thenComparing(ShiftRequirementDocument::getShiftTypeCode))
                .toList()) {

            ShiftTypeDocument shiftType = shiftTypeRepository
                    .findByHospitalIdAndCode(hospitalId, requirement.getShiftTypeCode())
                    .orElseThrow(() -> new NotFoundException(
                            "Tipo de turno no encontrado: " + requirement.getShiftTypeCode()));

            List<UserDocument> candidates = workers.stream()
                    .filter(w -> requirement.getDepartment().equalsIgnoreCase(w.getDepartment()))
                    .filter(w -> w.isEnabled())
                    .filter(w -> !isOnApprovedLeave(w.getId(), requirement.getDate()))
                    .filter(w -> !hasOverlap(w.getId(), requirement.getDate(), shiftType))
                    .filter(w -> respectsRest(w.getId(), requirement.getDate(), shiftType,
                            settings.getMinRestHours()))
                    .filter(w -> respectsWeeklyHours(w.getId(), requirement.getDate(), shiftType,
                            settings.getMaxWeeklyHours()))
                    .sorted(Comparator.comparingDouble(
                            w -> calculateScore(w.getId(), requirement.getDate(), shiftType)))
                    .collect(Collectors.toList());

            int covered = 0;
            for (UserDocument candidate : candidates) {
                if (covered >= requirement.getRequiredWorkers()) break;
                ShiftAssignmentDocument saved = shiftAssignmentRepository.save(
                        buildAssignment(hospitalId, candidate, requirement, shiftType, version));
                assignments.add(toDto(saved));
                covered++;
                notificationService.createNotification(candidate.getId(),
                        NotificationType.SHIFT_ASSIGNED,
                        "Nuevo turno asignado para " + requirement.getDate()
                        + " (" + requirement.getShiftTypeCode() + ")");
            }

            if (covered < requirement.getRequiredWorkers()) {
                final int finalCovered = covered;
                final int required = requirement.getRequiredWorkers();
                final String dept = requirement.getDepartment();
                final String reqDate = requirement.getDate();
                userRepository.findByHospitalIdAndRole(hospitalId, UserRole.HOSPITAL_ADMIN)
                        .forEach(admin -> notificationService.createNotification(
                                admin.getId(), NotificationType.SHIFT_UNCOVERED,
                                "Cobertura incompleta en " + dept
                                + " para " + reqDate
                                + " (" + finalCovered + "/" + required + ")"));
            }
        }

        auditLogService.log(hospitalId, actorUserId, "SHIFT_AUTO_ASSIGNED", "shift_assignments",
                hospitalId, "Asignacion automatica entre " + startDate + " y " + endDate);
        return assignments;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Asignación manual
    // ──────────────────────────────────────────────────────────────────────────

    public ShiftAssignmentDto manualAssign(String hospitalId, String actorUserId,
                                           ManualShiftRequestDto dto) {
        UserDocument worker = userRepository.findById(dto.getWorkerId())
                .orElseThrow(() -> new NotFoundException("Trabajador no encontrado"));

        LocalDateTime start;
        LocalDateTime end;

        if ("SHIFT".equalsIgnoreCase(dto.getType())) {
            if (dto.getShiftTypeCode() == null || dto.getShiftTypeCode().isBlank()) {
                throw new IllegalArgumentException(
                        "El código de tipo de turno es obligatorio para asignaciones de tipo SHIFT.");
            }
            ShiftTypeDocument shiftType = shiftTypeRepository
                    .findByHospitalIdAndCode(hospitalId, dto.getShiftTypeCode())
                    .orElseThrow(() -> new NotFoundException(
                            "Tipo de turno no encontrado: " + dto.getShiftTypeCode()));
            start = combine(dto.getDate(), shiftType.getStartTime());
            end   = combine(dto.getDate(), shiftType.getEndTime());
            if (shiftType.isCrossesMidnight() || !end.isAfter(start)) {
                end = end.plusDays(1);
            }
        } else {
            // DAY_OFF / VACATION / HOLIDAY — sin horario
            start = LocalDate.parse(dto.getDate()).atStartOfDay();
            end   = start.plusDays(1);
        }

        LocalDateTime now = LocalDateTime.now();
        ShiftAssignmentDocument saved = shiftAssignmentRepository.save(
                ShiftAssignmentDocument.builder()
                        .id(UUID.randomUUID().toString())
                        .hospitalId(hospitalId)
                        .workerId(worker.getId())
                        .workerFullName(worker.getFirstName() + " " + worker.getLastName())
                        .department(worker.getDepartment())
                        .shiftTypeCode(dto.getType().equalsIgnoreCase("SHIFT")
                                ? dto.getShiftTypeCode() : dto.getType())
                        .startAt(start.toString())
                        .endAt(end.toString())
                        .status(ShiftAssignmentStatus.ASSIGNED)
                        .source(ShiftAssignmentSource.MANUAL)
                        .version(0)
                        .createdAt(now.toString())
                        .updatedAt(now.toString())
                        .build());

        notificationService.createNotification(worker.getId(), NotificationType.SHIFT_ASSIGNED,
                "Turno asignado manualmente para " + dto.getDate() + " (" + dto.getType() + ")");

        auditLogService.log(hospitalId, actorUserId, "SHIFT_MANUAL_ASSIGNED",
                "shift_assignments", saved.getId(),
                "Asignacion manual para " + worker.getFirstName() + " " + worker.getLastName()
                + " en " + dto.getDate());

        return toDto(saved);
    }

    public void cancelAssignment(String hospitalId, String actorUserId, String shiftId) {
        ShiftAssignmentDocument assignment = shiftAssignmentRepository.findById(shiftId)
                .orElseThrow(() -> new NotFoundException("Asignacion no encontrada"));
        if (!assignment.getHospitalId().equals(hospitalId)) {
            throw new IllegalArgumentException("La asignación no pertenece a este hospital.");
        }
        assignment.setStatus(ShiftAssignmentStatus.CANCELLED);
        assignment.setUpdatedAt(LocalDateTime.now().toString());
        shiftAssignmentRepository.save(assignment);
        auditLogService.log(hospitalId, actorUserId, "SHIFT_CANCELLED",
                "shift_assignments", shiftId, "Asignacion cancelada");
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Consultas
    // ──────────────────────────────────────────────────────────────────────────

    public List<ShiftAssignmentDto> getAssignmentsForWorker(String workerId) {
        return shiftAssignmentRepository.findByWorkerId(workerId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<ShiftAssignmentDto> getAssignmentsForHospital(String hospitalId,
                                                               String startDate,
                                                               String endDate) {
        List<ShiftAssignmentDocument> all = (startDate != null && endDate != null)
                ? shiftAssignmentRepository.findByHospitalIdAndStartAtBetween(
                        hospitalId,
                        LocalDate.parse(startDate).atStartOfDay().toString(),
                        LocalDate.parse(endDate).plusDays(1).atStartOfDay().toString())
                : shiftAssignmentRepository.findByHospitalId(hospitalId);

        return all.stream()
                .filter(a -> a.getStatus() != ShiftAssignmentStatus.CANCELLED)
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Helpers privados
    // ──────────────────────────────────────────────────────────────────────────

    private boolean isOnApprovedLeave(String workerId, String date) {
        LocalDate target = LocalDate.parse(date);
        return leaveRequestRepository.findByUserId(workerId).stream()
                .filter(r -> "APPROVED".equals(r.getStatus().name()))
                .anyMatch(r -> !target.isBefore(LocalDate.parse(r.getStartDate()))
                            && !target.isAfter(LocalDate.parse(r.getEndDate())));
    }

    private boolean hasOverlap(String workerId, String date, ShiftTypeDocument shiftType) {
        LocalDateTime start = combine(date, shiftType.getStartTime());
        LocalDateTime end   = combine(date, shiftType.getEndTime());
        if (shiftType.isCrossesMidnight() || !end.isAfter(start)) end = end.plusDays(1);
        LocalDateTime finalEnd = end;
        return shiftAssignmentRepository.findByWorkerId(workerId).stream()
                .filter(i -> i.getStatus() != ShiftAssignmentStatus.CANCELLED)
                .anyMatch(i -> start.isBefore(LocalDateTime.parse(i.getEndAt()))
                            && LocalDateTime.parse(i.getStartAt()).isBefore(finalEnd));
    }

    private boolean respectsRest(String workerId, String date, ShiftTypeDocument shiftType,
                                  int minRestHours) {
        LocalDateTime start = combine(date, shiftType.getStartTime());
        return shiftAssignmentRepository.findByWorkerId(workerId).stream()
                .filter(i -> i.getStatus() != ShiftAssignmentStatus.CANCELLED)
                .noneMatch(i -> {
                    long hours = Duration.between(LocalDateTime.parse(i.getEndAt()), start).toHours();
                    return hours < minRestHours && hours > -24;
                });
    }

    private boolean respectsWeeklyHours(String workerId, String date, ShiftTypeDocument shiftType,
                                         int maxWeeklyHours) {
        LocalDate target    = LocalDate.parse(date);
        LocalDate weekStart = target.minusDays(target.getDayOfWeek().getValue() - 1L);
        LocalDate weekEnd   = weekStart.plusDays(6);
        double assignedHours = shiftAssignmentRepository
                .findByWorkerIdAndStartAtBetween(workerId,
                        weekStart.atStartOfDay().toString(),
                        weekEnd.plusDays(1).atStartOfDay().toString())
                .stream()
                .filter(i -> i.getStatus() != ShiftAssignmentStatus.CANCELLED)
                .mapToDouble(this::getAssignmentHours)
                .sum();
        return assignedHours + getShiftHours(shiftType, target) <= maxWeeklyHours;
    }

    private double calculateScore(String workerId, String date, ShiftTypeDocument shiftType) {
        LocalDate target     = LocalDate.parse(date);
        LocalDate monthStart = YearMonth.from(target).atDay(1);
        LocalDate monthEnd   = YearMonth.from(target).atEndOfMonth();
        List<ShiftAssignmentDocument> assignments = shiftAssignmentRepository
                .findByWorkerIdAndStartAtBetween(workerId,
                        monthStart.atStartOfDay().toString(),
                        monthEnd.plusDays(1).atStartOfDay().toString());
        long nightCount   = assignments.stream()
                .filter(i -> "NIGHT".equalsIgnoreCase(i.getShiftTypeCode())).count();
        long weekendCount = assignments.stream()
                .filter(i -> LocalDateTime.parse(i.getStartAt()).getDayOfWeek().getValue() >= 6)
                .count();
        double totalHours = assignments.stream().mapToDouble(this::getAssignmentHours).sum();
        double score = totalHours * 2 + weekendCount * 2;
        if ("NIGHT".equalsIgnoreCase(shiftType.getCode())) score += nightCount * 3;
        return score;
    }

    private ShiftAssignmentDocument buildAssignment(String hospitalId, UserDocument worker,
                                                     ShiftRequirementDocument requirement,
                                                     ShiftTypeDocument shiftType, int version) {
        LocalDateTime start = combine(requirement.getDate(), shiftType.getStartTime());
        LocalDateTime end   = combine(requirement.getDate(), shiftType.getEndTime());
        if (shiftType.isCrossesMidnight() || !end.isAfter(start)) end = end.plusDays(1);
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

    private double getAssignmentHours(ShiftAssignmentDocument a) {
        return Duration.between(
                LocalDateTime.parse(a.getStartAt()),
                LocalDateTime.parse(a.getEndAt())).toHours();
    }

    private double getShiftHours(ShiftTypeDocument shiftType, LocalDate date) {
        LocalDateTime start = combine(date.toString(), shiftType.getStartTime());
        LocalDateTime end   = combine(date.toString(), shiftType.getEndTime());
        if (shiftType.isCrossesMidnight() || !end.isAfter(start)) end = end.plusDays(1);
        return Duration.between(start, end).toHours();
    }

    private LocalDateTime combine(String date, String time) {
        return LocalDateTime.of(LocalDate.parse(date), LocalTime.parse(time));
    }

    private ShiftAssignmentDto toDto(ShiftAssignmentDocument d) {
        return ShiftAssignmentDto.builder()
                .id(d.getId())
                .hospitalId(d.getHospitalId())
                .workerId(d.getWorkerId())
                .workerFullName(d.getWorkerFullName())
                .department(d.getDepartment())
                .shiftTypeCode(d.getShiftTypeCode())
                .startAt(d.getStartAt())
                .endAt(d.getEndAt())
                .status(d.getStatus())
                .source(d.getSource())
                .version(d.getVersion())
                .createdAt(d.getCreatedAt())
                .updatedAt(d.getUpdatedAt())
                .build();
    }
}
