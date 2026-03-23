package com.joseluu.hospital.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CalendarEventDto {
    private String id;
    private String date;
    private String type;
    private String startTime;
    private String endTime;
    private String notes;
}
