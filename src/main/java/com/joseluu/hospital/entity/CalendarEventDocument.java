package com.joseluu.hospital.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CalendarEventDocument {
    private String id;
    private String userId;
    private String date;
    private String type;
    private String startTime;
    private String endTime;
    private String notes;
}
