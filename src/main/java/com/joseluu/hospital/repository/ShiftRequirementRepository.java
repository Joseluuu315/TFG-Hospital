package com.joseluu.hospital.repository;

import com.joseluu.hospital.entity.ShiftRequirementDocument;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ShiftRequirementRepository extends MongoRepository<ShiftRequirementDocument, String> {
    List<ShiftRequirementDocument> findByHospitalId(String hospitalId);
    List<ShiftRequirementDocument> findByHospitalIdAndDateBetween(String hospitalId, String startDate, String endDate);
}
