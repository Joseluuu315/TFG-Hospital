package com.joseluu.hospital.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class WorkerContractDto {
    private String id;
    private String hospitalId;
    private String workerId;
    private double hourlyRate;
    private int weeklyHours;
    private double nightBonusPct;
    private double holidayBonusPct;
    private double overtimeMultiplier;
    private String effectiveFrom;
    private boolean active;
    private String createdAt;
    private String updatedAt;
}
