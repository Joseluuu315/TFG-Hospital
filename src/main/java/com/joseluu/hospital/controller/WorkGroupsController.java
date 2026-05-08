package com.joseluu.hospital.controller;

import com.joseluu.hospital.dto.CreateWorkGroupRequestDto;
import com.joseluu.hospital.dto.UpdateWorkGroupMembersRequestDto;
import com.joseluu.hospital.dto.UserDto;
import com.joseluu.hospital.dto.WorkGroupDto;
import com.joseluu.hospital.service.AuthService;
import com.joseluu.hospital.service.WorkGroupService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Endpoints para gestionar grupos de trabajo y sus miembros.
 * Todos los usuarios autenticados pueden ver y participar en grupos;
 * la creacion y borrado estan restringidos a HOSPITAL_ADMIN o ROOT.
 */
@Tag(name = "Grupos de trabajo", description = "Gestion de equipos y sus chats asociados")
@RestController
@RequestMapping("/api/work-groups")
public class WorkGroupsController {
    private final WorkGroupService workGroupService;
    private final AuthService authService;

    public WorkGroupsController(WorkGroupService workGroupService, AuthService authService) {
        this.workGroupService = workGroupService;
        this.authService = authService;
    }

    /**
     * Lista los grupos del hospital del usuario.
     */
    @Operation(summary = "Mis grupos de trabajo")
    @PreAuthorize("isAuthenticated()")
    @GetMapping
    public List<WorkGroupDto> getAll(@RequestHeader(name = "Authorization", required = false) String authorization) {
        UserDto user = authService.getUserFromBearer(authorization);
        return workGroupService.getForUser(user);
    }

    /**
     * Obtiene un grupo por id dentro del alcance del hospital.
     */
    @Operation(summary = "Obtener grupo por id")
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/{id}")
    public WorkGroupDto getById(@RequestHeader(name = "Authorization", required = false) String authorization,
                                @PathVariable String id) {
        UserDto user = authService.getUserFromBearer(authorization);
        return workGroupService.getById(id, user);
    }

    /**
     * Crea un nuevo grupo de trabajo y su chat asociado.
     * Solo HOSPITAL_ADMIN o ROOT.
     */
    @Operation(summary = "Crear grupo de trabajo", description = "Crea un nuevo grupo con chat integrado. Solo HOSPITAL_ADMIN o ROOT.")
    @PreAuthorize("hasAnyRole('HOSPITAL_ADMIN','ROOT')")
    @PostMapping
    public WorkGroupDto create(@RequestHeader(name = "Authorization", required = false) String authorization,
                               @Valid @RequestBody CreateWorkGroupRequestDto request) {
        UserDto user = authService.getUserFromBearer(authorization);
        return workGroupService.create(request, user);
    }

    /**
     * Actualiza nombre, descripcion y miembros del grupo.
     * Solo HOSPITAL_ADMIN o ROOT.
     */
    @Operation(summary = "Actualizar grupo de trabajo")
    @PreAuthorize("hasAnyRole('HOSPITAL_ADMIN','ROOT')")
    @PutMapping("/{id}")
    public WorkGroupDto update(@RequestHeader(name = "Authorization", required = false) String authorization,
                               @PathVariable String id,
                               @Valid @RequestBody CreateWorkGroupRequestDto request) {
        UserDto user = authService.getUserFromBearer(authorization);
        return workGroupService.update(id, request, user);
    }

    /**
     * Elimina un grupo y su chat.
     * Solo HOSPITAL_ADMIN o ROOT.
     */
    @Operation(summary = "Eliminar grupo de trabajo")
    @PreAuthorize("hasAnyRole('HOSPITAL_ADMIN','ROOT')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@RequestHeader(name = "Authorization", required = false) String authorization,
                                       @PathVariable String id) {
        UserDto user = authService.getUserFromBearer(authorization);
        workGroupService.delete(id, user);
        return ResponseEntity.noContent().build();
    }

    /**
     * Agrega un miembro a un grupo existente.
     * Solo HOSPITAL_ADMIN o ROOT.
     */
    @Operation(summary = "Agregar miembro al grupo")
    @PreAuthorize("hasAnyRole('HOSPITAL_ADMIN','ROOT')")
    @PostMapping("/{id}/members")
    public WorkGroupDto addMember(@RequestHeader(name = "Authorization", required = false) String authorization,
                                  @PathVariable String id,
                                  @Valid @RequestBody UpdateWorkGroupMembersRequestDto request) {
        UserDto user = authService.getUserFromBearer(authorization);
        return workGroupService.addMember(id, request.getUserId(), user);
    }

    /**
     * Elimina un miembro del grupo.
     * Solo HOSPITAL_ADMIN o ROOT.
     */
    @Operation(summary = "Eliminar miembro del grupo")
    @PreAuthorize("hasAnyRole('HOSPITAL_ADMIN','ROOT')")
    @DeleteMapping("/{id}/members/{userId}")
    public WorkGroupDto removeMember(@RequestHeader(name = "Authorization", required = false) String authorization,
                                     @PathVariable String id,
                                     @PathVariable String userId) {
        UserDto user = authService.getUserFromBearer(authorization);
        return workGroupService.removeMember(id, userId, user);
    }
}
