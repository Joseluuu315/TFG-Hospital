package com.joseluu.hospital.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GeneratePayrollRequestDto {
    @NotBlank(message = "El trabajador es obligatorio")
    private String workerId;
    @NotBlank(message = "El periodo es obligatorio")
    private String period;
}
