package com.joseluu.hospital.controller;

import com.joseluu.hospital.dto.HospitalSettingsDto;
import com.joseluu.hospital.service.HospitalSettingsService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/hospitals/{hospitalId}/settings")
public class HospitalSettingsController {
    private final HospitalSettingsService hospitalSettingsService;

    public HospitalSettingsController(HospitalSettingsService hospitalSettingsService) {
        this.hospitalSettingsService = hospitalSettingsService;
    }

    @GetMapping
    public HospitalSettingsDto get(@PathVariable String hospitalId) {
        return hospitalSettingsService.getByHospital(hospitalId);
    }

    @PutMapping
    public HospitalSettingsDto upsert(@PathVariable String hospitalId, @RequestBody HospitalSettingsDto request) {
        return hospitalSettingsService.upsert(hospitalId, request);
    }
}
