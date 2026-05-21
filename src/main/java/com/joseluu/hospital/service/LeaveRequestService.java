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
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

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
        List<LeaveRequestWithUserDto> requests = new ArrayList<>();
        for (LeaveRequestDocument document : leaveRequestRepository.findByStatus(status)) {
            requests.add(wrapWithUser(document));
        }
        return requests;
    }

    /**
     * Lista las solicitudes de un usuario concreto.
     */
    public List<LeaveRequestDto> getRequestsForUser(String userId) {
        List<LeaveRequestDto> requests = new ArrayList<>();
        for (LeaveRequestDocument document : leaveRequestRepository.findByUserId(userId)) {
            requests.add(toDto(document));
        }
        return requests;
    }

    /**
     * Crea una nueva solicitud de ausencia para un usuario.
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
        notifyHospitalAdmins(user);
        return dto;
    }

    /**
     * Revisa una solicitud existente y notifica el resultado.
     */
    public LeaveRequestWithUserDto review(String userId,
                                          String requestId,
                                          LeaveRequestStatus status,
                                          String comment,
                                          UserDto actor) {
        LeaveRequestDocument document = leaveRequestRepository.findById(requestId)
                .orElseThrow(() -> new NotFoundException("La solicitud no existe"));

        if (!document.getUserId().equals(userId)) {
            throw new ForbiddenException("La solicitud no pertenece al usuario");
        }
        validateReviewScope(document, actor);

        document.setStatus(status);
        document.setReviewComment(comment);
        document.setReviewedAt(LocalDateTime.now().toString());

        LeaveRequestWithUserDto dto = wrapWithUser(leaveRequestRepository.save(document));
        notifyReviewResult(userId, status);
        return dto;
    }

    /**
     * Valida que el revisor pertenezca al hospital de la solicitud salvo ROOT.
     */
    private void validateReviewScope(LeaveRequestDocument document, UserDto actor) {
        if (actor.getRole() == UserRole.ROOT) {
            return;
        }
        if (actor.getRole() == UserRole.HOSPITAL_ADMIN
                && actor.getHospitalId() != null
                && actor.getHospitalId().equals(document.getHospitalId())) {
            return;
        }
        throw new ForbiddenException("No puedes revisar solicitudes de otro hospital");
    }

    /**
     * Convierte la entidad persistida a DTO.
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
     * Combina la solicitud con los datos del usuario.
     */
    private LeaveRequestWithUserDto wrapWithUser(LeaveRequestDocument document) {
        UserDto user = userService.findById(document.getUserId()).orElse(null);
        return new LeaveRequestWithUserDto(user, toDto(document));
    }

    /**
     * Notifica a los administradores del mismo hospital.
     */
    private void notifyHospitalAdmins(UserDto user) {
        String message = "Nueva solicitud de ausencia de " + user.getFirstName() + " " + user.getLastName();

        for (UserDto candidate : userService.getAll()) {
            boolean isHospitalAdmin = candidate.getRole() == UserRole.HOSPITAL_ADMIN;
            boolean sameHospital = user.getHospitalId() != null && user.getHospitalId().equals(candidate.getHospitalId());

            if (isHospitalAdmin && sameHospital) {
                notificationService.createNotification(candidate.getId(), NotificationType.NEW_LEAVE_REQUEST, message);
            }
        }
    }

    /**
     * Notifica al trabajador si su solicitud ha sido aprobada o rechazada.
     */
    private void notifyReviewResult(String userId, LeaveRequestStatus status) {
        if (status == LeaveRequestStatus.APPROVED) {
            notificationService.createNotification(userId, NotificationType.LEAVE_REQUEST_APPROVED, "Tu solicitud de ausencia ha sido aprobada");
        }
        if (status == LeaveRequestStatus.REJECTED) {
            notificationService.createNotification(userId, NotificationType.LEAVE_REQUEST_DENIED, "Tu solicitud de ausencia ha sido denegada");
        }
    }
}
