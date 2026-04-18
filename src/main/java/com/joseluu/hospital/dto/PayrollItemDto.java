package com.joseluu.hospital.dto;

import com.joseluu.hospital.entity.enums.PayrollItemType;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PayrollItemDto {
    private String id;
    private String payrollId;
    private String workerId;
    private String hospitalId;
    private PayrollItemType type;
    private String description;
    private double quantity;
    private double unitAmount;
    private double totalAmount;
}
