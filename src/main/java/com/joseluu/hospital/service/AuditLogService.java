package com.joseluu.hospital.service;

import com.joseluu.hospital.dto.AuditLogDto;
import com.joseluu.hospital.entity.AuditLogDocument;
import com.joseluu.hospital.repository.AuditLogRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AuditLogService {
    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public void log(String hospitalId, String actorUserId, String action, String entityType, String entityId, String details) {
        auditLogRepository.save(AuditLogDocument.builder()
                .id(UUID.randomUUID().toString())
                .hospitalId(hospitalId)
                .actorUserId(actorUserId)
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .details(details)
                .createdAt(LocalDateTime.now().toString())
                .build());
    }

    public List<AuditLogDto> getByHospital(String hospitalId) {
        return auditLogRepository.findByHospitalIdOrderByCreatedAtDesc(hospitalId).stream()
                .map(document -> AuditLogDto.builder()
                        .id(document.getId())
                        .hospitalId(document.getHospitalId())
                        .actorUserId(document.getActorUserId())
                        .action(document.getAction())
                        .entityType(document.getEntityType())
                        .entityId(document.getEntityId())
                        .details(document.getDetails())
                        .createdAt(document.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }
}
