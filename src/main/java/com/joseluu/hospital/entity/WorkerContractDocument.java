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
@Document(collection = "worker_contracts")
public class WorkerContractDocument {
    @Id
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
