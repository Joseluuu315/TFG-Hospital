package com.joseluu.hospital.controller;

import com.joseluu.hospital.dto.AutoAssignShiftsRequestDto;
import com.joseluu.hospital.dto.ShiftAssignmentDto;
import com.joseluu.hospital.dto.ShiftRequirementDto;
import com.joseluu.hospital.dto.UserDto;
import com.joseluu.hospital.service.AuthService;
import com.joseluu.hospital.service.SchedulingService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class SchedulingController {
    private final SchedulingService schedulingService;
    private final AuthService authService;

    public SchedulingController(SchedulingService schedulingService, AuthService authService) {
        this.schedulingService = schedulingService;
        this.authService = authService;
    }

    @PostMapping("/api/hospitals/{hospitalId}/shift-requirements")
    public ShiftRequirementDto createRequirement(@PathVariable String hospitalId,
                                                 @Valid @RequestBody ShiftRequirementDto request) {
        return schedulingService.createRequirement(hospitalId, request);
    }

    @PostMapping("/api/hospitals/{hospitalId}/shifts/auto-assign")
    public List<ShiftAssignmentDto> autoAssign(@RequestHeader(name = "Authorization", required = false) String authorization,
                                               @PathVariable String hospitalId,
                                               @Valid @RequestBody AutoAssignShiftsRequestDto request) {
        UserDto actor = authService.getUserFromBearer(authorization);
        return schedulingService.autoAssign(hospitalId, actor.getId(), request.getStartDate(), request.getEndDate());
    }

    @GetMapping("/api/users/me/shifts")
    public List<ShiftAssignmentDto> getMyShifts(@RequestHeader(name = "Authorization", required = false) String authorization) {
        UserDto actor = authService.getUserFromBearer(authorization);
        return schedulingService.getAssignmentsForWorker(actor.getId());
    }
}
