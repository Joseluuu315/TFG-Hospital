package com.joseluu.hospital.controller;

import com.joseluu.hospital.dto.LeaveRequestReviewDto;
import com.joseluu.hospital.dto.LeaveRequestStatus;
import com.joseluu.hospital.dto.LeaveRequestWithUserDto;
import com.joseluu.hospital.service.LeaveRequestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Endpoints para gestionar solicitudes de ausencia (uso admin).
 * Las solicitudes propias del trabajador se gestionan en UsersController (/me/leave-requests).
 */
@Tag(name = "Solicitudes de ausencia", description = "Revision y gestion de solicitudes de ausencia (admin)")
@RestController
@RequestMapping("/api/leave-requests")
public class LeaveRequestsController {
    private final LeaveRequestService leaveRequestService;

    public LeaveRequestsController(LeaveRequestService leaveRequestService) {
        this.leaveRequestService = leaveRequestService;
    }

    /**
     * Lista solicitudes filtradas por estado (por defecto, pendientes).
     * Solo HOSPITAL_ADMIN o ROOT pueden ver la lista de todos los trabajadores.
     */
    @Operation(summary = "Listar solicitudes de ausencia", description = "Devuelve las solicitudes por estado. Por defecto, PENDING.")
    @PreAuthorize("hasAnyRole('HOSPITAL_ADMIN','ROOT')")
    @GetMapping
    public List<LeaveRequestWithUserDto> getByStatus(@RequestParam(required = false) LeaveRequestStatus status) {
        LeaveRequestStatus target = status == null ? LeaveRequestStatus.PENDING : status;
        return leaveRequestService.getByStatus(target);
    }

    /**
     * Revisa una solicitud y aplica el estado indicado (APPROVED/REJECTED).
     * Solo HOSPITAL_ADMIN o ROOT pueden revisar solicitudes.
     */
    @Operation(summary = "Revisar solicitud de ausencia", description = "Aprueba o rechaza la solicitud de ausencia de un trabajador.")
    @PreAuthorize("hasAnyRole('HOSPITAL_ADMIN','ROOT')")
    @PatchMapping("/{userId}/{requestId}")
    public LeaveRequestWithUserDto review(@PathVariable String userId,
                                          @PathVariable String requestId,
                                          @Valid @RequestBody LeaveRequestReviewDto reviewDto) {
        return leaveRequestService.review(userId, requestId, reviewDto.getStatus(), reviewDto.getReviewComment());
    }
}
