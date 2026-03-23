package com.joseluu.hospital.repository;

import com.joseluu.hospital.entity.PayrollDocument;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface PayrollRepository extends MongoRepository<PayrollDocument, String> {
    List<PayrollDocument> findByWorkerId(String workerId);
}
