package com.joseluu.hospital.dto;

import com.joseluu.hospital.entity.enums.PayrollStatus;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PayrollDto {
    private String id;
    private String workerId;
    private String workerFullName;
    private String hospitalId;
    private String period;
    private double grossSalary;
    private double socialSecurityWorker;
    private double incomeTaxWithholding;
    private double otherDeductions;
    private double netSalary;
    private double overtimeAmount;
    private double bonusAmount;
    private String pdfPath;
    private PayrollStatus status;
    private String acknowledgedAt;
    private String issuedAt;
}
