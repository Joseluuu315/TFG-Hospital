
package com.joseluu.hospital.controller;

import com.joseluu.hospital.dto.NotificationDto;
import com.joseluu.hospital.dto.UserDto;
import com.joseluu.hospital.service.AuthService;
import com.joseluu.hospital.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationsController {

    private final NotificationService notificationService;
    private final AuthService authService;

    @GetMapping("/me")
    public List<NotificationDto> getMyNotifications(@RequestHeader(name = "Authorization", required = false) String authorization) {
        UserDto user = authService.getUserFromBearer(authorization);
        return notificationService.getUserNotifications(user.getId());
    }

    @PostMapping("/{notificationId}/read")
    public void markAsRead(@PathVariable String notificationId) {
        notificationService.markAsRead(notificationId);
    }
}
