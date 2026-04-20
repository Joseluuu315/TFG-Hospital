package com.joseluu.hospital.controller;

import com.joseluu.hospital.dto.ShiftTypeDto;
import com.joseluu.hospital.service.ShiftTypeService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/hospitals/{hospitalId}/shift-types")
public class ShiftTypesController {
    private final ShiftTypeService shiftTypeService;

    public ShiftTypesController(ShiftTypeService shiftTypeService) {
        this.shiftTypeService = shiftTypeService;
    }

    @GetMapping
    public List<ShiftTypeDto> getByHospital(@PathVariable String hospitalId) {
        return shiftTypeService.getByHospital(hospitalId);
    }

    @PostMapping
    public ShiftTypeDto create(@PathVariable String hospitalId, @RequestBody ShiftTypeDto request) {
        return shiftTypeService.create(hospitalId, request);
    }

    @DeleteMapping("/{code}")
    public void delete(@PathVariable String hospitalId, @PathVariable String code) {
        shiftTypeService.delete(hospitalId, code);
    }
}
