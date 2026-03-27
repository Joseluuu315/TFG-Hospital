package com.joseluu.hospital.service;

import com.joseluu.hospital.entity.AnnouncementDocument;
import com.joseluu.hospital.entity.CalendarEventDocument;
import com.joseluu.hospital.entity.ChatDocument;
import com.joseluu.hospital.entity.ChatMessageDocument;
import com.joseluu.hospital.entity.HospitalDocument;
import com.joseluu.hospital.entity.LeaveRequestDocument;
import com.joseluu.hospital.entity.PayrollDocument;
import com.joseluu.hospital.entity.UserDocument;
import com.joseluu.hospital.entity.WorkGroupDocument;
import com.joseluu.hospital.entity.enums.ChatType;
import com.joseluu.hospital.entity.enums.HospitalStatus;
import com.joseluu.hospital.entity.enums.PayrollStatus;
import com.joseluu.hospital.entity.enums.UserRole;
import com.joseluu.hospital.repository.ChatMessageRepository;
import com.joseluu.hospital.repository.ChatRepository;
import com.joseluu.hospital.repository.HospitalRepository;
import com.joseluu.hospital.repository.LeaveRequestRepository;
import com.joseluu.hospital.repository.PayrollRepository;
import com.joseluu.hospital.repository.UserRepository;
import com.joseluu.hospital.repository.WorkGroupRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.UUID;

/**
 * Carga datos iniciales para entornos de desarrollo o demo.
 */
@Component
public class DataSeeder implements ApplicationRunner {
    private final HospitalRepository hospitalRepository;
    private final UserRepository userRepository;
    private final PayrollRepository payrollRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final ChatRepository chatRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final WorkGroupRepository workGroupRepository;

    private String hospitalId;
    private String rootId;
    private String adminId;
    private String workerId;
    private String supportChatId;
    private String urgentGroupChatId;

    public DataSeeder(HospitalRepository hospitalRepository,
                      UserRepository userRepository,
                      PayrollRepository payrollRepository,
                      LeaveRequestRepository leaveRequestRepository,
                      ChatRepository chatRepository,
                      ChatMessageRepository chatMessageRepository,
                      WorkGroupRepository workGroupRepository) {
        this.hospitalRepository = hospitalRepository;
        this.userRepository = userRepository;
        this.payrollRepository = payrollRepository;
        this.leaveRequestRepository = leaveRequestRepository;
        this.chatRepository = chatRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.workGroupRepository = workGroupRepository;
    }

    /**
     * Ejecuta la siembra de datos solo si las colecciones estan vacias.
     */
    @Override
    public void run(ApplicationArguments args) {
        hydrateExistingReferences();
        migrateLegacySupportChats();
        if (hospitalRepository.count() == 0) {
            seedHospitals();
        }
        if (userRepository.count() == 0) {
            seedUsers();
        }
        if (leaveRequestRepository.count() == 0) {
            seedLeaveRequests();
        }
        if (payrollRepository.count() == 0) {
            seedPayrolls();
        }
        if (chatRepository.count() == 0) {
            seedChats();
        }
        if (chatMessageRepository.count() == 0) {
            seedMessages();
        }
        if (workGroupRepository.count() == 0 && chatRepository.count() > 0) {
            seedWorkGroups();
        }
    }

    /**
     * Recupera ids existentes para evitar duplicados al sembrar.
     * Metodo facilitado por la IA
     */
    private void hydrateExistingReferences() {
        hospitalRepository.findAll().stream().findFirst().ifPresent(hospital -> hospitalId = hospital.getId());
        userRepository.findAll().forEach(user -> {
            if (user.getRole() == UserRole.ROOT) {
                rootId = user.getId();
            } else if (user.getRole() == UserRole.HOSPITAL_ADMIN) {
                adminId = user.getId();
            } else if (user.getRole() == UserRole.WORKER) {
                workerId = user.getId();
            }
        });
        chatRepository.findAll().forEach(chat -> {
            if (chat.getType() == ChatType.SUPPORT) {
                supportChatId = chat.getId();
            } else if (chat.getType() == ChatType.GROUP && "Equipo de Urgencias".equals(chat.getName())) {
                urgentGroupChatId = chat.getId();
            }
        });
    }

    /**
     * Convierte chats antiguos a tipo SOPORTE cuando corresponda.
     * Metodo facilitado por la IA
     */
    private void migrateLegacySupportChats() {
        chatRepository.findAll().forEach(chat -> {
            boolean looksLikeLegacySupport = chat.getName() != null
                    && chat.getName().toLowerCase().contains("soporte");
            if (looksLikeLegacySupport && chat.getType() != ChatType.SUPPORT) {
                chat.setType(ChatType.SUPPORT);
                if (chat.getDescription() == null || chat.getDescription().isBlank()) {
                    chat.setDescription("Canal de soporte entre la administracion central y el hospital");
                }
                chatRepository.save(chat);
            }
        });
    }

    /**
     * Inserta el hospital principal de ejemplo.
     */
    private void seedHospitals() {
        LocalDateTime now = LocalDateTime.now();
        HospitalDocument hospital = HospitalDocument.builder()
                .id(UUID.randomUUID().toString())
                .name("Hospital Reina Sofia")
                .address("Av. de la Salud, 123")
                .city("Cordoba")
                .province("Cordoba")
                .taxId("B12345678")
                .status(HospitalStatus.ACTIVE)
                .announcements(buildAnnouncements())
                .createdAt(now.toString())
                .updatedAt(now.toString())
                .build();
        hospitalId = hospitalRepository.save(hospital).getId();
    }

    /**
     * Genera anuncios de ejemplo para el hospital.
     */
    private List<AnnouncementDocument> buildAnnouncements() {
        LocalDateTime now = LocalDateTime.now();
        return Arrays.asList(
                AnnouncementDocument.builder()
                        .id(UUID.randomUUID().toString())
                        .title("Nuevo protocolo de seguridad")
                        .content("Actualizamos el protocolo de actuación frente a incidentes de seguridad sanitaria.")
                        .priority(com.joseluu.hospital.entity.enums.AnnouncementPriority.HIGH)
                        .authorId("admin")
                        .publishedAt(now.minusDays(3).toString())
                        .expiresAt(now.plusDays(30).toString())
                        .active(true)
                        .build(),
                AnnouncementDocument.builder()
                        .id(UUID.randomUUID().toString())
                        .title("Horarios de verano")
                        .content("Turnos de verano intensivos de 7:30 a 15:00.")
                        .priority(com.joseluu.hospital.entity.enums.AnnouncementPriority.MEDIUM)
                        .authorId("admin")
                        .publishedAt(now.minusDays(15).toString())
                        .expiresAt(now.plusDays(60).toString())
                        .active(true)
                        .build()
        );
    }

    /**
     * Crea usuarios iniciales (root, admin y trabajador).
     */
    private void seedUsers() {
        LocalDateTime now = LocalDateTime.now();
        String rootRefId = UUID.randomUUID().toString();
        UserDocument root = UserDocument.builder()
                .id(rootRefId)
                .firstName("Carlos")
                .lastName("Rodriguez")
                .imageURL("@/media/averonixlogo.png")
                .email("superadmin@trassierra.com")
                .dni("12345678A")
                .role(UserRole.ROOT)
                .password("admin123")
                .enabled(true)
                .accountNonLocked(true)
                .createdAt(now.toString())
                .updatedAt(now.toString())
                .build();
        rootId = rootRefId;

        String adminRefId = UUID.randomUUID().toString();
        UserDocument admin = UserDocument.builder()
                .id(adminRefId)
                .firstName("Maria")
                .lastName("Garcia")
                .imageURL("@/media/averonixlogo.png")
                .email("admin@hospital-reina-sofia.com")
                .dni("87654321B")
                .role(UserRole.HOSPITAL_ADMIN)
                .hospitalId(hospitalId)
                .hospitalName("Hospital Reina Sofia")
                .department("Administración")
                .jobTitle("Directora Ejecutiva")
                .password("admin123")
                .enabled(true)
                .accountNonLocked(true)
                .createdAt(now.toString())
                .updatedAt(now.toString())
                .build();
        adminId = adminRefId;

        String workerRefId = UUID.randomUUID().toString();
        UserDocument worker = UserDocument.builder()
                .id(workerRefId)
                .firstName("Juan")
                .lastName("Perez")
                .imageURL("@/media/averonixlogo.png")
                .email("trabajador@hospital-reina-sofia.com")
                .dni("11223344C")
                .role(UserRole.WORKER)
                .hospitalId(hospitalId)
                .hospitalName("Hospital Reina Sofia")
                .department("Urgencias")
                .jobTitle("Enfermero")
                .baseSalary(2200.0)
                .password("worker123")
                .enabled(true)
                .accountNonLocked(true)
                .calendarEvents(buildCalendarEvents(workerRefId))
                .createdAt(now.toString())
                .updatedAt(now.toString())
                .build();
        workerId = workerRefId;

        userRepository.saveAll(Arrays.asList(root, admin, worker));
    }

    /**
     * Genera eventos de calendario de ejemplo para un usuario.
     */
    private List<CalendarEventDocument> buildCalendarEvents(String userId) {
        LocalDateTime now = LocalDateTime.now();
        List<CalendarEventDocument> events = new ArrayList<>();
        events.add(CalendarEventDocument.builder()
                .id(UUID.randomUUID().toString())
                .userId(userId)
                .date(now.toLocalDate().toString())
                .type("SHIFT")
                .startTime("07:00")
                .endTime("15:00")
                .notes("Turno de mañana - Urgencias")
                .build());
        events.add(CalendarEventDocument.builder()
                .id(UUID.randomUUID().toString())
                .userId(userId)
                .date(now.plusDays(1).toLocalDate().toString())
                .type("SHIFT")
                .startTime("15:00")
                .endTime("23:00")
                .notes("Turno de tarde")
                .build());
        return events;
    }

    /**
     * Inserta una solicitud de ausencia de ejemplo.
     */
    private void seedLeaveRequests() {
        LocalDateTime now = LocalDateTime.now();
        LeaveRequestDocument request = LeaveRequestDocument.builder()
                .id(UUID.randomUUID().toString())
                .userId(workerId)
                .startDate(now.plusDays(10).toLocalDate().toString())
                .endDate(now.plusDays(25).toLocalDate().toString())
                .reason("Vacaciones de verano")
                .status(com.joseluu.hospital.dto.LeaveRequestStatus.PENDING)
                .requestedAt(now.toString())
                .build();
        leaveRequestRepository.save(request);
    }

    /**
     * Inserta una nomina de ejemplo.
     */
    private void seedPayrolls() {
        LocalDateTime now = LocalDateTime.now();
        PayrollDocument payroll = PayrollDocument.builder()
                .id(UUID.randomUUID().toString())
                .workerId(workerId)
                .workerFullName("Juan Perez")
                .hospitalId(hospitalId)
                .period(now.minusMonths(1).toString().substring(0, 7))
                .grossSalary(2200)
                .overtimeAmount(150)
                .bonusAmount(50)
                .otherDeductions(200)
                .incomeTaxWithholding(330)
                .socialSecurityWorker(140)
                .netSalary(1820)
                .status(PayrollStatus.ISSUED)
                .issuedAt(now.minusMonths(1).toString())
                .build();
        payrollRepository.save(payroll);
    }

    /**
     * Crea chats de ejemplo (hospital, soporte y grupo).
     */
    private void seedChats() {
        LocalDateTime now = LocalDateTime.now();
        ChatDocument hospitalChat = ChatDocument.builder()
                .id(UUID.randomUUID().toString())
                .type(ChatType.HOSPITAL)
                .name("Hospital Reina Sofia - General")
                .description("Chat general del hospital")
                .participants(Arrays.asList(adminId, workerId))
                .participantNames(Arrays.asList("Maria Garcia", "Juan Perez"))
                .createdBy(adminId)
                .hospitalId(hospitalId)
                .lastMessage("Recordad la reunión de mañana")
                .lastMessageTime(now.minusHours(2).toString())
                .unreadCounts(buildUnread(adminId, workerId))
                .createdAt(now.toString())
                .updatedAt(now.toString())
                .build();

        supportChatId = UUID.randomUUID().toString();
        ChatDocument adminPrivate = ChatDocument.builder()
                .id(supportChatId)
                .type(ChatType.SUPPORT)
                .name("Soporte - Hospital Reina Sofia")
                .description("Canal de soporte entre la administracion central y el hospital")
                .participants(Arrays.asList(adminId, rootId))
                .participantNames(Arrays.asList("Maria Garcia", "Carlos Rodriguez"))
                .createdBy(adminId)
                .hospitalId(hospitalId)
                .lastMessage("El problema se solucionó")
                .lastMessageTime(now.minusDays(1).toString())
                .unreadCounts(buildUnread(adminId, rootId))
                .createdAt(now.toString())
                .updatedAt(now.toString())
                .build();

        urgentGroupChatId = UUID.randomUUID().toString();
        ChatDocument groupChat = ChatDocument.builder()
                .id(urgentGroupChatId)
                .type(ChatType.GROUP)
                .name("Equipo de Urgencias")
                .description("Coordinacion diaria del equipo de urgencias")
                .participants(Arrays.asList(adminId, workerId))
                .participantNames(Arrays.asList("Maria Garcia", "Juan Perez"))
                .createdBy(adminId)
                .hospitalId(hospitalId)
                .lastMessage("Necesito que alguien cubra el sábado")
                .lastMessageTime(now.minusHours(5).toString())
                .unreadCounts(buildUnread(adminId, workerId))
                .createdAt(now.toString())
                .updatedAt(now.toString())
                .build();

        chatRepository.saveAll(Arrays.asList(hospitalChat, adminPrivate, groupChat));
    }

    /**
     * Crea grupos de trabajo asociados a chats existentes.
     */
    private void seedWorkGroups() {
        if (hospitalId == null || adminId == null || workerId == null || urgentGroupChatId == null) {
            return;
        }
        String now = LocalDateTime.now().toString();
        WorkGroupDocument urgentGroup = WorkGroupDocument.builder()
                .id(UUID.randomUUID().toString())
                .name("Equipo de Urgencias")
                .description("Coordinacion diaria del equipo de urgencias")
                .hospitalId(hospitalId)
                .members(Arrays.asList(adminId, workerId))
                .memberNames(Arrays.asList("Maria Garcia", "Juan Perez"))
                .createdBy(adminId)
                .chatId(urgentGroupChatId)
                .createdAt(now)
                .updatedAt(now)
                .build();
        workGroupRepository.save(urgentGroup);
    }

    /**
     * Inicializa el conteo de mensajes no leidos para dos participantes.
     */
    private HashMap<String, Integer> buildUnread(String participantA, String participantB) {
        HashMap<String, Integer> unread = new HashMap<>();
        unread.put(participantA, 0);
        unread.put(participantB, 1);
        return unread;
    }

    /**
     * Inserta un mensaje inicial en cada chat.
     */
    private void seedMessages() {
        List<ChatDocument> chats = chatRepository.findAll();
        List<ChatMessageDocument> messages = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        for (ChatDocument chat : chats) {
            messages.add(ChatMessageDocument.builder()
                    .id(UUID.randomUUID().toString())
                    .chatId(chat.getId())
                    .senderId(chat.getParticipants().get(0))
                    .senderName(chat.getParticipantNames().get(0))
                    .content("Hola, ¿qué tal?")
                    .timestamp(now.toString())
                    .read(false)
                    .build());
        }
        chatMessageRepository.saveAll(messages);
    }
}
