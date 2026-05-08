package com.joseluu.hospital.controller;

import com.joseluu.hospital.dto.CreateHospitalRequestDto;
import com.joseluu.hospital.dto.HospitalDto;
import com.joseluu.hospital.dto.AnnouncementDto;
import com.joseluu.hospital.dto.UserDto;
import com.joseluu.hospital.entity.enums.HospitalStatus;
import com.joseluu.hospital.service.AuthService;
import com.joseluu.hospital.service.HospitalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Endpoints de administracion de hospitales.
 */
@Tag(name = "Hospitales", description = "Gestion de hospitales del sistema")
@RestController
@RequestMapping("/api/hospitals")
public class HospitalsController {
    private final HospitalService hospitalService;
    private final AuthService authService;

    public HospitalsController(HospitalService hospitalService, AuthService authService) {
        this.hospitalService = hospitalService;
        this.authService = authService;
    }

    /**
     * Lista todos los hospitales registrados.
     * Accesible por cualquier usuario autenticado.
     */
    @Operation(summary = "Listar hospitales")
    @PreAuthorize("isAuthenticated()")
    @GetMapping
    public List<HospitalDto> getAll() {
        return hospitalService.getAll();
    }

    /**
     * Obtiene un hospital por su identificador.
     */
    @Operation(summary = "Obtener hospital por id")
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/{id}")
    public HospitalDto getById(@PathVariable String id) {
        return hospitalService.getById(id);
    }

    /**
     * Crea un hospital con el administrador asignado.
     * Solo ROOT puede crear hospitales.
     */
    @Operation(summary = "Crear hospital", description = "Registra un nuevo hospital en el sistema. Solo ROOT.")
    @PreAuthorize("hasRole('ROOT')")
    @PostMapping
    public HospitalDto create(@Valid @RequestBody CreateHospitalRequestDto request) {
        return hospitalService.create(request);
    }

    /**
     * Actualiza datos generales de un hospital.
     * Solo HOSPITAL_ADMIN o ROOT.
     */
    @Operation(summary = "Actualizar hospital")
    @PreAuthorize("hasAnyRole('HOSPITAL_ADMIN','ROOT')")
    @PutMapping("/{id}")
    public HospitalDto update(@PathVariable String id, @RequestBody HospitalDto payload) {
        return hospitalService.update(id, payload);
    }

    /**
     * Cambia el estado (activo, suspendido, etc.) de un hospital.
     * Solo ROOT puede suspender o reactivar hospitales.
     */
    @Operation(summary = "Cambiar estado del hospital", description = "Cambia el estado operativo del hospital. Solo ROOT.")
    @PreAuthorize("hasRole('ROOT')")
    @PatchMapping("/{id}/status")
    public HospitalDto updateStatus(@PathVariable String id, @Valid @RequestBody StatusUpdate request) {
        return hospitalService.updateStatus(id, request.getStatus());
    }

    /**
     * Elimina un hospital y los datos asociados.
     * Solo ROOT puede eliminar hospitales.
     */
    @Operation(summary = "Eliminar hospital", description = "Elimina un hospital y todos sus datos. Solo ROOT.")
    @PreAuthorize("hasRole('ROOT')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        hospitalService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Agrega un anuncio a un hospital.
     * HOSPITAL_ADMIN o ROOT pueden publicar anuncios.
     */
    @Operation(summary = "Publicar anuncio")
    @PreAuthorize("hasAnyRole('HOSPITAL_ADMIN','ROOT')")
    @PostMapping("/{id}/announcements")
    public AnnouncementDto addAnnouncement(@RequestHeader(name = "Authorization", required = false) String authorization,
                                           @PathVariable String id,
                                           @RequestBody AnnouncementDto request) {
        UserDto user = authService.getUserFromBearer(authorization);
        return hospitalService.addAnnouncement(id, request, user.getId());
    }

    /**
     * Actualiza un anuncio de un hospital.
     */
    @Operation(summary = "Actualizar anuncio")
    @PreAuthorize("hasAnyRole('HOSPITAL_ADMIN','ROOT')")
    @PutMapping("/{id}/announcements/{announcementId}")
    public AnnouncementDto updateAnnouncement(@PathVariable String id,
                                              @PathVariable String announcementId,
                                              @RequestBody AnnouncementDto request) {
        return hospitalService.updateAnnouncement(id, announcementId, request);
    }

    /**
     * Elimina un anuncio de un hospital.
     */
    @Operation(summary = "Eliminar anuncio")
    @PreAuthorize("hasAnyRole('HOSPITAL_ADMIN','ROOT')")
    @DeleteMapping("/{id}/announcements/{announcementId}")
    public ResponseEntity<Void> deleteAnnouncement(@PathVariable String id,
                                                   @PathVariable String announcementId) {
        hospitalService.deleteAnnouncement(id, announcementId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Payload minimo para cambios de estado.
     */
    public static class StatusUpdate {
        @NotNull(message = "El estado es obligatorio")
        private HospitalStatus status;

        public HospitalStatus getStatus() {
            return status;
        }

        public void setStatus(HospitalStatus status) {
            this.status = status;
        }
    }
}
