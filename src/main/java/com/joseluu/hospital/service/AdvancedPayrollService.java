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

/**
 * Servicio encargado del calculo detallado de nominas.
 */
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

    /**
     * Genera o recalcula la nomina de un trabajador para un periodo.
     */
    public PayrollDto generate(String hospitalId, String workerId, String period, String actorUserId) {
        UserDocument worker = requireWorkerInHospital(hospitalId, workerId);
        WorkerContractDocument contract = workerContractRepository.findByWorkerIdAndActiveTrue(workerId)
                .orElseThrow(() -> new NotFoundException("Contrato no encontrado"));

        PeriodRange range = buildPeriodRange(period);
        List<ShiftAssignmentDocument> workedShifts = getWorkedShifts(workerId, range);
        List<LeaveRequestDocument> absences = getApprovedAbsences(workerId, period);
        List<PayrollAdjustmentDocument> adjustments = payrollAdjustmentRepository.findByWorkerIdAndPeriod(workerId, period);

        PayrollBreakdown breakdown = computeBreakdown(workedShifts, absences, contract);
        double bonuses = sumAdjustments(adjustments, PayrollAdjustmentType.BONUS);
        double penalties = sumAdjustments(adjustments, PayrollAdjustmentType.PENALTY);

        PayrollDocument payroll = buildPayroll(worker, hospitalId, period, breakdown, bonuses, penalties);
        PayrollDocument savedPayroll = payrollRepository.save(payroll);

        replacePayrollItems(savedPayroll.getId(), hospitalId, workerId, contract, breakdown, bonuses, penalties);
        notificationService.createNotification(workerId, NotificationType.PAYROLL_GENERATED, "Se ha generado la nomina del periodo " + period);
        auditLogService.log(
                hospitalId,
                actorUserId,
                "PAYROLL_GENERATED",
                "payrolls",
                savedPayroll.getId(),
                "Nomina generada para " + workerId + " en " + period
        );

        return toDto(savedPayroll);
    }

    /**
     * Devuelve las lineas de una nomina.
     */
    public List<PayrollItemDto> getItems(String payrollId) {
        List<PayrollItemDto> items = new ArrayList<>();
        for (PayrollItemDocument document : payrollItemRepository.findByPayrollId(payrollId)) {
            items.add(toItemDto(document));
        }
        return items;
    }

    /**
     * Crea un ajuste manual para una nomina.
     */
    public PayrollAdjustmentDto createAdjustment(PayrollAdjustmentDto dto) {
        PayrollAdjustmentDocument document = PayrollAdjustmentDocument.builder()
                .id(UUID.randomUUID().toString())
                .hospitalId(dto.getHospitalId())
                .workerId(dto.getWorkerId())
                .period(dto.getPeriod())
                .type(dto.getType())
                .description(dto.getDescription())
                .amount(dto.getAmount())
                .createdBy(dto.getCreatedBy())
                .createdAt(LocalDateTime.now().toString())
                .build();

        return toAdjustmentDto(payrollAdjustmentRepository.save(document));
    }

    /**
     * Obtiene el trabajador y valida su hospital.
     */
    private UserDocument requireWorkerInHospital(String hospitalId, String workerId) {
        UserDocument worker = userRepository.findById(workerId)
                .orElseThrow(() -> new NotFoundException("Trabajador no encontrado"));
        if (!hospitalId.equals(worker.getHospitalId())) {
            throw new NotFoundException("Trabajador fuera del hospital");
        }
        return worker;
    }

    /**
     * Construye el rango temporal de un periodo mensual.
     */
    private PeriodRange buildPeriodRange(String period) {
        YearMonth yearMonth = YearMonth.parse(period);
        String start = yearMonth.atDay(1).atStartOfDay().toString();
        String end = yearMonth.plusMonths(1).atDay(1).atStartOfDay().toString();
        return new PeriodRange(start, end);
    }

    /**
     * Obtiene los turnos realmente trabajados en el periodo.
     */
    private List<ShiftAssignmentDocument> getWorkedShifts(String workerId, PeriodRange range) {
        List<ShiftAssignmentDocument> shifts = new ArrayList<>();
        for (ShiftAssignmentDocument shift : shiftAssignmentRepository.findByWorkerIdAndStartAtBetween(workerId, range.start(), range.end())) {
            if (shift.getStatus() == ShiftAssignmentStatus.ASSIGNED || shift.getStatus() == ShiftAssignmentStatus.WORKED) {
                shifts.add(shift);
            }
        }
        return shifts;
    }

    /**
     * Obtiene las ausencias aprobadas que afectan al periodo.
     */
    private List<LeaveRequestDocument> getApprovedAbsences(String workerId, String period) {
        List<LeaveRequestDocument> absences = new ArrayList<>();
        for (LeaveRequestDocument request : leaveRequestRepository.findByUserId(workerId)) {
            boolean approved = "APPROVED".equals(request.getStatus().name());
            boolean affectsPeriod = request.getStartDate().startsWith(period) || request.getEndDate().startsWith(period);
            if (approved && affectsPeriod) {
                absences.add(request);
            }
        }
        return absences;
    }

    /**
     * Suma ajustes por tipo.
     */
    private double sumAdjustments(List<PayrollAdjustmentDocument> adjustments, PayrollAdjustmentType type) {
        double total = 0;
        for (PayrollAdjustmentDocument adjustment : adjustments) {
            if (adjustment.getType() == type) {
                total += adjustment.getAmount();
            }
        }
        return total;
    }

    /**
     * Prepara la nomina principal con todos sus totales.
     */
    private PayrollDocument buildPayroll(UserDocument worker,
                                         String hospitalId,
                                         String period,
                                         PayrollBreakdown breakdown,
                                         double bonuses,
                                         double penalties) {
        double grossSalary = breakdown.basePay
                + breakdown.nightBonus
                + breakdown.holidayBonus
                + breakdown.overtimePremium
                + bonuses
                - penalties
                - breakdown.unpaidAbsenceDeduction;
        double socialSecurity = round(grossSalary * 0.0635d);
        double incomeTax = round(grossSalary * 0.12d);
        double netSalary = round(grossSalary - socialSecurity - incomeTax);

        PayrollDocument payroll = findExistingPayroll(worker.getId(), period);
        payroll.setWorkerId(worker.getId());
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
        return payroll;
    }

    /**
     * Busca una nomina ya existente del periodo o crea una nueva base.
     */
    private PayrollDocument findExistingPayroll(String workerId, String period) {
        for (PayrollDocument payroll : payrollRepository.findByWorkerId(workerId)) {
            if (period.equals(payroll.getPeriod())) {
                return payroll;
            }
        }
        return PayrollDocument.builder().id(UUID.randomUUID().toString()).build();
    }

    /**
     * Sustituye todas las lineas de detalle de una nomina.
     */
    private void replacePayrollItems(String payrollId,
                                     String hospitalId,
                                     String workerId,
                                     WorkerContractDocument contract,
                                     PayrollBreakdown breakdown,
                                     double bonuses,
                                     double penalties) {
        List<PayrollItemDocument> existingItems = payrollItemRepository.findByPayrollId(payrollId);
        if (!existingItems.isEmpty()) {
            payrollItemRepository.deleteAll(existingItems);
        }

        payrollItemRepository.saveAll(buildItems(payrollId, hospitalId, workerId, contract, breakdown, bonuses, penalties));
    }

    /**
     * Calcula el desglose economico de la nomina.
     */
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

    /**
     * Construye todas las lineas de la nomina.
     */
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

        addPositiveItem(items, payrollId, hospitalId, workerId, PayrollItemType.NIGHT_BONUS,
                "Plus nocturnidad", breakdown.nightBonus);
        addPositiveItem(items, payrollId, hospitalId, workerId, PayrollItemType.HOLIDAY_BONUS,
                "Plus festivo o fin de semana", breakdown.holidayBonus);
        addPositiveItem(items, payrollId, hospitalId, workerId, PayrollItemType.OVERTIME,
                "Horas extra", breakdown.overtimePremium);
        addNegativeItem(items, payrollId, hospitalId, workerId, PayrollItemType.UNPAID_ABSENCE,
                "Ausencias no remuneradas", breakdown.unpaidAbsenceDeduction);
        addPositiveItem(items, payrollId, hospitalId, workerId, PayrollItemType.MANUAL_BONUS,
                "Bonificaciones manuales", bonuses);
        addNegativeItem(items, payrollId, hospitalId, workerId, PayrollItemType.MANUAL_PENALTY,
                "Penalizaciones manuales", penalties);

        return items;
    }

    /**
     * Agrega una linea positiva si el importe es mayor que cero.
     */
    private void addPositiveItem(List<PayrollItemDocument> items,
                                 String payrollId,
                                 String hospitalId,
                                 String workerId,
                                 PayrollItemType type,
                                 String description,
                                 double amount) {
        if (amount > 0) {
            items.add(item(payrollId, hospitalId, workerId, type, description, 1, round(amount), round(amount)));
        }
    }

    /**
     * Agrega una linea negativa si el importe es mayor que cero.
     */
    private void addNegativeItem(List<PayrollItemDocument> items,
                                 String payrollId,
                                 String hospitalId,
                                 String workerId,
                                 PayrollItemType type,
                                 String description,
                                 double amount) {
        if (amount > 0) {
            double rounded = round(amount);
            items.add(item(payrollId, hospitalId, workerId, type, description, 1, -rounded, -rounded));
        }
    }

    /**
     * Crea una linea concreta de nomina.
     */
    private PayrollItemDocument item(String payrollId,
                                     String hospitalId,
                                     String workerId,
                                     PayrollItemType type,
                                     String description,
                                     double quantity,
                                     double unitAmount,
                                     double totalAmount) {
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

    /**
     * Convierte la entidad de nomina a DTO.
     */
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

    /**
     * Convierte una linea de nomina a DTO.
     */
    private PayrollItemDto toItemDto(PayrollItemDocument document) {
        return PayrollItemDto.builder()
                .id(document.getId())
                .payrollId(document.getPayrollId())
                .workerId(document.getWorkerId())
                .hospitalId(document.getHospitalId())
                .type(document.getType())
                .description(document.getDescription())
                .quantity(document.getQuantity())
                .unitAmount(document.getUnitAmount())
                .totalAmount(document.getTotalAmount())
                .build();
    }

    /**
     * Convierte un ajuste a DTO.
     */
    private PayrollAdjustmentDto toAdjustmentDto(PayrollAdjustmentDocument document) {
        return PayrollAdjustmentDto.builder()
                .id(document.getId())
                .hospitalId(document.getHospitalId())
                .workerId(document.getWorkerId())
                .period(document.getPeriod())
                .type(document.getType())
                .description(document.getDescription())
                .amount(document.getAmount())
                .createdBy(document.getCreatedBy())
                .createdAt(document.getCreatedAt())
                .build();
    }

    /**
     * Redondea un valor a dos decimales.
     */
    private double round(double value) {
        return Math.round(value * 100.0d) / 100.0d;
    }

    /**
     * Record auxiliar para el rango de un periodo.
     */
    private record PeriodRange(String start, String end) {
    }

    /**
     * Clase auxiliar con el desglose intermedio del calculo.
     */
    private static class PayrollBreakdown {
        private double baseHours;
        private double basePay;
        private double nightBonus;
        private double holidayBonus;
        private double overtimePremium;
        private double unpaidAbsenceDeduction;
    }
}
