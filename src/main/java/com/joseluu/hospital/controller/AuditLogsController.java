package com.joseluu.hospital.controller;

import com.joseluu.hospital.dto.AuditLogDto;
import com.joseluu.hospital.service.AuditLogService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Endpoints para consultar el registro de auditoria de cada hospital.
 */
@RestController
public class AuditLogsController {
    private final AuditLogService auditLogService;

    public AuditLogsController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    /**
     * Lista las entradas de auditoria de un hospital.
     */
    @GetMapping("/api/hospitals/{hospitalId}/audit-logs")
    public List<AuditLogDto> getByHospital(@PathVariable String hospitalId) {
        return auditLogService.getByHospital(hospitalId);
    }
}
