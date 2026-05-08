package com.joseluu.hospital.controller;

import com.joseluu.hospital.dto.ShiftTypeDto;
import com.joseluu.hospital.service.ShiftTypeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Endpoints para administrar los tipos de turno de un hospital.
 */
@Tag(name = "Tipos de turno", description = "Gestion de los tipos de turno configurables por hospital")
@RestController
@RequestMapping("/api/hospitals/{hospitalId}/shift-types")
public class ShiftTypesController {
    private final ShiftTypeService shiftTypeService;

    public ShiftTypesController(ShiftTypeService shiftTypeService) {
        this.shiftTypeService = shiftTypeService;
    }

    /**
     * Lista los tipos de turno del hospital.
     * Accesible por cualquier usuario autenticado del hospital.
     */
    @Operation(summary = "Listar tipos de turno", description = "Devuelve todos los tipos de turno configurados para el hospital.")
    @PreAuthorize("isAuthenticated()")
    @GetMapping
    public List<ShiftTypeDto> getByHospital(@PathVariable String hospitalId) {
        return shiftTypeService.getByHospital(hospitalId);
    }

    /**
     * Crea un nuevo tipo de turno.
     * Requiere rol HOSPITAL_ADMIN o ROOT.
     */
    @Operation(summary = "Crear tipo de turno", description = "Crea un nuevo tipo de turno para el hospital. Solo HOSPITAL_ADMIN o ROOT.")
    @PreAuthorize("hasAnyRole('HOSPITAL_ADMIN','ROOT')")
    @PostMapping
    public ShiftTypeDto create(@PathVariable String hospitalId, @RequestBody ShiftTypeDto request) {
        return shiftTypeService.create(hospitalId, request);
    }

    /**
     * Elimina un tipo de turno por codigo.
     * Requiere rol HOSPITAL_ADMIN o ROOT.
     */
    @Operation(summary = "Eliminar tipo de turno", description = "Elimina el tipo de turno por su codigo. Solo HOSPITAL_ADMIN o ROOT.")
    @PreAuthorize("hasAnyRole('HOSPITAL_ADMIN','ROOT')")
    @DeleteMapping("/{code}")
    public void delete(@PathVariable String hospitalId, @PathVariable String code) {
        shiftTypeService.delete(hospitalId, code);
    }
}
