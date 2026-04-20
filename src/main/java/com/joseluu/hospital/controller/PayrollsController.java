package com.joseluu.hospital.controller;

import com.joseluu.hospital.dto.PayrollDto;
import com.joseluu.hospital.dto.UserDto;
import com.joseluu.hospital.entity.enums.PayrollStatus;
import com.joseluu.hospital.service.AuthService;
import com.joseluu.hospital.service.PayrollService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Endpoints para gestionar nominas.
 */
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
     * Lista nominas, opcionalmente filtradas por trabajador.
     */
    @GetMapping
    public List<PayrollDto> list(@RequestParam(required = false) String workerId,
                                 @RequestHeader(name = "Authorization", required = false) String authorization) {
        if ("me".equalsIgnoreCase(workerId)) {
            UserDto user = authService.getUserFromBearer(authorization);
            workerId = user.getId();
        }
        if (workerId != null) {
            return payrollService.getByWorker(workerId);
        }
        return payrollService.getAll();
    }

    /**
     * Obtiene una nomina por id.
     */
    @GetMapping("/{id}")
    public PayrollDto getById(@PathVariable String id) {
        return payrollService.getById(id);
    }

    /**
     * Crea una nueva nomina.
     */
    @PostMapping
    public PayrollDto create(@RequestBody PayrollDto request) {
        return payrollService.create(request);
    }

    /**
     * Actualiza el estado de una nomina.
     */
    @PatchMapping("/{id}/status")
    public PayrollDto updateStatus(@PathVariable String id, @Valid @RequestBody StatusUpdate request) {
        return payrollService.updateStatus(id, request.getStatus());
    }

    /**
     * Genera y descarga el PDF de la nomina.
     */
    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> downloadPdf(@PathVariable String id) {
        byte[] content = payrollService.generatePdf(id);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .body(content);
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
