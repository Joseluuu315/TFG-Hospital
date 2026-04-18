package com.joseluu.hospital.entity;

import com.joseluu.hospital.entity.enums.ShiftAssignmentSource;
import com.joseluu.hospital.entity.enums.ShiftAssignmentStatus;
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
@Document(collection = "shift_assignments")
public class ShiftAssignmentDocument {
    @Id
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
