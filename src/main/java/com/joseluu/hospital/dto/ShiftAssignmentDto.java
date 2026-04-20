package com.joseluu.hospital.dto;

import com.joseluu.hospital.entity.enums.ShiftAssignmentSource;
import com.joseluu.hospital.entity.enums.ShiftAssignmentStatus;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ShiftAssignmentDto {
    private String id;
    private String hospitalId;
    private String workerId;
    private String workerFullName;
    private String department;
    private String shiftTypeCode;
    private String startAt;
    private String endAt;
    private ShiftAssignmentStatus status;
    private ShiftAssignmentSource source;
    private int version;
    private String createdAt;
    private String updatedAt;
}
