package com.joseluu.hospital.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ManualShiftRequestDto {
    @NotBlank(message = "El id del trabajador es obligatorio")
    private String workerId;
    @NotBlank(message = "La fecha es obligatoria")
    private String date;
    /** SHIFT | DAY_OFF | VACATION | HOLIDAY */
    @NotBlank(message = "El tipo de evento es obligatorio")
    private String type;
    /** Obligatorio si type == SHIFT */
    private String shiftTypeCode;
    private String notes;
}
