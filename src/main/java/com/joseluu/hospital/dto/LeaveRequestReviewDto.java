package com.joseluu.hospital.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class LeaveRequestReviewDto {
    @NotNull(message = "El estado es obligatorio")
    private LeaveRequestStatus status;
    private String reviewComment;
}
