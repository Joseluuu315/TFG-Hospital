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
import com.joseluu.hospital.exception.BadRequestException;
import com.joseluu.hospital.exception.NotFoundException;
import com.joseluu.hospital.repository.ChatMessageRepository;
import com.joseluu.hospital.repository.ChatRepository;
import com.joseluu.hospital.repository.HospitalRepository;
import com.joseluu.hospital.repository.LeaveRequestRepository;
import com.joseluu.hospital.repository.PayrollRepository;
import com.joseluu.hospital.repository.UserRepository;
import com.joseluu.hospital.repository.WorkGroupRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Servicio para gestionar hospitales y anuncios internos.
 */
@Service
public class HospitalService {
    private final HospitalRepository hospitalRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final PayrollRepository payrollRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final WorkGroupRepository workGroupRepository;
    private final ChatRepository chatRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final HospitalSettingsService hospitalSettingsService;
    private final AuditLogService auditLogService;
    private final ShiftTypeService shiftTypeService;

    public HospitalService(HospitalRepository hospitalRepository,
                           UserRepository userRepository,
                           NotificationService notificationService,
                           PayrollRepository payrollRepository,
                           LeaveRequestRepository leaveRequestRepository,
                           WorkGroupRepository workGroupRepository,
                           ChatRepository chatRepository,
                           ChatMessageRepository chatMessageRepository,
                           HospitalSettingsService hospitalSettingsService,
                           AuditLogService auditLogService,
                           ShiftTypeService shiftTypeService) {
        this.hospitalRepository = hospitalRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.payrollRepository = payrollRepository;
        this.leaveRequestRepository = leaveRequestRepository;
        this.workGroupRepository = workGroupRepository;
        this.chatRepository = chatRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.hospitalSettingsService = hospitalSettingsService;
        this.auditLogService = auditLogService;
        this.shiftTypeService = shiftTypeService;
    }

    /**
     * Lista todos los hospitales.
     */
    public List<HospitalDto> getAll() {
        List<HospitalDto> hospitals = new ArrayList<>();
        for (HospitalDocument document : hospitalRepository.findAll()) {
            hospitals.add(toDto(document));
        }
        return hospitals;
    }

    /**
     * Obtiene un hospital por id.
     */
    public HospitalDto getById(String id) {
        return toDto(requireHospital(id));
    }

    /**
     * Crea un hospital con configuracion inicial.
     */
    public HospitalDto create(CreateHospitalRequestDto request) {
        LocalDateTime now = LocalDateTime.now();
        String hospitalId = UUID.randomUUID().toString();

        HospitalDocument document = HospitalDocument.builder()
                .id(hospitalId)
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

        HospitalDocument savedHospital = hospitalRepository.save(document);
        createAdminForHospital(savedHospital, request.getAdminEmail(), now);
        hospitalSettingsService.seedDefaults(savedHospital.getId());
        shiftTypeService.seedDefaults(savedHospital.getId());
        auditLogService.log(
                savedHospital.getId(),
                null,
                "HOSPITAL_CREATED",
                "hospitals",
                savedHospital.getId(),
                "Hospital creado con administrador inicial"
        );

        return toDto(savedHospital);
    }

    /**
     * Actualiza el estado de un hospital.
     */
    public HospitalDto updateStatus(String id, HospitalStatus status) {
        if (status == null) {
            throw new BadRequestException("El estado es obligatorio");
        }

        HospitalDocument document = requireHospital(id);
        document.setStatus(status);
        saveHospital(document);
        return toDto(document);
    }

    /**
     * Actualiza los datos generales de un hospital.
     */
    public HospitalDto update(String id, HospitalDto update) {
        HospitalDocument document = requireHospital(id);
        document.setName(update.getName());
        document.setAddress(update.getAddress());
        document.setCity(update.getCity());
        document.setProvince(update.getProvince());
        document.setTaxId(update.getTaxId());
        saveHospital(document);
        return toDto(document);
    }

    /**
     * Elimina un hospital y sus datos relacionados.
     */
    public void delete(String id) {
        deleteUsersFromHospital(id);
        deleteWorkGroupsFromHospital(id);
        deleteChatsFromHospital(id);
        hospitalRepository.deleteById(id);
    }

    /**
     * Agrega un anuncio a un hospital.
     */
    public AnnouncementDto addAnnouncement(String hospitalId, AnnouncementDto request, String authorId) {
        HospitalDocument document = requireHospital(hospitalId);
        AnnouncementDocument announcement = buildAnnouncement(request, authorId);

        List<AnnouncementDocument> announcements = getAnnouncements(document);
        announcements.add(0, announcement);
        document.setAnnouncements(announcements);
        saveHospital(document);

        notifyWorkersAboutAnnouncement(hospitalId, announcement);
        return toAnnouncementDto(announcement);
    }

    /**
     * Actualiza un anuncio ya existente.
     */
    public AnnouncementDto updateAnnouncement(String hospitalId, String announcementId, AnnouncementDto request) {
        HospitalDocument document = requireHospital(hospitalId);
        AnnouncementDocument announcement = requireAnnouncement(document, announcementId);

        announcement.setTitle(request.getTitle());
        announcement.setContent(request.getContent());
        announcement.setPriority(request.getPriority());
        announcement.setExpiresAt(request.getExpiresAt());
        announcement.setActive(request.isActive());

        saveHospital(document);
        return toAnnouncementDto(announcement);
    }

    /**
     * Elimina un anuncio de un hospital.
     */
    public void deleteAnnouncement(String hospitalId, String announcementId) {
        HospitalDocument document = requireHospital(hospitalId);
        List<AnnouncementDocument> announcements = getAnnouncements(document);
        boolean removed = false;

        for (int i = 0; i < announcements.size(); i++) {
            if (announcementId.equals(announcements.get(i).getId())) {
                announcements.remove(i);
                removed = true;
                break;
            }
        }

        if (!removed) {
            throw new NotFoundException("Anuncio no encontrado");
        }

        document.setAnnouncements(announcements);
        saveHospital(document);
    }

    /**
     * Convierte la entidad de hospital a DTO.
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
     * Convierte una lista de anuncios embebidos a DTOs.
     */
    private List<AnnouncementDto> mapAnnouncements(List<AnnouncementDocument> documents) {
        List<AnnouncementDto> announcements = new ArrayList<>();
        if (documents == null) {
            return announcements;
        }

        for (AnnouncementDocument document : documents) {
            announcements.add(toAnnouncementDto(document));
        }

        return announcements;
    }

    /**
     * Convierte un anuncio a DTO.
     */
    private AnnouncementDto toAnnouncementDto(AnnouncementDocument document) {
        return AnnouncementDto.builder()
                .id(document.getId())
                .title(document.getTitle())
                .content(document.getContent())
                .priority(document.getPriority())
                .authorId(document.getAuthorId())
                .publishedAt(document.getPublishedAt())
                .expiresAt(document.getExpiresAt())
                .active(document.isActive())
                .build();
    }

    /**
     * Busca un anuncio concreto dentro del hospital.
     */
    private AnnouncementDocument requireAnnouncement(HospitalDocument hospital, String announcementId) {
        for (AnnouncementDocument announcement : getAnnouncements(hospital)) {
            if (announcementId.equals(announcement.getId())) {
                return announcement;
            }
        }
        throw new NotFoundException("Anuncio no encontrado");
    }

    /**
     * Crea el administrador inicial del hospital.
     */
    private void createAdminForHospital(HospitalDocument hospital, String adminEmail, LocalDateTime now) {
        if (adminEmail == null || adminEmail.isBlank()) {
            return;
        }

        if (userRepository.findByEmailIgnoreCase(adminEmail).isPresent()) {
            return;
        }

        String[] nameParts = getNameParts(adminEmail);
        String firstName = buildAdminFirstName(nameParts);
        String lastName = buildAdminLastName(nameParts, hospital.getName());

        UserDocument admin = UserDocument.builder()
                .id(UUID.randomUUID().toString())
                .firstName(firstName)
                .lastName(lastName)
                .email(adminEmail)
                .password("admin123")
                .role(UserRole.HOSPITAL_ADMIN)
                .enabled(true)
                .accountNonLocked(true)
                .hospitalId(hospital.getId())
                .hospitalName(hospital.getName())
                .department("Administracion")
                .jobTitle("Administrador del hospital")
                .createdAt(now.toString())
                .updatedAt(now.toString())
                .build();

        userRepository.save(admin);
        notificationService.createNotification(
                admin.getId(),
                NotificationType.NEW_ANNOUNCEMENT,
                "Cuenta inicial creada. Credenciales temporales: " + adminEmail + " / admin123"
        );
    }

    /**
     * Busca un hospital o lanza error.
     */
    private HospitalDocument requireHospital(String hospitalId) {
        return hospitalRepository.findById(hospitalId)
                .orElseThrow(() -> new NotFoundException("Hospital no encontrado"));
    }

    /**
     * Guarda el hospital actualizando su fecha de modificacion.
     */
    private void saveHospital(HospitalDocument hospital) {
        hospital.setUpdatedAt(LocalDateTime.now().toString());
        hospitalRepository.save(hospital);
    }

    /**
     * Elimina usuarios y sus datos dependientes del hospital.
     */
    private void deleteUsersFromHospital(String hospitalId) {
        for (UserDocument user : userRepository.findAll()) {
            if (!hospitalId.equals(user.getHospitalId())) {
                continue;
            }

            leaveRequestRepository.findByUserId(user.getId())
                    .forEach(request -> leaveRequestRepository.deleteById(request.getId()));
            payrollRepository.findByWorkerId(user.getId())
                    .forEach(payroll -> payrollRepository.deleteById(payroll.getId()));
            userRepository.deleteById(user.getId());
        }
    }

    /**
     * Elimina los grupos de trabajo del hospital.
     */
    private void deleteWorkGroupsFromHospital(String hospitalId) {
        workGroupRepository.findByHospitalId(hospitalId)
                .forEach(group -> workGroupRepository.deleteById(group.getId()));
    }

    /**
     * Elimina los chats del hospital y sus mensajes.
     */
    private void deleteChatsFromHospital(String hospitalId) {
        chatRepository.findAll().forEach(chat -> {
            if (!hospitalId.equals(chat.getHospitalId())) {
                return;
            }
            chatMessageRepository.deleteByChatId(chat.getId());
            chatRepository.deleteById(chat.getId());
        });
    }

    /**
     * Construye una entidad anuncio a partir del DTO.
     */
    private AnnouncementDocument buildAnnouncement(AnnouncementDto request, String authorId) {
        return AnnouncementDocument.builder()
                .id(UUID.randomUUID().toString())
                .title(request.getTitle())
                .content(request.getContent())
                .priority(request.getPriority())
                .authorId(authorId)
                .publishedAt(LocalDateTime.now().toString())
                .expiresAt(request.getExpiresAt())
                .active(true)
                .build();
    }

    /**
     * Devuelve los anuncios del hospital o una lista vacia.
     */
    private List<AnnouncementDocument> getAnnouncements(HospitalDocument hospital) {
        if (hospital.getAnnouncements() == null) {
            return new ArrayList<>();
        }
        return new ArrayList<>(hospital.getAnnouncements());
    }

    /**
     * Notifica a los trabajadores del hospital sobre un nuevo anuncio.
     */
    private void notifyWorkersAboutAnnouncement(String hospitalId, AnnouncementDocument announcement) {
        for (UserDocument worker : userRepository.findByRole(UserRole.WORKER)) {
            if (hospitalId.equals(worker.getHospitalId())) {
                notificationService.createNotification(
                        worker.getId(),
                        NotificationType.NEW_ANNOUNCEMENT,
                        "Nuevo anuncio: " + announcement.getTitle()
                );
            }
        }
    }

    /**
     * Extrae las partes del nombre a partir del email del administrador.
     */
    private String[] getNameParts(String adminEmail) {
        String namePart = adminEmail.split("@")[0];
        return namePart.split("[._-]");
    }

    /**
     * Calcula el nombre del administrador inicial.
     */
    private String buildAdminFirstName(String[] nameParts) {
        if (nameParts.length == 0 || nameParts[0].isBlank()) {
            return "Admin";
        }
        return capitalize(nameParts[0]);
    }

    /**
     * Calcula los apellidos del administrador inicial.
     */
    private String buildAdminLastName(String[] nameParts, String hospitalName) {
        if (nameParts.length < 2 || nameParts[1].isBlank()) {
            return hospitalName;
        }
        return capitalize(nameParts[1]);
    }

    /**
     * Pone en mayuscula la primera letra de un texto.
     */
    private String capitalize(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        return value.substring(0, 1).toUpperCase() + value.substring(1);
    }
}
