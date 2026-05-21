package com.joseluu.hospital.controller;

import com.joseluu.hospital.dto.AutoAssignShiftsRequestDto;
import com.joseluu.hospital.dto.ManualShiftRequestDto;
import com.joseluu.hospital.dto.ShiftAssignmentDto;
import com.joseluu.hospital.dto.ShiftRequirementDto;
import com.joseluu.hospital.dto.UserDto;
import com.joseluu.hospital.entity.enums.UserRole;
import com.joseluu.hospital.exception.ForbiddenException;
import com.joseluu.hospital.service.AuthService;
import com.joseluu.hospital.service.SchedulingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Endpoints para demandas y asignaciones de turnos.
 */
@Tag(name = "Planificacion de turnos", description = "Demandas de turno, autoasignacion y asignacion manual")
@RestController
public class SchedulingController {
    private final SchedulingService schedulingService;
    private final AuthService authService;

    public SchedulingController(SchedulingService schedulingService, AuthService authService) {
        this.schedulingService = schedulingService;
        this.authService = authService;
    }

    /**
     * Crea una demanda de turno para un hospital.
     * Solo HOSPITAL_ADMIN o ROOT.
     */
    @Operation(summary = "Crear demanda de turno", description = "Registra cuantos trabajadores se necesitan para un turno y fecha concretos.")
    @PreAuthorize("hasAnyRole('HOSPITAL_ADMIN','ROOT')")
    @PostMapping("/api/hospitals/{hospitalId}/shift-requirements")
    public ShiftRequirementDto createRequirement(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @PathVariable String hospitalId,
            @Valid @RequestBody ShiftRequirementDto request) {
        assertCanAccessHospital(authService.getUserFromBearer(authorization), hospitalId);
        return schedulingService.createRequirement(hospitalId, request);
    }

    /**
     * Obtiene la lista de demandas de turno de un hospital en un rango.
     * Accesible por cualquier usuario autenticado del hospital.
     */
    @Operation(summary = "Listar demandas de turno")
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/api/hospitals/{hospitalId}/shift-requirements")
    public List<ShiftRequirementDto> getRequirements(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @PathVariable String hospitalId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        assertCanAccessHospital(authService.getUserFromBearer(authorization), hospitalId);
        return schedulingService.getRequirementsForHospital(hospitalId, startDate, endDate);
    }

    /**
     * Borra una demanda de turno.
     * Solo HOSPITAL_ADMIN o ROOT.
     */
    @Operation(summary = "Eliminar demanda de turno")
    @PreAuthorize("hasAnyRole('HOSPITAL_ADMIN','ROOT')")
    @DeleteMapping("/api/hospitals/{hospitalId}/shift-requirements/{requirementId}")
    public ResponseEntity<Void> deleteRequirement(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @PathVariable String hospitalId,
            @PathVariable String requirementId) {
        UserDto actor = authService.getUserFromBearer(authorization);
        assertCanAccessHospital(actor, hospitalId);
        schedulingService.deleteRequirement(hospitalId, actor.getId(), requirementId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Lanza la autoasignacion para un rango de fechas.
     * Solo HOSPITAL_ADMIN o ROOT.
     */
    @Operation(summary = "Autoasignacion de turnos", description = "Asigna automaticamente turnos a los trabajadores segun las demandas registradas.")
    @PreAuthorize("hasAnyRole('HOSPITAL_ADMIN','ROOT')")
    @PostMapping("/api/hospitals/{hospitalId}/shifts/auto-assign")
    public List<ShiftAssignmentDto> autoAssign(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @PathVariable String hospitalId,
            @Valid @RequestBody AutoAssignShiftsRequestDto request) {
        UserDto actor = authService.getUserFromBearer(authorization);
        assertCanAccessHospital(actor, hospitalId);
        return schedulingService.autoAssign(
                hospitalId, actor.getId(), request.getStartDate(), request.getEndDate());
    }

    /**
     * Crea una asignacion manual (turno, dia libre, vacaciones, festivo).
     * Solo HOSPITAL_ADMIN o ROOT.
     */
    @Operation(summary = "Asignacion manual de turno")
    @PreAuthorize("hasAnyRole('HOSPITAL_ADMIN','ROOT')")
    @PostMapping("/api/hospitals/{hospitalId}/shifts/manual")
    public ShiftAssignmentDto manualAssign(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @PathVariable String hospitalId,
            @Valid @RequestBody ManualShiftRequestDto request) {
        UserDto actor = authService.getUserFromBearer(authorization);
        assertCanAccessHospital(actor, hospitalId);
        return schedulingService.manualAssign(hospitalId, actor.getId(), request);
    }

    /**
     * Lista las asignaciones activas del hospital (con filtros opcionales de fecha).
     */
    @Operation(summary = "Listar asignaciones del hospital")
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/api/hospitals/{hospitalId}/shifts")
    public List<ShiftAssignmentDto> getAssignments(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @PathVariable String hospitalId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        assertCanAccessHospital(authService.getUserFromBearer(authorization), hospitalId);
        return schedulingService.getAssignmentsForHospital(hospitalId, startDate, endDate);
    }

    /**
     * Cancela una asignacion concreta.
     * Solo HOSPITAL_ADMIN o ROOT.
     */
    @Operation(summary = "Cancelar asignacion de turno")
    @PreAuthorize("hasAnyRole('HOSPITAL_ADMIN','ROOT')")
    @DeleteMapping("/api/hospitals/{hospitalId}/shifts/{shiftId}")
    public ResponseEntity<Void> cancelAssignment(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @PathVariable String hospitalId,
            @PathVariable String shiftId) {
        UserDto actor = authService.getUserFromBearer(authorization);
        assertCanAccessHospital(actor, hospitalId);
        schedulingService.cancelAssignment(hospitalId, actor.getId(), shiftId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Devuelve los turnos del usuario autenticado.
     */
    @Operation(summary = "Mis turnos", description = "Devuelve las asignaciones de turno del usuario autenticado.")
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/api/users/me/shifts")
    public List<ShiftAssignmentDto> getMyShifts(
            @RequestHeader(name = "Authorization", required = false) String authorization) {
        UserDto actor = authService.getUserFromBearer(authorization);
        return schedulingService.getAssignmentsForWorker(actor.getId());
    }

    private void assertCanAccessHospital(UserDto actor, String hospitalId) {
        if (actor.getRole() == UserRole.ROOT) {
            return;
        }
        if (actor.getHospitalId() != null && actor.getHospitalId().equals(hospitalId)) {
            return;
        }
        throw new ForbiddenException("No puedes acceder a operaciones de este hospital");
    }
}
