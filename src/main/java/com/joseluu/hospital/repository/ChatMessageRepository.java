package com.joseluu.hospital.repository;

import com.joseluu.hospital.entity.ChatMessageDocument;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ChatMessageRepository extends MongoRepository<ChatMessageDocument, String> {
    List<ChatMessageDocument> findByChatIdOrderByTimestampAsc(String chatId);
    void deleteByChatId(String chatId);
}
