package com.joseluu.hospital.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShiftTypeDto {
    private String id;
    private String hospitalId;
    private String code;
    private String name;
    private String startTime;
    private String endTime;
    private boolean crossesMidnight;
}
