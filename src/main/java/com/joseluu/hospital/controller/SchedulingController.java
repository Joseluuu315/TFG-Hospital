package com.joseluu.hospital.controller;

import com.joseluu.hospital.dto.AutoAssignShiftsRequestDto;
import com.joseluu.hospital.dto.ManualShiftRequestDto;
import com.joseluu.hospital.dto.ShiftAssignmentDto;
import com.joseluu.hospital.dto.ShiftRequirementDto;
import com.joseluu.hospital.dto.UserDto;
import com.joseluu.hospital.service.AuthService;
import com.joseluu.hospital.service.SchedulingService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
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

    /** Crea una demanda de turno para un hospital. */
    @PostMapping("/api/hospitals/{hospitalId}/shift-requirements")
    public ShiftRequirementDto createRequirement(
            @PathVariable String hospitalId,
            @Valid @RequestBody ShiftRequirementDto request) {
        return schedulingService.createRequirement(hospitalId, request);
    }

    /** Obtiene la lista de demandas de turno de un hospital en un rango. */
    @GetMapping("/api/hospitals/{hospitalId}/shift-requirements")
    public List<ShiftRequirementDto> getRequirements(
            @PathVariable String hospitalId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        return schedulingService.getRequirementsForHospital(hospitalId, startDate, endDate);
    }

    /** Borra una demanda de turno. */
    @DeleteMapping("/api/hospitals/{hospitalId}/shift-requirements/{requirementId}")
    public ResponseEntity<Void> deleteRequirement(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @PathVariable String hospitalId,
            @PathVariable String requirementId) {
        UserDto actor = authService.getUserFromBearer(authorization);
        schedulingService.deleteRequirement(hospitalId, actor.getId(), requirementId);
        return ResponseEntity.noContent().build();
    }

    /** Lanza la autoasignación para un rango de fechas. */
    @PostMapping("/api/hospitals/{hospitalId}/shifts/auto-assign")
    public List<ShiftAssignmentDto> autoAssign(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @PathVariable String hospitalId,
            @Valid @RequestBody AutoAssignShiftsRequestDto request) {
        UserDto actor = authService.getUserFromBearer(authorization);
        return schedulingService.autoAssign(
                hospitalId, actor.getId(), request.getStartDate(), request.getEndDate());
    }

    /** Crea una asignación manual (turno, día libre, vacaciones, festivo). */
    @PostMapping("/api/hospitals/{hospitalId}/shifts/manual")
    public ShiftAssignmentDto manualAssign(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @PathVariable String hospitalId,
            @Valid @RequestBody ManualShiftRequestDto request) {
        UserDto actor = authService.getUserFromBearer(authorization);
        return schedulingService.manualAssign(hospitalId, actor.getId(), request);
    }

    /** Lista las asignaciones activas del hospital (con filtros opcionales de fecha). */
    @GetMapping("/api/hospitals/{hospitalId}/shifts")
    public List<ShiftAssignmentDto> getAssignments(
            @PathVariable String hospitalId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        return schedulingService.getAssignmentsForHospital(hospitalId, startDate, endDate);
    }

    /** Cancela una asignación concreta. */
    @DeleteMapping("/api/hospitals/{hospitalId}/shifts/{shiftId}")
    public ResponseEntity<Void> cancelAssignment(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @PathVariable String hospitalId,
            @PathVariable String shiftId) {
        UserDto actor = authService.getUserFromBearer(authorization);
        schedulingService.cancelAssignment(hospitalId, actor.getId(), shiftId);
        return ResponseEntity.noContent().build();
    }

    /** Devuelve los turnos del usuario autenticado. */
    @GetMapping("/api/users/me/shifts")
    public List<ShiftAssignmentDto> getMyShifts(
            @RequestHeader(name = "Authorization", required = false) String authorization) {
        UserDto actor = authService.getUserFromBearer(authorization);
        return schedulingService.getAssignmentsForWorker(actor.getId());
    }
}
