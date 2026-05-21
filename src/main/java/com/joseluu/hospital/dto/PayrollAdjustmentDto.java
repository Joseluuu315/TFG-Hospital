package com.joseluu.hospital.dto;

import com.joseluu.hospital.entity.enums.PayrollAdjustmentType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PayrollAdjustmentDto {
    private String id;
    private String hospitalId;
    private String workerId;
    private String period;
    private PayrollAdjustmentType type;
    private String description;
    private double amount;
    private String createdBy;
    private String createdAt;
}
