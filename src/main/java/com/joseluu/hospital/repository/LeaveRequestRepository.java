package com.joseluu.hospital.repository;

import com.joseluu.hospital.entity.LeaveRequestDocument;
import com.joseluu.hospital.dto.LeaveRequestStatus;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface LeaveRequestRepository extends MongoRepository<LeaveRequestDocument, String> {
    List<LeaveRequestDocument> findByUserId(String userId);
    List<LeaveRequestDocument> findByStatus(LeaveRequestStatus status);
}
