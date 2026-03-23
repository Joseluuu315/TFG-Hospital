package com.joseluu.hospital.repository;

import com.joseluu.hospital.entity.ChatDocument;
import com.joseluu.hospital.entity.enums.ChatType;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface ChatRepository extends MongoRepository<ChatDocument, String> {
    List<ChatDocument> findByParticipantsContaining(String userId);
}
