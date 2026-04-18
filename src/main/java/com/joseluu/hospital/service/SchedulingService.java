package com.joseluu.hospital.service;

import com.joseluu.hospital.dto.HospitalSettingsDto;
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

    public ShiftRequirementDto createRequirement(String hospitalId, ShiftRequirementDto dto) {
        ShiftRequirementDocument saved = shiftRequirementRepository.save(ShiftRequirementDocument.builder()
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

    public List<ShiftAssignmentDto> autoAssign(String hospitalId, String actorUserId, String startDate, String endDate) {
        HospitalSettingsDto settings = hospitalSettingsService.getByHospital(hospitalId);
        List<ShiftRequirementDocument> requirements = shiftRequirementRepository.findByHospitalIdAndDateBetween(hospitalId, startDate, endDate);
        List<UserDocument> workers = userRepository.findByHospitalIdAndRole(hospitalId, UserRole.WORKER);
        int version = shiftAssignmentRepository.findByHospitalId(hospitalId).stream()
                .map(ShiftAssignmentDocument::getVersion)
                .max(Integer::compareTo)
                .orElse(0) + 1;

        List<ShiftAssignmentDto> assignments = new ArrayList<>();
        for (ShiftRequirementDocument requirement : requirements.stream()
                .sorted(Comparator.comparing(ShiftRequirementDocument::getDate).thenComparing(ShiftRequirementDocument::getShiftTypeCode))
                .toList()) {
            ShiftTypeDocument shiftType = shiftTypeRepository.findByHospitalIdAndCode(hospitalId, requirement.getShiftTypeCode())
                    .orElseThrow(() -> new NotFoundException("Tipo de turno no encontrado"));

            List<UserDocument> candidates = workers.stream()
                    .filter(worker -> requirement.getDepartment().equalsIgnoreCase(worker.getDepartment()))
                    .filter(worker -> !isOnApprovedLeave(worker.getId(), requirement.getDate()))
                    .filter(worker -> !hasOverlap(worker.getId(), requirement.getDate(), shiftType))
                    .filter(worker -> respectsRest(worker.getId(), requirement.getDate(), shiftType, settings.getMinRestHours()))
                    .filter(worker -> respectsWeeklyHours(worker.getId(), requirement.getDate(), shiftType, settings.getMaxWeeklyHours()))
                    .sorted(Comparator.comparingDouble(worker -> calculateScore(worker.getId(), requirement.getDate(), shiftType)))
                    .collect(Collectors.toList());

            int covered = 0;
            for (UserDocument candidate : candidates) {
                if (covered >= requirement.getRequiredWorkers()) {
                    break;
                }
                ShiftAssignmentDocument saved = shiftAssignmentRepository.save(buildAssignment(hospitalId, candidate, requirement, shiftType, version));
                assignments.add(toDto(saved));
                covered++;
                notificationService.createNotification(candidate.getId(), NotificationType.SHIFT_ASSIGNED,
                        "Nuevo turno asignado para " + requirement.getDate() + " (" + requirement.getShiftTypeCode() + ")");
            }
            if (covered < requirement.getRequiredWorkers()) {
                userRepository.findByHospitalIdAndRole(hospitalId, UserRole.HOSPITAL_ADMIN).forEach(admin ->
                        notificationService.createNotification(admin.getId(), NotificationType.SHIFT_UNCOVERED,
                                "Cobertura incompleta en " + requirement.getDepartment() + " para " + requirement.getDate()));
            }
        }

        auditLogService.log(hospitalId, actorUserId, "SHIFT_AUTO_ASSIGNED", "shift_assignments", hospitalId,
                "Asignacion automatica entre " + startDate + " y " + endDate);
        return assignments;
    }

    public List<ShiftAssignmentDto> getAssignmentsForWorker(String workerId) {
        return shiftAssignmentRepository.findByWorkerId(workerId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    private boolean isOnApprovedLeave(String workerId, String date) {
        LocalDate target = LocalDate.parse(date);
        return leaveRequestRepository.findByUserId(workerId).stream()
                .filter(request -> "APPROVED".equals(request.getStatus().name()))
                .anyMatch(request -> !target.isBefore(LocalDate.parse(request.getStartDate()))
                        && !target.isAfter(LocalDate.parse(request.getEndDate())));
    }

    private boolean hasOverlap(String workerId, String date, ShiftTypeDocument shiftType) {
        LocalDateTime start = combine(date, shiftType.getStartTime());
        LocalDateTime end = combine(date, shiftType.getEndTime());
        if (shiftType.isCrossesMidnight() || !end.isAfter(start)) {
            end = end.plusDays(1);
        }
        LocalDateTime finalEnd = end;
        return shiftAssignmentRepository.findByWorkerId(workerId).stream()
                .filter(item -> item.getStatus() != ShiftAssignmentStatus.CANCELLED)
                .anyMatch(item -> start.isBefore(LocalDateTime.parse(item.getEndAt()))
                        && LocalDateTime.parse(item.getStartAt()).isBefore(finalEnd));
    }

    private boolean respectsRest(String workerId, String date, ShiftTypeDocument shiftType, int minRestHours) {
        LocalDateTime start = combine(date, shiftType.getStartTime());
        return shiftAssignmentRepository.findByWorkerId(workerId).stream()
                .filter(item -> item.getStatus() != ShiftAssignmentStatus.CANCELLED)
                .noneMatch(item -> {
                    long hours = Duration.between(LocalDateTime.parse(item.getEndAt()), start).toHours();
                    return hours < minRestHours && hours > -24;
                });
    }

    private boolean respectsWeeklyHours(String workerId, String date, ShiftTypeDocument shiftType, int maxWeeklyHours) {
        LocalDate target = LocalDate.parse(date);
        LocalDate weekStart = target.minusDays(target.getDayOfWeek().getValue() - 1L);
        LocalDate weekEnd = weekStart.plusDays(6);
        double assignedHours = shiftAssignmentRepository.findByWorkerIdAndStartAtBetween(
                        workerId, weekStart.atStartOfDay().toString(), weekEnd.plusDays(1).atStartOfDay().toString()).stream()
                .filter(item -> item.getStatus() != ShiftAssignmentStatus.CANCELLED)
                .mapToDouble(this::getAssignmentHours)
                .sum();

        return assignedHours + getShiftHours(shiftType, target) <= maxWeeklyHours;
    }

    private double calculateScore(String workerId, String date, ShiftTypeDocument shiftType) {
        LocalDate target = LocalDate.parse(date);
        LocalDate monthStart = YearMonth.from(target).atDay(1);
        LocalDate monthEnd = YearMonth.from(target).atEndOfMonth();
        List<ShiftAssignmentDocument> assignments = shiftAssignmentRepository.findByWorkerIdAndStartAtBetween(
                workerId, monthStart.atStartOfDay().toString(), monthEnd.plusDays(1).atStartOfDay().toString());
        long nightCount = assignments.stream().filter(item -> "NIGHT".equalsIgnoreCase(item.getShiftTypeCode())).count();
        long weekendCount = assignments.stream().filter(item -> {
            int dayOfWeek = LocalDateTime.parse(item.getStartAt()).getDayOfWeek().getValue();
            return dayOfWeek >= 6;
        }).count();
        double totalHours = assignments.stream().mapToDouble(this::getAssignmentHours).sum();
        double score = totalHours * 2 + weekendCount * 2;
        if ("NIGHT".equalsIgnoreCase(shiftType.getCode())) {
            score += nightCount * 3;
        }
        return score;
    }

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

    private double getAssignmentHours(ShiftAssignmentDocument assignment) {
        return Duration.between(LocalDateTime.parse(assignment.getStartAt()), LocalDateTime.parse(assignment.getEndAt())).toHours();
    }

    private double getShiftHours(ShiftTypeDocument shiftType, LocalDate date) {
        LocalDateTime start = combine(date.toString(), shiftType.getStartTime());
        LocalDateTime end = combine(date.toString(), shiftType.getEndTime());
        if (shiftType.isCrossesMidnight() || !end.isAfter(start)) {
            end = end.plusDays(1);
        }
        return Duration.between(start, end).toHours();
    }

    private LocalDateTime combine(String date, String time) {
        return LocalDateTime.of(LocalDate.parse(date), LocalTime.parse(time));
    }

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
}
