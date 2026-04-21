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
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Servicio de gestion de nominas.
 */
@Service
public class PayrollService {
    private final PayrollRepository payrollRepository;
    private final NotificationService notificationService;

    public PayrollService(PayrollRepository payrollRepository,
                          NotificationService notificationService) {
        this.payrollRepository = payrollRepository;
        this.notificationService = notificationService;
    }

    /**
     * Lista todas las nominas.
     */
    public List<PayrollDto> getAll() {
        List<PayrollDto> payrolls = new ArrayList<>();
        for (PayrollDocument document : payrollRepository.findAll()) {
            payrolls.add(toDto(document));
        }
        return payrolls;
    }

    /**
     * Lista las nominas de un trabajador.
     */
    public List<PayrollDto> getByWorker(String workerId) {
        List<PayrollDto> payrolls = new ArrayList<>();
        for (PayrollDocument document : payrollRepository.findByWorkerId(workerId)) {
            payrolls.add(toDto(document));
        }
        return payrolls;
    }

    /**
     * Obtiene una nomina por identificador.
     */
    public PayrollDto getById(String id) {
        return toDto(requirePayroll(id));
    }

    /**
     * Crea una nomina nueva en borrador.
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

        return toDto(payrollRepository.save(document));
    }

    /**
     * Actualiza el estado de una nomina existente.
     */
    public PayrollDto updateStatus(String id, PayrollStatus status) {
        if (status == null) {
            throw new BadRequestException("El estado es obligatorio");
        }

        PayrollDocument document = requirePayroll(id);
        document.setStatus(status);

        if (status == PayrollStatus.ACKNOWLEDGED) {
            document.setAcknowledgedAt(LocalDateTime.now().toString());
        }

        PayrollDocument saved = payrollRepository.save(document);
        notifyIfIssued(saved);
        return toDto(saved);
    }

    /**
     * Genera un contenido PDF muy simple para descarga.
     */
    public byte[] generatePdf(String id) {
        requirePayroll(id);
        String text = "Nomina #" + id + " - " + LocalDateTime.now();
        return text.getBytes();
    }

    /**
     * Lanza la notificacion cuando la nomina pasa a emitida.
     */
    private void notifyIfIssued(PayrollDocument document) {
        if (document.getStatus() == PayrollStatus.ISSUED) {
            notificationService.createNotification(
                    document.getWorkerId(),
                    NotificationType.PAYROLL_ISSUED,
                    "Tu nomina de " + document.getPeriod() + " ha sido emitida."
            );
        }
    }

    /**
     * Obtiene una nomina o lanza error.
     */
    private PayrollDocument requirePayroll(String id) {
        return payrollRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Nomina no encontrada"));
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
