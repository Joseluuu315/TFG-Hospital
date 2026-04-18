package com.joseluu.hospital.entity;

import com.joseluu.hospital.entity.enums.PayrollItemType;
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
@Document(collection = "payroll_items")
public class PayrollItemDocument {
    @Id
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
