package com.joseluu.hospital.service;

import com.joseluu.hospital.dto.PayrollDto;
import com.joseluu.hospital.entity.PayrollDocument;
import com.joseluu.hospital.entity.enums.NotificationType;
import com.joseluu.hospital.entity.enums.PayrollStatus;
import com.joseluu.hospital.exception.BadRequestException;
import com.joseluu.hospital.exception.NotFoundException;
import com.joseluu.hospital.repository.PayrollRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Servicio de gestion de nominas.
 */
@Service
public class PayrollService {
    private final PayrollRepository payrollRepository;
    private final NotificationService notificationService;

    public PayrollService(PayrollRepository payrollRepository, NotificationService notificationService) {
        this.payrollRepository = payrollRepository;
        this.notificationService = notificationService;
    }

    /**
     * Lista todas las nominas.
     */
    public List<PayrollDto> getAll() {
        return payrollRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Lista nominas asociadas a un trabajador.
     */
    public List<PayrollDto> getByWorker(String workerId) {
        return payrollRepository.findByWorkerId(workerId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene una nomina por id.
     */
    public PayrollDto getById(String id) {
        return payrollRepository.findById(id)
                .map(this::toDto)
                .orElseThrow(() -> new NotFoundException("Nómina no encontrada"));
    }

    /**
     * Crea una nomina en estado borrador.
     */
    public PayrollDto create(PayrollDto input) {
        PayrollDocument document = PayrollDocument.builder()
                .id(UUID.randomUUID().toString())
                .workerId(input.getWorkerId())
                .workerFullName(input.getWorkerFullName())
                .hospitalId(input.getHospitalId())
                .period(input.getPeriod())
                .grossSalary(input.getGrossSalary())
                .socialSecurityWorker(input.getSocialSecurityWorker())
                .incomeTaxWithholding(input.getIncomeTaxWithholding())
                .otherDeductions(input.getOtherDeductions())
                .netSalary(input.getNetSalary())
                .overtimeAmount(input.getOvertimeAmount())
                .bonusAmount(input.getBonusAmount())
                .status(PayrollStatus.DRAFT)
                .issuedAt(LocalDateTime.now().toString())
                .build();
        PayrollDto dto = toDto(payrollRepository.save(document));
        if (dto.getStatus() == PayrollStatus.ISSUED) {
            notificationService.createNotification(dto.getWorkerId(), NotificationType.PAYROLL_ISSUED, "Tu nómina de " + dto.getPeriod() + " ha sido emitida.");
        }
        return dto;
    }

    /**
     * Actualiza el estado de una nomina.
     */
    public PayrollDto updateStatus(String id, PayrollStatus status) {
        if (status == null) {
            throw new BadRequestException("El estado es obligatorio");
        }
        PayrollDocument document = payrollRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Nómina no encontrada"));
        document.setStatus(status);
        if (status == PayrollStatus.ACKNOWLEDGED) {
            document.setAcknowledgedAt(LocalDateTime.now().toString());
        }
        PayrollDto dto = toDto(payrollRepository.save(document));
        if (dto.getStatus() == PayrollStatus.ISSUED) {
            notificationService.createNotification(dto.getWorkerId(), NotificationType.PAYROLL_ISSUED, "Tu nómina de " + dto.getPeriod() + " ha sido emitida.");
        }
        return dto;
    }

    /**
     * Genera un PDF simple con la nomina.
     */
    public byte[] generatePdf(String id) {
        payrollRepository.findById(id).orElseThrow(() -> new NotFoundException("Nómina no encontrada"));
        String text = "Nómina #" + id + " - " + LocalDateTime.now();
        return text.getBytes();
    }

    /**
     * Convierte la entidad persistida a DTO.
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
}
