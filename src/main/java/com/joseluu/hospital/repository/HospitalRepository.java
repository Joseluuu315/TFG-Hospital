package com.joseluu.hospital.repository;

import com.joseluu.hospital.entity.HospitalDocument;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface HospitalRepository extends MongoRepository<HospitalDocument, String> {
}
