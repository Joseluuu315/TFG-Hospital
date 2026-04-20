package com.joseluu.hospital.repository;

import com.joseluu.hospital.entity.ShiftAssignmentDocument;
import com.joseluu.hospital.entity.enums.ShiftAssignmentStatus;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ShiftAssignmentRepository extends MongoRepository<ShiftAssignmentDocument, String> {
    List<ShiftAssignmentDocument> findByHospitalId(String hospitalId);
    List<ShiftAssignmentDocument> findByWorkerId(String workerId);
    List<ShiftAssignmentDocument> findByWorkerIdAndStatus(String workerId, ShiftAssignmentStatus status);
    List<ShiftAssignmentDocument> findByHospitalIdAndStartAtBetween(String hospitalId, String startAt, String endAt);
    List<ShiftAssignmentDocument> findByWorkerIdAndStartAtBetween(String workerId, String startAt, String endAt);
}
