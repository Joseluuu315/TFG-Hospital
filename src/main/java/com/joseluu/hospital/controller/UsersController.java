
package com.joseluu.hospital.controller;

import com.joseluu.hospital.dto.CalendarEventDto;
import com.joseluu.hospital.dto.CreateUserRequestDto;
import com.joseluu.hospital.dto.LeaveRequestDto;
import com.joseluu.hospital.dto.LeaveRequestRequestDto;
import com.joseluu.hospital.dto.UpdateUserRequestDto;
import com.joseluu.hospital.dto.UserDto;
import com.joseluu.hospital.service.AuthService;
import com.joseluu.hospital.service.LeaveRequestService;
import com.joseluu.hospital.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Endpoints de gestion de usuarios y autoservicio.
 */
@RestController
@RequestMapping("/api/users")
public class UsersController {
    private final UserService userService;
    private final AuthService authService;
    private final LeaveRequestService leaveRequestService;

    public UsersController(UserService userService,
                           AuthService authService,
                           LeaveRequestService leaveRequestService) {
        this.userService = userService;
        this.authService = authService;
        this.leaveRequestService = leaveRequestService;
    }

    /**
     * Lista todos los usuarios del sistema.
     */
    @GetMapping
    public List<UserDto> getAll() {
        return userService.getAll();
    }

    /**
     * Obtiene un usuario concreto por id.
     */
    @GetMapping("/{id}")
    public UserDto getById(@PathVariable String id) {
        return userService.getById(id);
    }

    /**
     * Crea un usuario trabajador.
     */
    @PostMapping
    public UserDto create(@Valid @RequestBody CreateUserRequestDto request) {
        return userService.createWorker(request);
    }

    /**
     * Actualiza un usuario concreto.
     */
    @PutMapping("/{id}")
    public UserDto update(@PathVariable String id, @RequestBody UpdateUserRequestDto request) {
        return userService.updateUser(id, request);
    }

    /**
     * Devuelve el calendario del usuario autenticado para el mes indicado.
     */
    @GetMapping("/me/calendar")
    public List<CalendarEventDto> getMyCalendar(@RequestHeader(name = "Authorization", required = false) String authorization,
                                                 @RequestParam(required = false) String month) {
        UserDto user = authService.getUserFromBearer(authorization);
        String targetMonth = month != null ? month : LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM"));
        return userService.getCalendarEvents(user.getId(), targetMonth);
    }

    /**
     * Devuelve las solicitudes de ausencia del usuario autenticado.
     */
    @GetMapping("/me/leave-requests")
    public List<LeaveRequestDto> getMyLeaveRequests(@RequestHeader(name = "Authorization", required = false) String authorization) {
        UserDto user = authService.getUserFromBearer(authorization);
        return leaveRequestService.getRequestsForUser(user.getId());
    }

    /**
     * Crea una solicitud de ausencia para el usuario autenticado.
     */
    @PostMapping("/me/leave-requests")
    public LeaveRequestDto createLeaveRequest(@RequestHeader(name = "Authorization", required = false) String authorization,
                                              @Valid @RequestBody LeaveRequestRequestDto requestDto) {
        UserDto user = authService.getUserFromBearer(authorization);
        return leaveRequestService.createForUser(user.getId(), requestDto.getStartDate(), requestDto.getEndDate(), requestDto.getReason());
    }

    /** Actualiza los datos del usuario autenticado. */
    @PutMapping("/me")
    public UserDto updateMyself(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @RequestBody UpdateUserRequestDto request) {
        UserDto user = authService.getUserFromBearer(authorization);
        return userService.updateUser(user.getId(), request);
    }

    /** Añade un evento de calendario a un trabajador (uso admin). */
    @PostMapping("/{id}/calendar-events")
    public CalendarEventDto addCalendarEvent(
            @PathVariable String id,
            @Valid @RequestBody CalendarEventDto dto) {
        return userService.addCalendarEvent(id, dto);
    }

    /** Elimina un evento de calendario de un trabajador (uso admin). */
    @DeleteMapping("/{id}/calendar-events/{eventId}")
    public ResponseEntity<Void> removeCalendarEvent(
            @PathVariable String id,
            @PathVariable String eventId) {
        userService.removeCalendarEvent(id, eventId);
        return ResponseEntity.noContent().build();
    }
}
