package com.joseluu.hospital.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HospitalSettingsDto {
    private String hospitalId;
    private int maxWeeklyHours;
    private int minRestHours;
    private int maxConsecutiveDays;
    private int maxConsecutiveNights;
    private double fairnessWeight;
    private boolean autoRecalculate;
    private double nightBonusPct;
    private double holidayBonusPct;
    private double overtimeMultiplier;
    private String createdAt;
    private String updatedAt;
}
