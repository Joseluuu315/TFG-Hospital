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
@Document(collection = "shift_requirements")
public class ShiftRequirementDocument {
    @Id
    private String id;
    private String hospitalId;
    private String department;
    private String date;
    private String shiftTypeCode;
    private int requiredWorkers;
}
