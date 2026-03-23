package com.joseluu.hospital.dto;

import lombok.Data;

@Data
public class LeaveRequestRequestDto {
    private String startDate;
    private String endDate;
    private String reason;
}
