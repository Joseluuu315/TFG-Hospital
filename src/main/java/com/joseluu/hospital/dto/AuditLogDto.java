package com.joseluu.hospital.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuditLogDto {
    private String id;
    private String hospitalId;
    private String actorUserId;
    private String action;
    private String entityType;
    private String entityId;
    private String details;
    private String createdAt;
}
