package com.joseluu.hospital.repository;

import com.joseluu.hospital.entity.ShiftRequirementDocument;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ShiftRequirementRepository extends MongoRepository<ShiftRequirementDocument, String> {
    List<ShiftRequirementDocument> findByHospitalId(String hospitalId);
    @org.springframework.data.mongodb.repository.Query("{ 'hospitalId': ?0, 'date': { $gte: ?1, $lte: ?2 } }")
    List<ShiftRequirementDocument> findInDateRange(String hospitalId, String startDate, String endDate);
}
