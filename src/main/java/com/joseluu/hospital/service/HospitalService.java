package com.joseluu.hospital.service;

import com.joseluu.hospital.dto.AnnouncementDto;
import com.joseluu.hospital.dto.CreateHospitalRequestDto;
import com.joseluu.hospital.dto.HospitalDto;
import com.joseluu.hospital.entity.AnnouncementDocument;
import com.joseluu.hospital.entity.HospitalDocument;
import com.joseluu.hospital.entity.UserDocument;
import com.joseluu.hospital.entity.enums.HospitalStatus;
import com.joseluu.hospital.entity.enums.NotificationType;
import com.joseluu.hospital.entity.enums.UserRole;
import com.joseluu.hospital.repository.HospitalRepository;
import com.joseluu.hospital.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Servicio para gestionar hospitales y anuncios internos.
 */
@Service
public class HospitalService {
    private final HospitalRepository hospitalRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public HospitalService(HospitalRepository hospitalRepository, UserRepository userRepository, NotificationService notificationService) {
        this.hospitalRepository = hospitalRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    /**
     * Lista todos los hospitales.
     */
    public List<HospitalDto> getAll() {
        return hospitalRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene un hospital por id.
     */
    public HospitalDto getById(String id) {
        return hospitalRepository.findById(id)
                .map(this::toDto)
                .orElseThrow(() -> new IllegalArgumentException("Hospital no encontrado"));
    }

    /**
     * Crea un nuevo hospital con estado pendiente.
     */
    public HospitalDto create(CreateHospitalRequestDto request) {
        LocalDateTime now = LocalDateTime.now();
        HospitalDocument document = HospitalDocument.builder()
                .id(UUID.randomUUID().toString())
                .name(request.getName())
                .address(request.getAddress())
                .city(request.getCity())
                .province(request.getProvince())
                .taxId(request.getTaxId())
                .status(HospitalStatus.PENDING_REVIEW)
                .announcements(new ArrayList<>())
                .createdAt(now.toString())
                .updatedAt(now.toString())
                .build();
        return toDto(hospitalRepository.save(document));
    }

    /**
     * Actualiza el estado de un hospital.
     */
    public HospitalDto updateStatus(String id, HospitalStatus status) {
        HospitalDocument document = hospitalRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Hospital no encontrado"));
        document.setStatus(status);
        document.setUpdatedAt(LocalDateTime.now().toString());
        return toDto(hospitalRepository.save(document));
    }

    /**
     * Actualiza los datos basicos de un hospital.
     */
    public HospitalDto update(String id, HospitalDto update) {
        HospitalDocument document = hospitalRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Hospital no encontrado"));
        document.setName(update.getName());
        document.setAddress(update.getAddress());
        document.setCity(update.getCity());
        document.setProvince(update.getProvince());
        document.setTaxId(update.getTaxId());
        document.setUpdatedAt(LocalDateTime.now().toString());
        return toDto(hospitalRepository.save(document));
    }

    /**
     * Elimina un hospital por id.
     */
    public void delete(String id) {
        hospitalRepository.deleteById(id);
    }

    /**
     * Agrega un anuncio al hospital.
     */
    public AnnouncementDto addAnnouncement(String hospitalId, AnnouncementDto request, String authorId) {
        HospitalDocument document = hospitalRepository.findById(hospitalId)
                .orElseThrow(() -> new IllegalArgumentException("Hospital no encontrado"));

        List<AnnouncementDocument> announcements = document.getAnnouncements() == null
                ? new ArrayList<>()
                : new ArrayList<>(document.getAnnouncements());

        AnnouncementDocument announcement = AnnouncementDocument.builder()
                .id(UUID.randomUUID().toString())
                .title(request.getTitle())
                .content(request.getContent())
                .priority(request.getPriority())
                .authorId(authorId)
                .publishedAt(LocalDateTime.now().toString())
                .expiresAt(request.getExpiresAt())
                .active(true)
                .build();

        announcements.add(0, announcement);
        document.setAnnouncements(announcements);
        document.setUpdatedAt(LocalDateTime.now().toString());
        hospitalRepository.save(document);

        List<UserDocument> workers = userRepository.findByRole(UserRole.WORKER).stream()
                .filter(user -> user.getHospitalId().equals(hospitalId))
                .collect(Collectors.toList());

        for (UserDocument worker : workers) {
            notificationService.createNotification(worker.getId(), NotificationType.NEW_ANNOUNCEMENT, "Nuevo anuncio: " + announcement.getTitle());
        }

        return toAnnouncementDto(announcement);
    }

    /**
     * Actualiza un anuncio existente.
     */
    public AnnouncementDto updateAnnouncement(String hospitalId, String announcementId, AnnouncementDto request) {
        HospitalDocument document = hospitalRepository.findById(hospitalId)
                .orElseThrow(() -> new IllegalArgumentException("Hospital no encontrado"));

        AnnouncementDocument announcement = requireAnnouncement(document, announcementId);
        announcement.setTitle(request.getTitle());
        announcement.setContent(request.getContent());
        announcement.setPriority(request.getPriority());
        announcement.setExpiresAt(request.getExpiresAt());
        announcement.setActive(request.isActive());
        document.setUpdatedAt(LocalDateTime.now().toString());
        hospitalRepository.save(document);
        return toAnnouncementDto(announcement);
    }

    /**
     * Elimina un anuncio del hospital.
     */
    public void deleteAnnouncement(String hospitalId, String announcementId) {
        HospitalDocument document = hospitalRepository.findById(hospitalId)
                .orElseThrow(() -> new IllegalArgumentException("Hospital no encontrado"));
        document.setAnnouncements(document.getAnnouncements().stream()
                .filter(item -> !item.getId().equals(announcementId))
                .collect(Collectors.toList()));
        document.setUpdatedAt(LocalDateTime.now().toString());
        hospitalRepository.save(document);
    }

    /**
     * Convierte un documento en DTO.
     */
    private HospitalDto toDto(HospitalDocument document) {
        return HospitalDto.builder()
                .id(document.getId())
                .name(document.getName())
                .address(document.getAddress())
                .city(document.getCity())
                .province(document.getProvince())
                .taxId(document.getTaxId())
                .status(document.getStatus())
                .superAdminId(document.getSuperAdminId())
                .announcements(mapAnnouncements(document.getAnnouncements()))
                .createdAt(document.getCreatedAt())
                .updatedAt(document.getUpdatedAt())
                .build();
    }

    /**
     * Convierte anuncios embebidos a DTOs.
     */
    private List<AnnouncementDto> mapAnnouncements(List<AnnouncementDocument> documents) {
        if (documents == null) {
            return new ArrayList<>();
        }
        return documents.stream()
                .map(this::toAnnouncementDto)
                .collect(Collectors.toList());
    }

    /**
     * Convierte un anuncio a su DTO.
     */
    private AnnouncementDto toAnnouncementDto(AnnouncementDocument doc) {
        return AnnouncementDto.builder()
                .id(doc.getId())
                .title(doc.getTitle())
                .content(doc.getContent())
                .priority(doc.getPriority())
                .authorId(doc.getAuthorId())
                .publishedAt(doc.getPublishedAt())
                .expiresAt(doc.getExpiresAt())
                .active(doc.isActive())
                .build();
    }

    /**
     * Obtiene el anuncio solicitado o lanza error.
     */
    private AnnouncementDocument requireAnnouncement(HospitalDocument document, String announcementId) {
        if (document.getAnnouncements() == null) {
            throw new IllegalArgumentException("Anuncio no encontrado");
        }
        return document.getAnnouncements().stream()
                .filter(item -> item.getId().equals(announcementId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Anuncio no encontrado"));
    }
}
