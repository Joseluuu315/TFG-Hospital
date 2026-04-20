package com.joseluu.hospital.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "hospital_settings")
public class HospitalSettingsDocument {
    @Id
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
