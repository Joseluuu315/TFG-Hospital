
package com.joseluu.hospital.repository;

import com.joseluu.hospital.entity.NotificationDocument;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface NotificationRepository extends MongoRepository<NotificationDocument, String> {
    List<NotificationDocument> findByUserIdOrderByCreatedAtDesc(String userId);
}
