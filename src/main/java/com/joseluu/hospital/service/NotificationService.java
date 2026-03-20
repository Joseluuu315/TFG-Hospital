
package com.joseluu.hospital.service;

import com.joseluu.hospital.dto.NotificationDto;
import com.joseluu.hospital.entity.NotificationDocument;
import com.joseluu.hospital.entity.UserDocument;
import com.joseluu.hospital.entity.enums.NotificationType;
import com.joseluu.hospital.entity.enums.UserRole;
import com.joseluu.hospital.repository.NotificationRepository;
import com.joseluu.hospital.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public void createNotification(String userId, NotificationType type, String message) {
        createNotification(userId, type, message, null);
    }

    public void createNotification(String userId, NotificationType type, String message, String link) {
        NotificationDocument notification = NotificationDocument.builder()
                .id(UUID.randomUUID().toString())
                .userId(userId)
                .type(type)
                .message(message)
                .link(link)
                .read(false)
                .createdAt(LocalDateTime.now().toString())
                .build();
        notificationRepository.save(notification);
    }

    public void createNotificationForRole(UserRole role, NotificationType type, String message) {
        createNotificationForRole(role, type, message, null);
    }

    public void createNotificationForRole(UserRole role, NotificationType type, String message, String link) {
        List<UserDocument> users = userRepository.findByRole(role);
        for (UserDocument user : users) {
            createNotification(user.getId(), type, message, link);
        }
    }

    public void createGlobalNotification(NotificationType type, String message, String link) {
        List<UserDocument> users = userRepository.findAll();
        for (UserDocument user : users) {
            createNotification(user.getId(), type, message, link);
        }
    }

    public List<NotificationDto> getUserNotifications(String userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public void markAsRead(String notificationId) {
        notificationRepository.findById(notificationId).ifPresent(notification -> {
            notification.setRead(true);
            notificationRepository.save(notification);
        });
    }

    private NotificationDto toDto(NotificationDocument document) {
        return NotificationDto.builder()
                .id(document.getId())
                .userId(document.getUserId())
                .type(document.getType())
                .message(document.getMessage())
                .link(document.getLink())
                .read(document.isRead())
                .createdAt(document.getCreatedAt())
                .build();
    }
}
