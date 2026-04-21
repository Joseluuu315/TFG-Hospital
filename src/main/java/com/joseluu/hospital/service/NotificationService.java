package com.joseluu.hospital.service;

import com.joseluu.hospital.dto.NotificationDto;
import com.joseluu.hospital.entity.NotificationDocument;
import com.joseluu.hospital.entity.UserDocument;
import com.joseluu.hospital.entity.enums.NotificationType;
import com.joseluu.hospital.entity.enums.UserRole;
import com.joseluu.hospital.repository.NotificationRepository;
import com.joseluu.hospital.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Servicio encargado de crear, listar y marcar notificaciones.
 */
@Service
public class NotificationService {
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(NotificationRepository notificationRepository,
                               UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    /**
     * Crea una notificacion simple para un usuario.
     */
    public void createNotification(String userId, NotificationType type, String message) {
        createNotification(userId, type, message, null);
    }

    /**
     * Crea una notificacion para un usuario con enlace opcional.
     */
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

    /**
     * Crea una notificacion para todos los usuarios de un rol.
     */
    public void createNotificationForRole(UserRole role, NotificationType type, String message) {
        createNotificationForRole(role, type, message, null);
    }

    /**
     * Crea una notificacion para todos los usuarios de un rol con enlace opcional.
     */
    public void createNotificationForRole(UserRole role, NotificationType type, String message, String link) {
        for (UserDocument user : userRepository.findByRole(role)) {
            createNotification(user.getId(), type, message, link);
        }
    }

    /**
     * Crea una notificacion global para todos los usuarios.
     */
    public void createGlobalNotification(NotificationType type, String message, String link) {
        for (UserDocument user : userRepository.findAll()) {
            createNotification(user.getId(), type, message, link);
        }
    }

    /**
     * Devuelve las notificaciones de un usuario ordenadas por fecha.
     */
    public List<NotificationDto> getUserNotifications(String userId) {
        List<NotificationDto> notifications = new ArrayList<>();
        for (NotificationDocument document : notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)) {
            notifications.add(toDto(document));
        }
        return notifications;
    }

    /**
     * Marca una notificacion como leida si existe.
     */
    public void markAsRead(String notificationId) {
        notificationRepository.findById(notificationId).ifPresent(notification -> {
            notification.setRead(true);
            notificationRepository.save(notification);
        });
    }

    /**
     * Convierte la entidad persistida a DTO.
     */
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
