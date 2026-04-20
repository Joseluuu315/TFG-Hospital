package com.joseluu.hospital.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class UpsertWorkerContractRequestDto {
    @NotBlank(message = "El trabajador es obligatorio")
    private String workerId;
    @Positive(message = "La tarifa debe ser mayor que 0")
    private double hourlyRate;
    @Positive(message = "Las horas semanales deben ser mayores que 0")
    private int weeklyHours;
    private Double nightBonusPct;
    private Double holidayBonusPct;
    private Double overtimeMultiplier;
    private String effectiveFrom;
}
