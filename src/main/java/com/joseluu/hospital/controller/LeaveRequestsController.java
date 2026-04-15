package com.joseluu.hospital.controller;

import com.joseluu.hospital.dto.LeaveRequestReviewDto;
import com.joseluu.hospital.dto.LeaveRequestStatus;
import com.joseluu.hospital.dto.LeaveRequestWithUserDto;
import com.joseluu.hospital.service.LeaveRequestService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Endpoints para gestionar solicitudes de ausencia.
 */
@RestController
@RequestMapping("/api/leave-requests")
public class LeaveRequestsController {
    private final LeaveRequestService leaveRequestService;

    public LeaveRequestsController(LeaveRequestService leaveRequestService) {
        this.leaveRequestService = leaveRequestService;
    }

    /**
     * Lista solicitudes filtradas por estado (por defecto, pendientes).
     */
    @GetMapping
    public List<LeaveRequestWithUserDto> getByStatus(@RequestParam(required = false) LeaveRequestStatus status) {
        LeaveRequestStatus target = status == null ? LeaveRequestStatus.PENDING : status;
        return leaveRequestService.getByStatus(target);
    }

    /**
     * Revisa una solicitud y aplica el estado indicado.
     */
    @PatchMapping("/{userId}/{requestId}")
    public LeaveRequestWithUserDto review(@PathVariable String userId,
                                          @PathVariable String requestId,
                                          @Valid @RequestBody LeaveRequestReviewDto reviewDto) {
        return leaveRequestService.review(userId, requestId, reviewDto.getStatus(), reviewDto.getReviewComment());
    }
}
