package com.joseluu.hospital.repository;

import com.joseluu.hospital.entity.AuditLogDocument;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface AuditLogRepository extends MongoRepository<AuditLogDocument, String> {
    List<AuditLogDocument> findByHospitalIdOrderByCreatedAtDesc(String hospitalId);
}
