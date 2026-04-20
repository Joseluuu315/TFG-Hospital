package com.joseluu.hospital.repository;

import com.joseluu.hospital.entity.PayrollAdjustmentDocument;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface PayrollAdjustmentRepository extends MongoRepository<PayrollAdjustmentDocument, String> {
    List<PayrollAdjustmentDocument> findByWorkerIdAndPeriod(String workerId, String period);
    List<PayrollAdjustmentDocument> findByHospitalIdAndPeriod(String hospitalId, String period);
}
