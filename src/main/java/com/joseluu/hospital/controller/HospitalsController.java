package com.joseluu.hospital.controller;

import com.joseluu.hospital.dto.CreateHospitalRequestDto;
import com.joseluu.hospital.dto.HospitalDto;
import com.joseluu.hospital.dto.AnnouncementDto;
import com.joseluu.hospital.dto.UserDto;
import com.joseluu.hospital.entity.enums.HospitalStatus;
import com.joseluu.hospital.service.AuthService;
import com.joseluu.hospital.service.HospitalService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Endpoints de administracion de hospitales.
 */
@RestController
@RequestMapping("/api/hospitals")
@Validated
public class HospitalsController {
    private final HospitalService hospitalService;
    private final AuthService authService;

    public HospitalsController(HospitalService hospitalService, AuthService authService) {
        this.hospitalService = hospitalService;
        this.authService = authService;
    }

    /**
     * Lista todos los hospitales registrados.
     */
    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public List<HospitalDto> getAll() {
        return hospitalService.getAll();
    }

    /**
     * Obtiene un hospital por su identificador.
     */
    @GetMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public HospitalDto getById(@PathVariable @NotBlank(message = "El id es obligatorio") String id) {
        return hospitalService.getById(id);
    }

    /**
     * Crea un hospital con el administrador asignado.
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public HospitalDto create(@Valid @RequestBody CreateHospitalRequestDto request) {
        return hospitalService.create(request);
    }

    /**
     * Actualiza datos generales de un hospital.
     */
    @PutMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    public HospitalDto update(@PathVariable @NotBlank(message = "El id es obligatorio") String id,
                              @Valid @RequestBody HospitalDto payload) {
        return hospitalService.update(id, payload);
    }

    /**
     * Cambia el estado (activo, suspendido, etc.) de un hospital.
     */
    @PatchMapping("/{id}/status")
    @ResponseStatus(HttpStatus.OK)
    public HospitalDto updateStatus(@PathVariable @NotBlank(message = "El id es obligatorio") String id,
                                    @Valid @RequestBody StatusUpdate request) {
        return hospitalService.updateStatus(id, request.getStatus());
    }

    /**
     * Elimina un hospital y los datos asociados.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable @NotBlank(message = "El id es obligatorio") String id) {
        hospitalService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Agrega un anuncio a un hospital.
     */
    @PostMapping("/{id}/announcements")
    @ResponseStatus(HttpStatus.CREATED)
    public AnnouncementDto addAnnouncement(@RequestHeader(name = "Authorization", required = false) String authorization,
                                           @PathVariable @NotBlank(message = "El id es obligatorio") String id,
                                           @Valid @RequestBody AnnouncementDto request) {
        UserDto user = authService.getUserFromBearer(authorization);
        validateAnnouncement(request);
        return hospitalService.addAnnouncement(id, request, user.getId());
    }

    /**
     * Actualiza un anuncio de un hospital.
     */
    @PutMapping("/{id}/announcements/{announcementId}")
    @ResponseStatus(HttpStatus.OK)
    public AnnouncementDto updateAnnouncement(@PathVariable @NotBlank(message = "El id es obligatorio") String id,
                                              @PathVariable @NotBlank(message = "El announcementId es obligatorio") String announcementId,
                                              @Valid @RequestBody AnnouncementDto request) {
        validateAnnouncement(request);
        return hospitalService.updateAnnouncement(id, announcementId, request);
    }

    /**
     * Elimina un anuncio de un hospital.
     */
    @DeleteMapping("/{id}/announcements/{announcementId}")
    public ResponseEntity<Void> deleteAnnouncement(@PathVariable @NotBlank(message = "El id es obligatorio") String id,
                                                   @PathVariable @NotBlank(message = "El announcementId es obligatorio") String announcementId) {
        hospitalService.deleteAnnouncement(id, announcementId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Verifica los campos obligatorios de un anuncio.
     */
    private void validateAnnouncement(AnnouncementDto request) {
        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new IllegalArgumentException("El titulo del anuncio es obligatorio");
        }
        if (request.getContent() == null || request.getContent().isBlank()) {
            throw new IllegalArgumentException("El contenido del anuncio es obligatorio");
        }
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
