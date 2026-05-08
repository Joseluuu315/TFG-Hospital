package com.joseluu.hospital.controller;

import com.joseluu.hospital.dto.NotificationDto;
import com.joseluu.hospital.dto.UserDto;
import com.joseluu.hospital.service.AuthService;
import com.joseluu.hospital.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Endpoints para consultar y marcar notificaciones del usuario.
 */
@Tag(name = "Notificaciones", description = "Consulta y gestion de notificaciones del usuario autenticado")
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationsController {

    private final NotificationService notificationService;
    private final AuthService authService;

    /**
     * Devuelve las notificaciones del usuario autenticado.
     */
    @Operation(summary = "Mis notificaciones")
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/me")
    public List<NotificationDto> getMyNotifications(@RequestHeader(name = "Authorization", required = false) String authorization) {
        UserDto user = authService.getUserFromBearer(authorization);
        return notificationService.getUserNotifications(user.getId());
    }

    /**
     * Marca una notificacion concreta como leida.
     */
    @Operation(summary = "Marcar notificacion como leida")
    @PreAuthorize("isAuthenticated()")
    @PostMapping("/{notificationId}/read")
    public void markAsRead(@PathVariable String notificationId) {
        notificationService.markAsRead(notificationId);
    }
}
