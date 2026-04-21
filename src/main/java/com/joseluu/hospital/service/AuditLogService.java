package com.joseluu.hospital.service;

import com.joseluu.hospital.dto.AuditLogDto;
import com.joseluu.hospital.entity.AuditLogDocument;
import com.joseluu.hospital.repository.AuditLogRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Servicio encargado del registro de acciones importantes del sistema.
 */
@Service
public class AuditLogService {
    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    /**
     * Guarda una entrada de auditoria.
     */
    public void log(String hospitalId,
                    String actorUserId,
                    String action,
                    String entityType,
                    String entityId,
                    String details) {
        AuditLogDocument document = AuditLogDocument.builder()
                .id(UUID.randomUUID().toString())
                .hospitalId(hospitalId)
                .actorUserId(actorUserId)
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .details(details)
                .createdAt(LocalDateTime.now().toString())
                .build();

        auditLogRepository.save(document);
    }

    /**
     * Devuelve el historico de auditoria de un hospital.
     */
    public List<AuditLogDto> getByHospital(String hospitalId) {
        List<AuditLogDto> logs = new ArrayList<>();
        for (AuditLogDocument document : auditLogRepository.findByHospitalIdOrderByCreatedAtDesc(hospitalId)) {
            logs.add(toDto(document));
        }
        return logs;
    }

    /**
     * Convierte la entidad a DTO.
     */
    private AuditLogDto toDto(AuditLogDocument document) {
        return AuditLogDto.builder()
                .id(document.getId())
                .hospitalId(document.getHospitalId())
                .actorUserId(document.getActorUserId())
                .action(document.getAction())
                .entityType(document.getEntityType())
                .entityId(document.getEntityId())
                .details(document.getDetails())
                .createdAt(document.getCreatedAt())
                .build();
    }
}
