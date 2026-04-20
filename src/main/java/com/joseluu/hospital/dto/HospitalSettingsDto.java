package com.joseluu.hospital.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
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
