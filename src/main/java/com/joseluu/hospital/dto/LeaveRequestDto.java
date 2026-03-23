package com.joseluu.hospital.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LeaveRequestDto {
    private String id;
    private String userId;
    private String startDate;
    private String endDate;
    private String reason;
    private LeaveRequestStatus status;
    private String requestedAt;
    private String reviewedAt;
    private String reviewComment;
}
