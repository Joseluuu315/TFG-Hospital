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
@Document(collection = "audit_logs")
public class AuditLogDocument {
    @Id
    private String id;
    private String hospitalId;
    private String actorUserId;
    private String action;
    private String entityType;
    private String entityId;
    private String details;
    private String createdAt;
}
