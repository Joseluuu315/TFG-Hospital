package com.joseluu.hospital.controller;

import com.joseluu.hospital.dto.ShiftTypeDto;
import com.joseluu.hospital.service.ShiftTypeService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Endpoints para administrar los tipos de turno de un hospital.
 */
@RestController
@RequestMapping("/api/hospitals/{hospitalId}/shift-types")
public class ShiftTypesController {
    private final ShiftTypeService shiftTypeService;

    public ShiftTypesController(ShiftTypeService shiftTypeService) {
        this.shiftTypeService = shiftTypeService;
    }

    /**
     * Lista los tipos de turno del hospital.
     */
    @GetMapping
    public List<ShiftTypeDto> getByHospital(@PathVariable String hospitalId) {
        return shiftTypeService.getByHospital(hospitalId);
    }

    /**
     * Crea un nuevo tipo de turno.
     */
    @PostMapping
    public ShiftTypeDto create(@PathVariable String hospitalId, @RequestBody ShiftTypeDto request) {
        return shiftTypeService.create(hospitalId, request);
    }

    /**
     * Elimina un tipo de turno por codigo.
     */
    @DeleteMapping("/{code}")
    public void delete(@PathVariable String hospitalId, @PathVariable String code) {
        shiftTypeService.delete(hospitalId, code);
    }
}
