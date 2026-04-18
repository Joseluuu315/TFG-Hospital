package com.joseluu.hospital.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "shift_types")
public class ShiftTypeDocument {
    @Id
    private String id;
    private String hospitalId;
    private String code;
    private String name;
    private String startTime;
    private String endTime;
    private boolean crossesMidnight;
}
