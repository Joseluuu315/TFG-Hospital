package com.joseluu.hospital.entity;

import com.joseluu.hospital.dto.LeaveRequestStatus;
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
@Document(collection = "leave_requests")
public class LeaveRequestDocument {
    @Id
    private String id;
    private String userId;
    private String hospitalId;
    private String startDate;
    private String endDate;
    private String reason;
    private String leaveType;
    private boolean paid;
    private LeaveRequestStatus status;
    private String requestedAt;
    private String reviewedAt;
    private String reviewComment;
}
