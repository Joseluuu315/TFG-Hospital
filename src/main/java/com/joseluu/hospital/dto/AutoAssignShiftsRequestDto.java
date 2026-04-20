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
public class AutoAssignShiftsRequestDto {
    @NotBlank(message = "La fecha inicial es obligatoria")
    private String startDate;
    @NotBlank(message = "La fecha final es obligatoria")
    private String endDate;
}
