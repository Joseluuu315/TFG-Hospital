package com.joseluu.hospital.controller;

import com.joseluu.hospital.dto.AuditLogDto;
import com.joseluu.hospital.service.AuditLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Endpoints para consultar el registro de auditoria de cada hospital.
 * Solo accesible por HOSPITAL_ADMIN o ROOT.
 */
@Tag(name = "Auditoria", description = "Registro de acciones administrativas por hospital")
@RestController
public class AuditLogsController {
    private final AuditLogService auditLogService;

    public AuditLogsController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    /**
     * Lista las entradas de auditoria de un hospital.
     * Solo HOSPITAL_ADMIN o ROOT.
     */
    @Operation(summary = "Listar logs de auditoria", description = "Devuelve el historial de acciones administrativas registradas para el hospital.")
    @PreAuthorize("hasAnyRole('HOSPITAL_ADMIN','ROOT')")
    @GetMapping("/api/hospitals/{hospitalId}/audit-logs")
    public List<AuditLogDto> getByHospital(@PathVariable String hospitalId) {
        return auditLogService.getByHospital(hospitalId);
    }
}
