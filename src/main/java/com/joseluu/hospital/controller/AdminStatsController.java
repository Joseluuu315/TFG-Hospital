
package com.joseluu.hospital.controller;

import com.joseluu.hospital.dto.GlobalStatsDto;
import com.joseluu.hospital.service.GlobalStatsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoints de estadisticas globales para administracion central.
 * Solo accesible por usuarios con rol ROOT.
 */
@Tag(name = "Admin — Estadisticas", description = "Estadisticas globales del sistema (solo ROOT)")
@RestController
@RequestMapping("/api/admin")
public class AdminStatsController {
    private final GlobalStatsService globalStatsService;

    public AdminStatsController(GlobalStatsService globalStatsService) {
        this.globalStatsService = globalStatsService;
    }

    /**
     * Devuelve un resumen global de hospitales, usuarios y nominas.
     * Requiere rol ROOT.
     */
    @Operation(summary = "Estadisticas globales", description = "Resumen de hospitales, usuarios activos y nominas generadas. Solo ROOT.")
    @PreAuthorize("hasRole('ROOT')")
    @GetMapping("/stats")
    public GlobalStatsDto getGlobalStats() {
        return globalStatsService.getGlobalStats();
    }
}
