package com.joseluu.hospital.repository;

import com.joseluu.hospital.entity.ShiftTypeDocument;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface ShiftTypeRepository extends MongoRepository<ShiftTypeDocument, String> {
    List<ShiftTypeDocument> findByHospitalId(String hospitalId);
    Optional<ShiftTypeDocument> findByHospitalIdAndCode(String hospitalId, String code);
    void deleteByHospitalId(String hospitalId);
}
