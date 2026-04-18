package com.joseluu.hospital.repository;

import com.joseluu.hospital.entity.PayrollItemDocument;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface PayrollItemRepository extends MongoRepository<PayrollItemDocument, String> {
    List<PayrollItemDocument> findByPayrollId(String payrollId);
}
