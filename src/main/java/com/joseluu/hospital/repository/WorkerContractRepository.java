package com.joseluu.hospital.repository;

import com.joseluu.hospital.entity.WorkerContractDocument;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface WorkerContractRepository extends MongoRepository<WorkerContractDocument, String> {
    Optional<WorkerContractDocument> findByWorkerIdAndActiveTrue(String workerId);
    List<WorkerContractDocument> findByHospitalId(String hospitalId);
    void deleteByWorkerId(String workerId);
    void deleteByHospitalId(String hospitalId);
}
