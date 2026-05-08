package com.joseluu.hospital.controller;

import com.joseluu.hospital.dto.HospitalSettingsDto;
import com.joseluu.hospital.service.HospitalSettingsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Endpoints para consultar y actualizar la configuracion del hospital.
 */
@Tag(name = "Configuracion del hospital", description = "Parametros de planificacion y calculo de nominas por hospital")
@RestController
@RequestMapping("/api/hospitals/{hospitalId}/settings")
public class HospitalSettingsController {
    private final HospitalSettingsService hospitalSettingsService;

    public HospitalSettingsController(HospitalSettingsService hospitalSettingsService) {
        this.hospitalSettingsService = hospitalSettingsService;
    }

    /**
     * Obtiene la configuracion actual del hospital.
     * Accesible por HOSPITAL_ADMIN o ROOT.
     */
    @Operation(summary = "Obtener configuracion del hospital")
    @PreAuthorize("hasAnyRole('HOSPITAL_ADMIN','ROOT')")
    @GetMapping
    public HospitalSettingsDto get(@PathVariable String hospitalId) {
        return hospitalSettingsService.getByHospital(hospitalId);
    }

    /**
     * Crea o actualiza la configuracion del hospital.
     * Solo HOSPITAL_ADMIN o ROOT.
     */
    @Operation(summary = "Actualizar configuracion del hospital", description = "Modifica parametros como horas maximas semanales, bonificaciones y reglas de asignacion.")
    @PreAuthorize("hasAnyRole('HOSPITAL_ADMIN','ROOT')")
    @PutMapping
    public HospitalSettingsDto upsert(@PathVariable String hospitalId, @RequestBody HospitalSettingsDto request) {
        return hospitalSettingsService.upsert(hospitalId, request);
    }
}
