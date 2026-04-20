package com.joseluu.hospital.entity;

import com.joseluu.hospital.entity.enums.PayrollAdjustmentType;
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
@Document(collection = "payroll_adjustments")
public class PayrollAdjustmentDocument {
    @Id
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
