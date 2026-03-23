
package com.joseluu.hospital.dto;

import com.joseluu.hospital.entity.enums.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDto {
    private String id;
    private String userId;
    private NotificationType type;
    private String message;
    private String link;
    private boolean read;
    private String createdAt;
}
