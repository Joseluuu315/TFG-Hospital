package com.joseluu.hospital.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ShiftRequirementDto {
    private String id;
    @NotBlank(message = "La fecha es obligatoria")
    private String date;
    @NotBlank(message = "El departamento es obligatorio")
    private String department;
    @NotBlank(message = "El tipo de turno es obligatorio")
    private String shiftTypeCode;
    @Min(value = 1, message = "El minimo es 1")
    private int requiredWorkers;
}
