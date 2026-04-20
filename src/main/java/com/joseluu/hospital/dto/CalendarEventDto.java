package com.joseluu.hospital.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CalendarEventDto {
    private String id;
    private String date;
    private String type;
    private String startTime;
    private String endTime;
    private String notes;
}
