package com.joseluu.hospital.service;

import com.joseluu.hospital.dto.PayrollDto;
import com.joseluu.hospital.entity.PayrollDocument;
import com.joseluu.hospital.entity.PayrollItemDocument;
import com.joseluu.hospital.entity.enums.NotificationType;
import com.joseluu.hospital.entity.enums.PayrollStatus;
import com.joseluu.hospital.exception.BadRequestException;
import com.joseluu.hospital.exception.NotFoundException;
import com.joseluu.hospital.repository.PayrollItemRepository;
import com.joseluu.hospital.repository.PayrollRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

/**
 * Servicio de gestion de nominas.
 */
@Service
public class PayrollService {
    private final PayrollRepository payrollRepository;
    private final PayrollItemRepository payrollItemRepository;
    private final NotificationService notificationService;

    public PayrollService(PayrollRepository payrollRepository,
                          PayrollItemRepository payrollItemRepository,
                          NotificationService notificationService) {
        this.payrollRepository = payrollRepository;
        this.payrollItemRepository = payrollItemRepository;
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
     * Genera un PDF simple con el detalle de la nomina.
     */
    public byte[] generatePdf(String id) {
        PayrollDocument payroll = requirePayroll(id);
        List<PayrollItemDocument> items = new ArrayList<>(payrollItemRepository.findByPayrollId(id));
        items.sort(Comparator.comparing(PayrollItemDocument::getDescription, String.CASE_INSENSITIVE_ORDER));

        return buildSimplePdf(buildPdfLines(payroll, items));
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

    /**
     * Formatea importes monetarios de forma estable para la descarga.
     */
    private String formatAmount(double amount) {
        return String.format(Locale.US, "%.2f EUR", amount);
    }

    /**
     * Formatea cantidades sin ruido decimal innecesario.
     */
    private String formatQuantity(double quantity) {
        if (Math.rint(quantity) == quantity) {
            return String.format(Locale.US, "%.0f", quantity);
        }
        return String.format(Locale.US, "%.2f", quantity);
    }

    /**
     * Construye las lineas de texto que se renderizan en el PDF.
     */
    private List<String> buildPdfLines(PayrollDocument payroll, List<PayrollItemDocument> items) {
        List<String> lines = new ArrayList<>();
        lines.add("NOMINA / FACTURA INTERNA");
        lines.add("Referencia: " + payroll.getId());
        lines.add("Trabajador: " + sanitizePdfText(payroll.getWorkerFullName()));
        lines.add("Periodo: " + payroll.getPeriod());
        lines.add("Estado: " + payroll.getStatus());
        lines.add("Emitida: " + sanitizePdfText(payroll.getIssuedAt()));
        lines.add("");
        lines.add("RESUMEN ECONOMICO");
        lines.add("Bruto: " + formatAmount(payroll.getGrossSalary()));
        lines.add("Seguridad Social: " + formatAmount(-payroll.getSocialSecurityWorker()));
        lines.add("IRPF: " + formatAmount(-payroll.getIncomeTaxWithholding()));
        lines.add("Otras deducciones: " + formatAmount(-payroll.getOtherDeductions()));
        lines.add("Neto: " + formatAmount(payroll.getNetSalary()));
        lines.add("");
        lines.add("DETALLE DE GENERACION");

        if (items.isEmpty()) {
            lines.add("- No hay lineas de detalle registradas.");
        } else {
            for (PayrollItemDocument item : items) {
                lines.addAll(wrapLine(
                        "- " + sanitizePdfText(item.getDescription())
                                + " | cantidad: " + formatQuantity(item.getQuantity())
                                + " | unitario: " + formatAmount(item.getUnitAmount())
                                + " | total: " + formatAmount(item.getTotalAmount()),
                        95
                ));
            }
        }

        lines.add("");
        lines.add("OBSERVACIONES");
        lines.addAll(wrapLine(
                "La generacion incluye explicacion de vacaciones, dias solicitados, horas extra, nocturnidad y ajustes manuales cuando existen en el periodo.",
                95
        ));
        return lines;
    }

    /**
     * Genera un PDF basico con texto monoflujo y varias paginas si hace falta.
     */
    private byte[] buildSimplePdf(List<String> lines) {
        final int linesPerPage = 42;
        List<List<String>> pages = new ArrayList<>();
        for (int index = 0; index < lines.size(); index += linesPerPage) {
            pages.add(lines.subList(index, Math.min(index + linesPerPage, lines.size())));
        }
        if (pages.isEmpty()) {
            pages.add(List.of("Nomina sin contenido"));
        }

        List<String> objects = new ArrayList<>();
        objects.add("<< /Type /Catalog /Pages 2 0 R >>");

        StringBuilder kids = new StringBuilder("[ ");
        int firstPageObject = 4;
        for (int index = 0; index < pages.size(); index++) {
            kids.append(firstPageObject + (index * 2)).append(" 0 R ");
        }
        kids.append("]");
        objects.add("<< /Type /Pages /Count " + pages.size() + " /Kids " + kids + " >>");
        objects.add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

        for (int index = 0; index < pages.size(); index++) {
            int pageObjectNumber = firstPageObject + (index * 2);
            int contentObjectNumber = pageObjectNumber + 1;
            objects.add("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents " + contentObjectNumber + " 0 R >>");

            String content = buildPageContent(pages.get(index), index + 1, pages.size());
            int contentLength = content.getBytes(java.nio.charset.StandardCharsets.US_ASCII).length;
            objects.add("<< /Length " + contentLength + " >>\nstream\n" + content + "\nendstream");
        }

        return assemblePdf(objects);
    }

    /**
     * Monta el flujo de texto de una pagina concreta.
     */
    private String buildPageContent(List<String> pageLines, int pageNumber, int totalPages) {
        StringBuilder content = new StringBuilder();
        content.append("BT\n");
        content.append("/F1 11 Tf\n");
        content.append("50 790 Td\n");
        content.append("14 TL\n");

        for (int index = 0; index < pageLines.size(); index++) {
            if (index > 0) {
                content.append("T*\n");
            }
            content.append("(").append(escapePdfText(pageLines.get(index))).append(") Tj\n");
        }

        content.append("ET\n");
        content.append("BT\n");
        content.append("/F1 9 Tf\n");
        content.append("50 30 Td\n");
        content.append("(").append(escapePdfText("Pagina " + pageNumber + " de " + totalPages)).append(") Tj\n");
        content.append("ET");
        return content.toString();
    }

    /**
     * Ensambla el documento PDF final con tabla xref.
     */
    private byte[] assemblePdf(List<String> objects) {
        StringBuilder pdf = new StringBuilder("%PDF-1.4\n");
        List<Integer> offsets = new ArrayList<>();
        offsets.add(0);

        for (int index = 0; index < objects.size(); index++) {
            offsets.add(pdf.length());
            pdf.append(index + 1).append(" 0 obj\n");
            pdf.append(objects.get(index)).append('\n');
            pdf.append("endobj\n");
        }

        int xrefOffset = pdf.length();
        pdf.append("xref\n");
        pdf.append("0 ").append(objects.size() + 1).append('\n');
        pdf.append("0000000000 65535 f \n");
        for (int index = 1; index < offsets.size(); index++) {
            pdf.append(String.format(Locale.US, "%010d 00000 n \n", offsets.get(index)));
        }

        pdf.append("trailer\n");
        pdf.append("<< /Size ").append(objects.size() + 1).append(" /Root 1 0 R >>\n");
        pdf.append("startxref\n");
        pdf.append(xrefOffset).append('\n');
        pdf.append("%%EOF");
        return pdf.toString().getBytes(java.nio.charset.StandardCharsets.US_ASCII);
    }

    /**
     * Ajusta lineas largas para que no se salgan del ancho de pagina.
     */
    private List<String> wrapLine(String text, int maxLength) {
        List<String> result = new ArrayList<>();
        String remaining = text == null ? "" : text.trim();
        while (remaining.length() > maxLength) {
            int splitAt = remaining.lastIndexOf(' ', maxLength);
            if (splitAt <= 0) {
                splitAt = maxLength;
            }
            result.add(remaining.substring(0, splitAt).trim());
            remaining = remaining.substring(splitAt).trim();
        }
        result.add(remaining);
        return result;
    }

    /**
     * Escapa caracteres especiales del contenido PDF.
     */
    private String escapePdfText(String text) {
        return sanitizePdfText(text)
                .replace("\\", "\\\\")
                .replace("(", "\\(")
                .replace(")", "\\)");
    }

    /**
     * Sustituye caracteres fuera del juego ASCII basico para evitar problemas en Helvetica.
     */
    private String sanitizePdfText(String text) {
        if (text == null) {
            return "";
        }
        return text
                .replace("á", "a")
                .replace("é", "e")
                .replace("í", "i")
                .replace("ó", "o")
                .replace("ú", "u")
                .replace("Á", "A")
                .replace("É", "E")
                .replace("Í", "I")
                .replace("Ó", "O")
                .replace("Ú", "U")
                .replace("ñ", "n")
                .replace("Ñ", "N")
                .replace("ü", "u")
                .replace("Ü", "U")
                .replace("€", "EUR")
                .replace("º", "o");
    }
}
