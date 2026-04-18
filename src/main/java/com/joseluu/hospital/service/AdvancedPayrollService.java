package com.joseluu.hospital.service;

import com.joseluu.hospital.dto.PayrollAdjustmentDto;
import com.joseluu.hospital.dto.PayrollDto;
import com.joseluu.hospital.dto.PayrollItemDto;
import com.joseluu.hospital.entity.LeaveRequestDocument;
import com.joseluu.hospital.entity.PayrollAdjustmentDocument;
import com.joseluu.hospital.entity.PayrollDocument;
import com.joseluu.hospital.entity.PayrollItemDocument;
import com.joseluu.hospital.entity.ShiftAssignmentDocument;
import com.joseluu.hospital.entity.UserDocument;
import com.joseluu.hospital.entity.WorkerContractDocument;
import com.joseluu.hospital.entity.enums.NotificationType;
import com.joseluu.hospital.entity.enums.PayrollAdjustmentType;
import com.joseluu.hospital.entity.enums.PayrollItemType;
import com.joseluu.hospital.entity.enums.PayrollStatus;
import com.joseluu.hospital.entity.enums.ShiftAssignmentStatus;
import com.joseluu.hospital.exception.NotFoundException;
import com.joseluu.hospital.repository.LeaveRequestRepository;
import com.joseluu.hospital.repository.PayrollAdjustmentRepository;
import com.joseluu.hospital.repository.PayrollItemRepository;
import com.joseluu.hospital.repository.PayrollRepository;
import com.joseluu.hospital.repository.ShiftAssignmentRepository;
import com.joseluu.hospital.repository.UserRepository;
import com.joseluu.hospital.repository.WorkerContractRepository;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AdvancedPayrollService {
    private final PayrollRepository payrollRepository;
    private final PayrollItemRepository payrollItemRepository;
    private final PayrollAdjustmentRepository payrollAdjustmentRepository;
    private final ShiftAssignmentRepository shiftAssignmentRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final WorkerContractRepository workerContractRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;

    public AdvancedPayrollService(PayrollRepository payrollRepository,
                                  PayrollItemRepository payrollItemRepository,
                                  PayrollAdjustmentRepository payrollAdjustmentRepository,
                                  ShiftAssignmentRepository shiftAssignmentRepository,
                                  LeaveRequestRepository leaveRequestRepository,
                                  WorkerContractRepository workerContractRepository,
                                  UserRepository userRepository,
                                  NotificationService notificationService,
                                  AuditLogService auditLogService) {
        this.payrollRepository = payrollRepository;
        this.payrollItemRepository = payrollItemRepository;
        this.payrollAdjustmentRepository = payrollAdjustmentRepository;
        this.shiftAssignmentRepository = shiftAssignmentRepository;
        this.leaveRequestRepository = leaveRequestRepository;
        this.workerContractRepository = workerContractRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.auditLogService = auditLogService;
    }

    public PayrollDto generate(String hospitalId, String workerId, String period, String actorUserId) {
        UserDocument worker = userRepository.findById(workerId)
                .orElseThrow(() -> new NotFoundException("Trabajador no encontrado"));
        if (!hospitalId.equals(worker.getHospitalId())) {
            throw new NotFoundException("Trabajador fuera del hospital");
        }
        WorkerContractDocument contract = workerContractRepository.findByWorkerIdAndActiveTrue(workerId)
                .orElseThrow(() -> new NotFoundException("Contrato no encontrado"));

        YearMonth yearMonth = YearMonth.parse(period);
        String start = yearMonth.atDay(1).atStartOfDay().toString();
        String end = yearMonth.plusMonths(1).atDay(1).atStartOfDay().toString();

        List<ShiftAssignmentDocument> workedShifts = shiftAssignmentRepository.findByWorkerIdAndStartAtBetween(workerId, start, end).stream()
                .filter(item -> item.getStatus() == ShiftAssignmentStatus.ASSIGNED || item.getStatus() == ShiftAssignmentStatus.WORKED)
                .toList();
        List<LeaveRequestDocument> absences = leaveRequestRepository.findByUserId(workerId).stream()
                .filter(item -> "APPROVED".equals(item.getStatus().name()))
                .filter(item -> item.getStartDate().startsWith(period) || item.getEndDate().startsWith(period))
                .toList();
        List<PayrollAdjustmentDocument> adjustments = payrollAdjustmentRepository.findByWorkerIdAndPeriod(workerId, period);

        PayrollBreakdown breakdown = computeBreakdown(workedShifts, absences, contract);
        double bonuses = adjustments.stream()
                .filter(item -> item.getType() == PayrollAdjustmentType.BONUS)
                .mapToDouble(PayrollAdjustmentDocument::getAmount)
                .sum();
        double penalties = adjustments.stream()
                .filter(item -> item.getType() == PayrollAdjustmentType.PENALTY)
                .mapToDouble(PayrollAdjustmentDocument::getAmount)
                .sum();

        double grossSalary = breakdown.basePay + breakdown.nightBonus + breakdown.holidayBonus + breakdown.overtimePremium
                + bonuses - penalties - breakdown.unpaidAbsenceDeduction;
        double socialSecurity = round(grossSalary * 0.0635d);
        double incomeTax = round(grossSalary * 0.12d);
        double netSalary = round(grossSalary - socialSecurity - incomeTax);

        PayrollDocument payroll = payrollRepository.findByWorkerId(workerId).stream()
                .filter(item -> period.equals(item.getPeriod()))
                .findFirst()
                .orElse(PayrollDocument.builder().id(UUID.randomUUID().toString()).build());
        payroll.setWorkerId(workerId);
        payroll.setWorkerFullName(worker.getFirstName() + " " + worker.getLastName());
        payroll.setHospitalId(hospitalId);
        payroll.setPeriod(period);
        payroll.setGrossSalary(round(grossSalary));
        payroll.setSocialSecurityWorker(socialSecurity);
        payroll.setIncomeTaxWithholding(incomeTax);
        payroll.setOtherDeductions(round(breakdown.unpaidAbsenceDeduction + penalties));
        payroll.setNetSalary(netSalary);
        payroll.setOvertimeAmount(round(breakdown.overtimePremium));
        payroll.setBonusAmount(round(breakdown.nightBonus + breakdown.holidayBonus + bonuses));
        payroll.setStatus(PayrollStatus.DRAFT);
        payroll.setIssuedAt(LocalDateTime.now().toString());
        PayrollDocument savedPayroll = payrollRepository.save(payroll);

        List<PayrollItemDocument> existingItems = payrollItemRepository.findByPayrollId(savedPayroll.getId());
        if (!existingItems.isEmpty()) {
            payrollItemRepository.deleteAll(existingItems);
        }
        payrollItemRepository.saveAll(buildItems(savedPayroll.getId(), hospitalId, workerId, contract, breakdown, bonuses, penalties));

        notificationService.createNotification(workerId, NotificationType.PAYROLL_GENERATED,
                "Se ha generado la nomina del periodo " + period);
        auditLogService.log(hospitalId, actorUserId, "PAYROLL_GENERATED", "payrolls", savedPayroll.getId(),
                "Nomina generada para " + workerId + " en " + period);
        return toDto(savedPayroll);
    }

    public List<PayrollItemDto> getItems(String payrollId) {
        return payrollItemRepository.findByPayrollId(payrollId).stream()
                .map(document -> PayrollItemDto.builder()
                        .id(document.getId())
                        .payrollId(document.getPayrollId())
                        .workerId(document.getWorkerId())
                        .hospitalId(document.getHospitalId())
                        .type(document.getType())
                        .description(document.getDescription())
                        .quantity(document.getQuantity())
                        .unitAmount(document.getUnitAmount())
                        .totalAmount(document.getTotalAmount())
                        .build())
                .collect(Collectors.toList());
    }

    public PayrollAdjustmentDto createAdjustment(PayrollAdjustmentDto dto) {
        PayrollAdjustmentDocument saved = payrollAdjustmentRepository.save(PayrollAdjustmentDocument.builder()
                .id(UUID.randomUUID().toString())
                .hospitalId(dto.getHospitalId())
                .workerId(dto.getWorkerId())
                .period(dto.getPeriod())
                .type(dto.getType())
                .description(dto.getDescription())
                .amount(dto.getAmount())
                .createdBy(dto.getCreatedBy())
                .createdAt(LocalDateTime.now().toString())
                .build());
        return PayrollAdjustmentDto.builder()
                .id(saved.getId())
                .hospitalId(saved.getHospitalId())
                .workerId(saved.getWorkerId())
                .period(saved.getPeriod())
                .type(saved.getType())
                .description(saved.getDescription())
                .amount(saved.getAmount())
                .createdBy(saved.getCreatedBy())
                .createdAt(saved.getCreatedAt())
                .build();
    }

    private PayrollBreakdown computeBreakdown(List<ShiftAssignmentDocument> workedShifts,
                                              List<LeaveRequestDocument> absences,
                                              WorkerContractDocument contract) {
        PayrollBreakdown breakdown = new PayrollBreakdown();
        for (ShiftAssignmentDocument shift : workedShifts) {
            LocalDateTime start = LocalDateTime.parse(shift.getStartAt());
            LocalDateTime end = LocalDateTime.parse(shift.getEndAt());
            double hours = Duration.between(start, end).toHours();
            breakdown.baseHours += hours;
            breakdown.basePay += hours * contract.getHourlyRate();
            if ("NIGHT".equalsIgnoreCase(shift.getShiftTypeCode())) {
                breakdown.nightBonus += hours * contract.getHourlyRate() * contract.getNightBonusPct();
            }
            if (start.getDayOfWeek().getValue() >= 6) {
                breakdown.holidayBonus += hours * contract.getHourlyRate() * contract.getHolidayBonusPct();
            }
        }

        double monthlyExpectedHours = contract.getWeeklyHours() * 4.0d;
        if (breakdown.baseHours > monthlyExpectedHours) {
            double overtimeHours = breakdown.baseHours - monthlyExpectedHours;
            breakdown.overtimePremium = overtimeHours * contract.getHourlyRate() * (contract.getOvertimeMultiplier() - 1.0d);
        }
        long unpaidDays = absences.stream().filter(item -> !item.isPaid()).count();
        breakdown.unpaidAbsenceDeduction = unpaidDays * 8.0d * contract.getHourlyRate();
        return breakdown;
    }

    private List<PayrollItemDocument> buildItems(String payrollId,
                                                 String hospitalId,
                                                 String workerId,
                                                 WorkerContractDocument contract,
                                                 PayrollBreakdown breakdown,
                                                 double bonuses,
                                                 double penalties) {
        List<PayrollItemDocument> items = new ArrayList<>();
        items.add(item(payrollId, hospitalId, workerId, PayrollItemType.BASE_HOURS, "Horas base",
                breakdown.baseHours, contract.getHourlyRate(), round(breakdown.basePay)));
        if (breakdown.nightBonus > 0) {
            items.add(item(payrollId, hospitalId, workerId, PayrollItemType.NIGHT_BONUS, "Plus nocturnidad",
                    1, round(breakdown.nightBonus), round(breakdown.nightBonus)));
        }
        if (breakdown.holidayBonus > 0) {
            items.add(item(payrollId, hospitalId, workerId, PayrollItemType.HOLIDAY_BONUS, "Plus festivo o fin de semana",
                    1, round(breakdown.holidayBonus), round(breakdown.holidayBonus)));
        }
        if (breakdown.overtimePremium > 0) {
            items.add(item(payrollId, hospitalId, workerId, PayrollItemType.OVERTIME, "Horas extra",
                    1, round(breakdown.overtimePremium), round(breakdown.overtimePremium)));
        }
        if (breakdown.unpaidAbsenceDeduction > 0) {
            items.add(item(payrollId, hospitalId, workerId, PayrollItemType.UNPAID_ABSENCE, "Ausencias no remuneradas",
                    1, -round(breakdown.unpaidAbsenceDeduction), -round(breakdown.unpaidAbsenceDeduction)));
        }
        if (bonuses > 0) {
            items.add(item(payrollId, hospitalId, workerId, PayrollItemType.MANUAL_BONUS, "Bonificaciones manuales",
                    1, round(bonuses), round(bonuses)));
        }
        if (penalties > 0) {
            items.add(item(payrollId, hospitalId, workerId, PayrollItemType.MANUAL_PENALTY, "Penalizaciones manuales",
                    1, -round(penalties), -round(penalties)));
        }
        return items;
    }

    private PayrollItemDocument item(String payrollId, String hospitalId, String workerId, PayrollItemType type,
                                     String description, double quantity, double unitAmount, double totalAmount) {
        return PayrollItemDocument.builder()
                .id(UUID.randomUUID().toString())
                .payrollId(payrollId)
                .workerId(workerId)
                .hospitalId(hospitalId)
                .type(type)
                .description(description)
                .quantity(round(quantity))
                .unitAmount(round(unitAmount))
                .totalAmount(round(totalAmount))
                .build();
    }

    private PayrollDto toDto(PayrollDocument document) {
        return PayrollDto.builder()
                .id(document.getId())
                .workerId(document.getWorkerId())
                .workerFullName(document.getWorkerFullName())
                .hospitalId(document.getHospitalId())
                .period(document.getPeriod())
                .grossSalary(document.getGrossSalary())
                .socialSecurityWorker(document.getSocialSecurityWorker())
                .incomeTaxWithholding(document.getIncomeTaxWithholding())
                .otherDeductions(document.getOtherDeductions())
                .netSalary(document.getNetSalary())
                .overtimeAmount(document.getOvertimeAmount())
                .bonusAmount(document.getBonusAmount())
                .pdfPath(document.getPdfPath())
                .status(document.getStatus())
                .acknowledgedAt(document.getAcknowledgedAt())
                .issuedAt(document.getIssuedAt())
                .build();
    }

    private double round(double value) {
        return Math.round(value * 100.0d) / 100.0d;
    }

    private static class PayrollBreakdown {
        private double baseHours;
        private double basePay;
        private double nightBonus;
        private double holidayBonus;
        private double overtimePremium;
        private double unpaidAbsenceDeduction;
    }
}
