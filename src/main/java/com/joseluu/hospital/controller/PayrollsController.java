package com.joseluu.hospital.controller;

import com.joseluu.hospital.dto.PayrollDto;
import com.joseluu.hospital.dto.UserDto;
import com.joseluu.hospital.entity.enums.PayrollStatus;
import com.joseluu.hospital.entity.enums.UserRole;
import com.joseluu.hospital.exception.ForbiddenException;
import com.joseluu.hospital.service.AuthService;
import com.joseluu.hospital.service.PayrollService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Endpoints para gestionar nominas.
 */
@Tag(name = "Nominas", description = "Gestion y descarga de nominas de trabajadores")
@RestController
@RequestMapping("/api/payrolls")
public class PayrollsController {
    private final PayrollService payrollService;
    private final AuthService authService;

    public PayrollsController(PayrollService payrollService, AuthService authService) {
        this.payrollService = payrollService;
        this.authService = authService;
    }

    /**
     * Lista nominas. Un trabajador solo puede ver las propias (workerId=me).
     * Un admin puede ver todas o filtrar por workerId.
     */
    @Operation(summary = "Listar nominas", description = "Con workerId=me devuelve solo las del usuario autenticado.")
    @PreAuthorize("isAuthenticated()")
    @GetMapping
    public List<PayrollDto> list(@RequestParam(required = false) String workerId,
                                 @RequestHeader(name = "Authorization", required = false) String authorization) {
        UserDto actor = authService.getUserFromBearer(authorization);
        if (actor.getRole() == UserRole.WORKER) {
            return payrollService.getByWorker(actor.getId());
        }

        if ("me".equalsIgnoreCase(workerId)) {
            return payrollService.getByWorker(actor.getId());
        }

        if (actor.getRole() == UserRole.HOSPITAL_ADMIN) {
            List<PayrollDto> hospitalPayrolls = payrollService.getByHospital(actor.getHospitalId());
            if (workerId == null || workerId.isBlank()) {
                return hospitalPayrolls;
            }
            return hospitalPayrolls.stream()
                    .filter(payroll -> workerId.equals(payroll.getWorkerId()))
                    .toList();
        }

        if (workerId != null && !workerId.isBlank()) {
            return payrollService.getByWorker(workerId);
        }
        return payrollService.getAll();
    }

    /**
     * Obtiene una nomina por id.
     * HOSPITAL_ADMIN o ROOT pueden acceder a cualquier nomina.
     */
    @Operation(summary = "Obtener nomina por id")
    @PreAuthorize("hasAnyRole('HOSPITAL_ADMIN','ROOT')")
    @GetMapping("/{id}")
    public PayrollDto getById(@RequestHeader(name = "Authorization", required = false) String authorization,
                              @PathVariable String id) {
        PayrollDto payroll = payrollService.getById(id);
        assertCanAccessPayroll(authService.getUserFromBearer(authorization), payroll);
        return payroll;
    }

    /**
     * Crea una nueva nomina.
     * Solo HOSPITAL_ADMIN o ROOT.
     */
    @Operation(summary = "Crear nomina", description = "Genera una nueva nomina para un trabajador. Solo HOSPITAL_ADMIN o ROOT.")
    @PreAuthorize("hasAnyRole('HOSPITAL_ADMIN','ROOT')")
    @PostMapping
    public PayrollDto create(@RequestHeader(name = "Authorization", required = false) String authorization,
                             @RequestBody PayrollDto request) {
        assertCanAccessHospital(authService.getUserFromBearer(authorization), request.getHospitalId());
        return payrollService.create(request);
    }

    /**
     * Actualiza el estado de una nomina.
     * Solo HOSPITAL_ADMIN o ROOT.
     */
    @Operation(summary = "Actualizar estado de nomina")
    @PreAuthorize("hasAnyRole('HOSPITAL_ADMIN','ROOT')")
    @PatchMapping("/{id}/status")
    public PayrollDto updateStatus(@RequestHeader(name = "Authorization", required = false) String authorization,
                                   @PathVariable String id,
                                   @Valid @RequestBody StatusUpdate request) {
        assertCanAccessPayroll(authService.getUserFromBearer(authorization), payrollService.getById(id));
        return payrollService.updateStatus(id, request.getStatus());
    }

    /**
     * Genera y descarga el PDF de la nomina.
     * Accesible por cualquier usuario autenticado (el worker puede descargar la suya).
     */
    @Operation(summary = "Descargar PDF de nomina")
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> downloadPdf(@RequestHeader(name = "Authorization", required = false) String authorization,
                                              @PathVariable String id) {
        PayrollDto payroll = payrollService.getById(id);
        assertCanAccessPayroll(authService.getUserFromBearer(authorization), payroll);
        byte[] content = payrollService.generatePdf(id);
        String filename = "nomina-" + sanitizeFilename(payroll.getWorkerFullName()) + "-" + payroll.getPeriod() + ".pdf";

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(content);
    }

    /**
     * Genera un nombre de archivo seguro para la descarga.
     */
    private String sanitizeFilename(String value) {
        if (value == null || value.isBlank()) {
            return "trabajador";
        }
        return value.toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
    }

    private void assertCanAccessPayroll(UserDto actor, PayrollDto payroll) {
        if (actor.getRole() == UserRole.ROOT) {
            return;
        }
        if (actor.getRole() == UserRole.HOSPITAL_ADMIN) {
            assertCanAccessHospital(actor, payroll.getHospitalId());
            return;
        }
        if (actor.getRole() == UserRole.WORKER && actor.getId().equals(payroll.getWorkerId())) {
            return;
        }
        throw new ForbiddenException("No puedes acceder a esta nomina");
    }

    private void assertCanAccessHospital(UserDto actor, String hospitalId) {
        if (actor.getRole() == UserRole.ROOT) {
            return;
        }
        if (actor.getRole() == UserRole.HOSPITAL_ADMIN
                && actor.getHospitalId() != null
                && actor.getHospitalId().equals(hospitalId)) {
            return;
        }
        throw new ForbiddenException("No puedes gestionar nominas de este hospital");
    }

    /**
     * Payload minimo para cambios de estado.
     */
    @Setter
    @Getter
    public static class StatusUpdate {
        @NotNull(message = "El estado es obligatorio")
        private PayrollStatus status;
    }
}
