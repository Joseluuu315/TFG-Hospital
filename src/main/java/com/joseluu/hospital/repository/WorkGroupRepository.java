package com.joseluu.hospital.repository;

import com.joseluu.hospital.entity.WorkGroupDocument;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface WorkGroupRepository extends MongoRepository<WorkGroupDocument, String> {
    List<WorkGroupDocument> findByHospitalId(String hospitalId);
}
