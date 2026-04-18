package com.joseluu.hospital.service;

import com.joseluu.hospital.dto.LeaveRequestDto;
import com.joseluu.hospital.dto.LeaveRequestStatus;
import com.joseluu.hospital.dto.LeaveRequestWithUserDto;
import com.joseluu.hospital.dto.UserDto;
import com.joseluu.hospital.entity.LeaveRequestDocument;
import com.joseluu.hospital.entity.enums.NotificationType;
import com.joseluu.hospital.entity.enums.UserRole;
import com.joseluu.hospital.exception.ForbiddenException;
import com.joseluu.hospital.exception.NotFoundException;
import com.joseluu.hospital.repository.LeaveRequestRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Servicio para gestionar solicitudes de ausencia.
 */
@Service
public class LeaveRequestService {
    private final LeaveRequestRepository leaveRequestRepository;
    private final UserService userService;
    private final NotificationService notificationService;

    public LeaveRequestService(LeaveRequestRepository leaveRequestRepository,
                               UserService userService,
                               NotificationService notificationService) {
        this.leaveRequestRepository = leaveRequestRepository;
        this.userService = userService;
        this.notificationService = notificationService;
    }

    /**
     * Lista solicitudes filtradas por estado.
     */
    public List<LeaveRequestWithUserDto> getByStatus(LeaveRequestStatus status) {
        return leaveRequestRepository.findByStatus(status).stream()
                .map(this::wrapWithUser)
                .collect(Collectors.toList());
    }

    /**
     * Devuelve las solicitudes de un usuario concreto.
     */
    public List<LeaveRequestDto> getRequestsForUser(String userId) {
        return leaveRequestRepository.findByUserId(userId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Crea una nueva solicitud para un usuario.
     */
    public LeaveRequestDto createForUser(String userId, String startDate, String endDate, String reason) {
        UserDto user = userService.getById(userId);
        LeaveRequestDocument document = LeaveRequestDocument.builder()
                .id(UUID.randomUUID().toString())
                .userId(userId)
                .hospitalId(user.getHospitalId())
                .startDate(startDate)
                .endDate(endDate)
                .reason(reason)
                .leaveType("VACATION")
                .paid(true)
                .status(LeaveRequestStatus.PENDING)
                .requestedAt(LocalDateTime.now().toString())
                .build();
        LeaveRequestDto dto = toDto(leaveRequestRepository.save(document));
        notificationService.createNotificationForRole(UserRole.ROOT, NotificationType.NEW_LEAVE_REQUEST, "Nueva solicitud de ausencia");
        userService.getAll().stream()
                .filter(candidate -> candidate.getRole() == UserRole.HOSPITAL_ADMIN)
                .filter(candidate -> user.getHospitalId() != null && user.getHospitalId().equals(candidate.getHospitalId()))
                .forEach(candidate -> notificationService.createNotification(candidate.getId(), NotificationType.NEW_LEAVE_REQUEST,
                        "Nueva solicitud de ausencia de " + user.getFirstName() + " " + user.getLastName()));
        return dto;
    }

    /**
     * Revisa una solicitud y guarda el comentario.
     */
    public LeaveRequestWithUserDto review(String userId, String requestId, LeaveRequestStatus status, String comment) {
        LeaveRequestDocument document = leaveRequestRepository.findById(requestId)
                .orElseThrow(() -> new NotFoundException("La solicitud no existe"));
        if (!document.getUserId().equals(userId)) {
            throw new ForbiddenException("La solicitud no pertenece al usuario");
        }
        document.setStatus(status);
        document.setReviewComment(comment);
        document.setReviewedAt(LocalDateTime.now().toString());
        LeaveRequestWithUserDto dto = wrapWithUser(leaveRequestRepository.save(document));

        if (status == LeaveRequestStatus.APPROVED) {
            notificationService.createNotification(userId, NotificationType.LEAVE_REQUEST_APPROVED, "Tu solicitud de ausencia ha sido aprobada");
        } else if (status == LeaveRequestStatus.REJECTED) {
            notificationService.createNotification(userId, NotificationType.LEAVE_REQUEST_DENIED, "Tu solicitud de ausencia ha sido denegada");
        }

        return dto;
    }

    /**
     * Convierte la entidad en DTO.
     */
    private LeaveRequestDto toDto(LeaveRequestDocument document) {
        return LeaveRequestDto.builder()
                .id(document.getId())
                .userId(document.getUserId())
                .hospitalId(document.getHospitalId())
                .startDate(document.getStartDate())
                .endDate(document.getEndDate())
                .reason(document.getReason())
                .leaveType(document.getLeaveType())
                .paid(document.isPaid())
                .status(document.getStatus())
                .requestedAt(document.getRequestedAt())
                .reviewedAt(document.getReviewedAt())
                .reviewComment(document.getReviewComment())
                .build();
    }

    /**
     * Enlaza la solicitud con los datos del usuario.
     */
    private LeaveRequestWithUserDto wrapWithUser(LeaveRequestDocument document) {
        UserDto user = userService.findById(document.getUserId()).orElse(null);
        return new LeaveRequestWithUserDto(user, toDto(document));
    }
}
