package com.joseluu.hospital.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ShiftTypeDto {
    private String id;
    private String hospitalId;
    private String code;
    private String name;
    private String startTime;
    private String endTime;
    private boolean crossesMidnight;
}
