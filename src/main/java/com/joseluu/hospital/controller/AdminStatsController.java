package com.joseluu.hospital.controller;

import com.joseluu.hospital.dto.GlobalStatsDto;
import com.joseluu.hospital.service.GlobalStatsService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoints de estadisticas globales para administracion central.
 */
@RestController
@RequestMapping("/api/admin")
public class AdminStatsController {
    private final GlobalStatsService globalStatsService;

    public AdminStatsController(GlobalStatsService globalStatsService) {
        this.globalStatsService = globalStatsService;
    }

    /**
     * Devuelve un resumen global de hospitales, usuarios y nominas.
     */
    @GetMapping("/stats")
    public GlobalStatsDto getGlobalStats() {
        return globalStatsService.getGlobalStats();
    }
}
