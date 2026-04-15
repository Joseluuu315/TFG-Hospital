package com.joseluu.hospital.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LeaveRequestRequestDto {
    @NotBlank(message = "La fecha de inicio es obligatoria")
    private String startDate;
    @NotBlank(message = "La fecha de fin es obligatoria")
    private String endDate;
    @NotBlank(message = "El motivo es obligatorio")
    private String reason;
}
