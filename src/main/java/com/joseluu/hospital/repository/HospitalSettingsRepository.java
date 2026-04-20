package com.joseluu.hospital.repository;

import com.joseluu.hospital.entity.HospitalSettingsDocument;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface HospitalSettingsRepository extends MongoRepository<HospitalSettingsDocument, String> {
}
