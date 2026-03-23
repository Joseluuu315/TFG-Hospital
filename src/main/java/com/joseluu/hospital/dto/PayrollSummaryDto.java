package com.joseluu.hospital.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PayrollSummaryDto {
    private String month;
    private int count;
    private double total;
}
