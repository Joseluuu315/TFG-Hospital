package com.joseluu.hospital.controller;

import com.joseluu.hospital.dto.HospitalSettingsDto;
import com.joseluu.hospital.service.HospitalSettingsService;
import org.springframework.web.bind.annotation.*;

/**
 * Endpoints para consultar y actualizar la configuracion del hospital.
 */
@RestController
@RequestMapping("/api/hospitals/{hospitalId}/settings")
public class HospitalSettingsController {
    private final HospitalSettingsService hospitalSettingsService;

    public HospitalSettingsController(HospitalSettingsService hospitalSettingsService) {
        this.hospitalSettingsService = hospitalSettingsService;
    }

    /**
     * Obtiene la configuracion actual del hospital.
     */
    @GetMapping
    public HospitalSettingsDto get(@PathVariable String hospitalId) {
        return hospitalSettingsService.getByHospital(hospitalId);
    }

    /**
     * Crea o actualiza la configuracion del hospital.
     */
    @PutMapping
    public HospitalSettingsDto upsert(@PathVariable String hospitalId, @RequestBody HospitalSettingsDto request) {
        return hospitalSettingsService.upsert(hospitalId, request);
    }
}
