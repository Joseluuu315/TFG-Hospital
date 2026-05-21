
package com.joseluu.hospital.controller;

import com.joseluu.hospital.dto.CalendarEventDto;
import com.joseluu.hospital.dto.CreateUserRequestDto;
import com.joseluu.hospital.dto.LeaveRequestDto;
import com.joseluu.hospital.dto.LeaveRequestRequestDto;
import com.joseluu.hospital.dto.UpdateUserRequestDto;
import com.joseluu.hospital.dto.UserDto;
import com.joseluu.hospital.dto.UserPresenceDto;
import com.joseluu.hospital.service.AuthService;
import com.joseluu.hospital.service.LeaveRequestService;
import com.joseluu.hospital.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Endpoints de gestion de usuarios y autoservicio.
 */
@Tag(name = "Usuarios", description = "Gestion de usuarios del sistema y endpoints de autoservicio (/me)")
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
     * Accesible por cualquier usuario autenticado (necesario para el directorio del chat).
     */
    @Operation(summary = "Listar usuarios", description = "Devuelve todos los usuarios del sistema.")
    @PreAuthorize("isAuthenticated()")
    @GetMapping
    public List<UserDto> getAll() {
        return userService.getAll();
    }

    /**
     * Obtiene un usuario concreto por id.
     */
    @Operation(summary = "Obtener usuario por id")
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/{id}")
    public UserDto getById(@PathVariable String id) {
        return userService.getById(id);
    }

    /**
     * Devuelve el estado de presencia de los usuarios indicados.
     */
    @Operation(summary = "Estado de presencia", description = "Devuelve la presencia en linea de los usuarios indicados por id.")
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/presence")
    public List<UserPresenceDto> getPresence(@RequestParam(name = "ids") List<String> userIds) {
        return userService.getPresence(userIds);
    }

    /**
     * Crea un usuario trabajador.
     * Solo HOSPITAL_ADMIN o ROOT pueden registrar nuevos empleados.
     */
    @Operation(summary = "Crear trabajador", description = "Da de alta un nuevo trabajador en el hospital. Solo HOSPITAL_ADMIN o ROOT.")
    @PreAuthorize("hasAnyRole('HOSPITAL_ADMIN','ROOT')")
    @PostMapping
    public UserDto create(@RequestHeader(name = "Authorization", required = false) String authorization,
                          @Valid @RequestBody CreateUserRequestDto request) {
        UserDto actor = authService.getUserFromBearer(authorization);
        return userService.createWorker(request, actor);
    }

    /**
     * Actualiza un usuario concreto.
     * Solo HOSPITAL_ADMIN o ROOT pueden editar datos de otros usuarios.
     */
    @Operation(summary = "Actualizar usuario", description = "Actualiza los datos operativos de un usuario. Solo HOSPITAL_ADMIN o ROOT.")
    @PreAuthorize("hasAnyRole('HOSPITAL_ADMIN','ROOT')")
    @PutMapping("/{id}")
    public UserDto update(@RequestHeader(name = "Authorization", required = false) String authorization,
                          @PathVariable String id,
                          @RequestBody UpdateUserRequestDto request) {
        UserDto actor = authService.getUserFromBearer(authorization);
        return userService.updateUser(id, request, actor);
    }

    /**
     * Elimina un trabajador y sus datos operativos asociados.
     * HOSPITAL_ADMIN solo puede borrar trabajadores de su hospital; ROOT puede borrar cualquier usuario no ROOT.
     */
    @Operation(summary = "Eliminar usuario", description = "Elimina un trabajador y limpia datos vinculados. Solo HOSPITAL_ADMIN o ROOT.")
    @PreAuthorize("hasAnyRole('HOSPITAL_ADMIN','ROOT')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@RequestHeader(name = "Authorization", required = false) String authorization,
                                       @PathVariable String id) {
        UserDto actor = authService.getUserFromBearer(authorization);
        userService.deleteUser(id, actor);
        return ResponseEntity.noContent().build();
    }

    /**
     * Devuelve el calendario del usuario autenticado para el mes indicado.
     */
    @Operation(summary = "Mi calendario", description = "Devuelve los eventos de calendario del mes indicado para el usuario autenticado.")
    @PreAuthorize("isAuthenticated()")
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
    @Operation(summary = "Mis solicitudes de ausencia")
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/me/leave-requests")
    public List<LeaveRequestDto> getMyLeaveRequests(@RequestHeader(name = "Authorization", required = false) String authorization) {
        UserDto user = authService.getUserFromBearer(authorization);
        return leaveRequestService.getRequestsForUser(user.getId());
    }

    /**
     * Crea una solicitud de ausencia para el usuario autenticado.
     */
    @Operation(summary = "Solicitar ausencia", description = "Crea una nueva solicitud de ausencia para el usuario autenticado.")
    @PreAuthorize("isAuthenticated()")
    @PostMapping("/me/leave-requests")
    public LeaveRequestDto createLeaveRequest(@RequestHeader(name = "Authorization", required = false) String authorization,
                                              @Valid @RequestBody LeaveRequestRequestDto requestDto) {
        UserDto user = authService.getUserFromBearer(authorization);
        return leaveRequestService.createForUser(user.getId(), requestDto.getStartDate(), requestDto.getEndDate(), requestDto.getReason());
    }

    /**
     * Actualiza los datos del usuario autenticado.
     */
    @Operation(summary = "Actualizar mi perfil")
    @PreAuthorize("isAuthenticated()")
    @PutMapping("/me")
    public UserDto updateMyself(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @RequestBody UpdateUserRequestDto request) {
        UserDto user = authService.getUserFromBearer(authorization);
        return userService.updateMyProfile(user.getId(), request);
    }

    /**
     * Registra actividad reciente del usuario autenticado.
     */
    @Operation(summary = "Heartbeat de presencia", description = "Marca al usuario como activo recientemente.")
    @PreAuthorize("isAuthenticated()")
    @PostMapping("/me/presence")
    public ResponseEntity<Void> heartbeat(@RequestHeader(name = "Authorization", required = false) String authorization) {
        UserDto user = authService.getUserFromBearer(authorization);
        userService.heartbeat(user.getId());
        return ResponseEntity.noContent().build();
    }

    /**
     * Añade un evento de calendario a un trabajador (uso admin).
     * Solo HOSPITAL_ADMIN o ROOT.
     */
    @Operation(summary = "Añadir evento de calendario (admin)", description = "Agrega un turno, vacacion o festivo al calendario del trabajador. Solo HOSPITAL_ADMIN o ROOT.")
    @PreAuthorize("hasAnyRole('HOSPITAL_ADMIN','ROOT')")
    @PostMapping("/{id}/calendar-events")
    public CalendarEventDto addCalendarEvent(
            @PathVariable String id,
            @Valid @RequestBody CalendarEventDto dto) {
        return userService.addCalendarEvent(id, dto);
    }

    /**
     * Elimina un evento de calendario de un trabajador (uso admin).
     * Solo HOSPITAL_ADMIN o ROOT.
     */
    @Operation(summary = "Eliminar evento de calendario (admin)")
    @PreAuthorize("hasAnyRole('HOSPITAL_ADMIN','ROOT')")
    @DeleteMapping("/{id}/calendar-events/{eventId}")
    public ResponseEntity<Void> removeCalendarEvent(
            @PathVariable String id,
            @PathVariable String eventId) {
        userService.removeCalendarEvent(id, eventId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Edita un evento de calendario de un trabajador (uso admin).
     * Solo HOSPITAL_ADMIN o ROOT.
     */
    @Operation(summary = "Editar evento de calendario (admin)")
    @PreAuthorize("hasAnyRole('HOSPITAL_ADMIN','ROOT')")
    @PutMapping("/{id}/calendar-events/{eventId}")
    public CalendarEventDto updateCalendarEvent(
            @PathVariable String id,
            @PathVariable String eventId,
            @Valid @RequestBody CalendarEventDto dto) {
        return userService.updateCalendarEvent(id, eventId, dto);
    }
}
