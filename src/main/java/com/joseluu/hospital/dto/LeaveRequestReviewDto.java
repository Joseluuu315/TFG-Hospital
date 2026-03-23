package com.joseluu.hospital.dto;

import lombok.Data;

@Data
public class LeaveRequestReviewDto {
    private LeaveRequestStatus status;
    private String reviewComment;
}
