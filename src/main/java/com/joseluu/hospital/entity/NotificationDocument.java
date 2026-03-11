
package com.joseluu.hospital.entity;

import com.joseluu.hospital.entity.enums.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "notifications")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDocument {
    @Id
    private String id;
    private String userId;
    private NotificationType type;
    private String message;
    private String link;
    private boolean read;
    private String createdAt;
}
