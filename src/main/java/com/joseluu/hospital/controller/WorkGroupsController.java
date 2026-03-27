package com.joseluu.hospital.controller;

import com.joseluu.hospital.dto.CreateWorkGroupRequestDto;
import com.joseluu.hospital.dto.UpdateWorkGroupMembersRequestDto;
import com.joseluu.hospital.dto.UserDto;
import com.joseluu.hospital.dto.WorkGroupDto;
import com.joseluu.hospital.service.AuthService;
import com.joseluu.hospital.service.WorkGroupService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Endpoints para gestionar grupos de trabajo y sus miembros.
 */
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
    @GetMapping
    public List<WorkGroupDto> getAll(@RequestHeader(name = "Authorization", required = false) String authorization) {
        UserDto user = authService.getUserFromBearer(authorization);
        return workGroupService.getForUser(user);
    }

    /**
     * Obtiene un grupo por id dentro del alcance del hospital.
     */
    @GetMapping("/{id}")
    public WorkGroupDto getById(@RequestHeader(name = "Authorization", required = false) String authorization,
                                @PathVariable String id) {
        UserDto user = authService.getUserFromBearer(authorization);
        return workGroupService.getById(id, user);
    }

    /**
     * Crea un nuevo grupo de trabajo y su chat asociado.
     */
    @PostMapping
    public WorkGroupDto create(@RequestHeader(name = "Authorization", required = false) String authorization,
                               @RequestBody CreateWorkGroupRequestDto request) {
        UserDto user = authService.getUserFromBearer(authorization);
        return workGroupService.create(request, user);
    }

    /**
     * Actualiza nombre, descripcion y miembros del grupo.
     */
    @PutMapping("/{id}")
    public WorkGroupDto update(@RequestHeader(name = "Authorization", required = false) String authorization,
                               @PathVariable String id,
                               @RequestBody CreateWorkGroupRequestDto request) {
        UserDto user = authService.getUserFromBearer(authorization);
        return workGroupService.update(id, request, user);
    }

    /**
     * Elimina un grupo y su chat.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@RequestHeader(name = "Authorization", required = false) String authorization,
                                       @PathVariable String id) {
        UserDto user = authService.getUserFromBearer(authorization);
        workGroupService.delete(id, user);
        return ResponseEntity.noContent().build();
    }

    /**
     * Agrega un miembro a un grupo existente.
     */
    @PostMapping("/{id}/members")
    public WorkGroupDto addMember(@RequestHeader(name = "Authorization", required = false) String authorization,
                                  @PathVariable String id,
                                  @RequestBody UpdateWorkGroupMembersRequestDto request) {
        UserDto user = authService.getUserFromBearer(authorization);
        return workGroupService.addMember(id, request.getUserId(), user);
    }

    /**
     * Elimina un miembro del grupo.
     */
    @DeleteMapping("/{id}/members/{userId}")
    public WorkGroupDto removeMember(@RequestHeader(name = "Authorization", required = false) String authorization,
                                     @PathVariable String id,
                                     @PathVariable String userId) {
        UserDto user = authService.getUserFromBearer(authorization);
        return workGroupService.removeMember(id, userId, user);
    }
}
