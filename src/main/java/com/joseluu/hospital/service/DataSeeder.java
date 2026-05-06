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
import com.joseluu.hospital.entity.ShiftAssignmentDocument;
import com.joseluu.hospital.entity.ShiftRequirementDocument;
import com.joseluu.hospital.entity.ShiftTypeDocument;
import com.joseluu.hospital.entity.WorkerContractDocument;
import com.joseluu.hospital.entity.PayrollAdjustmentDocument;
import com.joseluu.hospital.entity.PayrollItemDocument;
import com.joseluu.hospital.entity.enums.ChatType;
import com.joseluu.hospital.entity.enums.HospitalStatus;
import com.joseluu.hospital.entity.enums.PayrollStatus;
import com.joseluu.hospital.entity.enums.PayrollAdjustmentType;
import com.joseluu.hospital.entity.enums.PayrollItemType;
import com.joseluu.hospital.entity.enums.ShiftAssignmentSource;
import com.joseluu.hospital.entity.enums.ShiftAssignmentStatus;
import com.joseluu.hospital.entity.enums.UserRole;
import com.joseluu.hospital.repository.ChatMessageRepository;
import com.joseluu.hospital.repository.ChatRepository;
import com.joseluu.hospital.repository.HospitalRepository;
import com.joseluu.hospital.repository.LeaveRequestRepository;
import com.joseluu.hospital.repository.PayrollRepository;
import com.joseluu.hospital.repository.UserRepository;
import com.joseluu.hospital.repository.WorkGroupRepository;
import com.joseluu.hospital.repository.ShiftTypeRepository;
import com.joseluu.hospital.repository.ShiftRequirementRepository;
import com.joseluu.hospital.repository.ShiftAssignmentRepository;
import com.joseluu.hospital.repository.WorkerContractRepository;
import com.joseluu.hospital.repository.PayrollAdjustmentRepository;
import com.joseluu.hospital.repository.PayrollItemRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
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
    private final ShiftTypeRepository shiftTypeRepository;
    private final ShiftRequirementRepository shiftRequirementRepository;
    private final ShiftAssignmentRepository shiftAssignmentRepository;
    private final WorkerContractRepository workerContractRepository;
    private final PayrollAdjustmentRepository payrollAdjustmentRepository;
    private final PayrollItemRepository payrollItemRepository;
    private final AdvancedPayrollService advancedPayrollService;
    private final PasswordService passwordService;

    private String hospitalId;
    private String rootId;
    private String adminId;
    private String workerId;
    private String worker2Id;
    private String worker3Id;
    private String supportChatId;
    private String urgentGroupChatId;

    public DataSeeder(HospitalRepository hospitalRepository,
                       UserRepository userRepository,
                       PayrollRepository payrollRepository,
                       LeaveRequestRepository leaveRequestRepository,
                       ChatRepository chatRepository,
                       ChatMessageRepository chatMessageRepository,
                       WorkGroupRepository workGroupRepository,
                       ShiftTypeRepository shiftTypeRepository,
                       ShiftRequirementRepository shiftRequirementRepository,
                       ShiftAssignmentRepository shiftAssignmentRepository,
                       WorkerContractRepository workerContractRepository,
                       PayrollAdjustmentRepository payrollAdjustmentRepository,
                       PayrollItemRepository payrollItemRepository,
                       AdvancedPayrollService advancedPayrollService,
                       PasswordService passwordService) {
        this.hospitalRepository = hospitalRepository;
        this.userRepository = userRepository;
        this.payrollRepository = payrollRepository;
        this.leaveRequestRepository = leaveRequestRepository;
        this.chatRepository = chatRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.workGroupRepository = workGroupRepository;
        this.shiftTypeRepository = shiftTypeRepository;
        this.shiftRequirementRepository = shiftRequirementRepository;
        this.shiftAssignmentRepository = shiftAssignmentRepository;
        this.workerContractRepository = workerContractRepository;
        this.payrollAdjustmentRepository = payrollAdjustmentRepository;
        this.payrollItemRepository = payrollItemRepository;
        this.advancedPayrollService = advancedPayrollService;
        this.passwordService = passwordService;
    }

    /**
     * Ejecuta la siembra de datos solo si las colecciones estan vacias.
     */
    @Override
    public void run(ApplicationArguments args) {
        hydrateExistingReferences();
        migrateLegacyPasswordHashes();
        migrateLegacySupportChats();
        if (hospitalRepository.count() == 0) {
            seedHospitals();
        }
        if (userRepository.count() == 0) {
            seedUsers();
        }
        if (shiftTypeRepository.count() == 0) {
            seedShiftTypes();
        }
        if (workerContractRepository.count() == 0) {
            seedWorkerContracts();
        }
        if (shiftRequirementRepository.count() == 0) {
            seedShiftRequirements();
        }
        if (shiftAssignmentRepository.count() == 0) {
            seedShiftAssignments();
        }
        if (leaveRequestRepository.count() == 0) {
            seedLeaveRequests();
        }
        if (payrollAdjustmentRepository.count() == 0) {
            seedPayrollAdjustments();
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
     */
    private void hydrateExistingReferences() {
        hospitalRepository.findAll().stream().findFirst().ifPresent(hospital -> hospitalId = hospital.getId());
        List<String> workerIds = new java.util.ArrayList<>();
        userRepository.findAll().forEach(user -> {
            if (user.getRole() == UserRole.ROOT) {
                rootId = user.getId();
            } else if (user.getRole() == UserRole.HOSPITAL_ADMIN) {
                adminId = user.getId();
            } else if (user.getRole() == UserRole.WORKER) {
                workerIds.add(user.getId());
            }
        });
        if (workerIds.size() > 0) workerId = workerIds.get(0);
        if (workerIds.size() > 1) worker2Id = workerIds.get(1);
        if (workerIds.size() > 2) worker3Id = workerIds.get(2);
        chatRepository.findAll().forEach(chat -> {
            if (chat.getType() == ChatType.SUPPORT) {
                supportChatId = chat.getId();
            } else if (chat.getType() == ChatType.GROUP && "Equipo de Urgencias".equals(chat.getName())) {
                urgentGroupChatId = chat.getId();
            }
        });
    }

    /**
     * Convierte contrasenas historicas en claro a BCrypt antes de permitir login.
     */
    private void migrateLegacyPasswordHashes() {
        List<UserDocument> migratedUsers = userRepository.findAll().stream()
                .filter(user -> passwordService.needsMigration(user.getPassword()))
                .peek(user -> {
                    user.setPassword(passwordService.encode(user.getPassword()));
                    user.setUpdatedAt(LocalDateTime.now().toString());
                })
                .toList();

        if (!migratedUsers.isEmpty()) {
            userRepository.saveAll(migratedUsers);
        }
    }

    /**
     * Convierte chats antiguos a tipo SOPORTE cuando corresponda.
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
     * Crea usuarios iniciales (root, admin y tres trabajadores).
     */
    private void seedUsers() {
        LocalDateTime now = LocalDateTime.now();
        String rootRefId = UUID.randomUUID().toString();
        UserDocument root = UserDocument.builder()
                .id(rootRefId)
                .firstName("Carlos")
                .lastName("Rodriguez")
                .imageURL("/averonixlogo.png")
                .email("superadmin@trassierra.com")
                .dni("12345678A")
                .role(UserRole.ROOT)
                .password(passwordService.encode("admin123"))
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
                .imageURL("/averonixlogo.png")
                .email("admin@hospital-reina-sofia.com")
                .dni("87654321B")
                .role(UserRole.HOSPITAL_ADMIN)
                .hospitalId(hospitalId)
                .hospitalName("Hospital Reina Sofia")
                .department("Administración")
                .jobTitle("Directora Ejecutiva")
                .password(passwordService.encode("admin123"))
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
                .imageURL("/averonixlogo.png")
                .email("trabajador1@hospital-reina-sofia.com")
                .dni("11223344C")
                .role(UserRole.WORKER)
                .hospitalId(hospitalId)
                .hospitalName("Hospital Reina Sofia")
                .department("Urgencias")
                .jobTitle("Enfermero")
                .baseSalary(2200.0)
                .password(passwordService.encode("worker123"))
                .enabled(true)
                .accountNonLocked(true)
                .calendarEvents(buildCalendarEvents(workerRefId))
                .createdAt(now.toString())
                .updatedAt(now.toString())
                .build();
        workerId = workerRefId;

        String worker2RefId = UUID.randomUUID().toString();
        UserDocument worker2 = UserDocument.builder()
                .id(worker2RefId)
                .firstName("Ana")
                .lastName("Lopez")
                .imageURL("/averonixlogo.png")
                .email("trabajador2@hospital-reina-sofia.com")
                .dni("22334455D")
                .role(UserRole.WORKER)
                .hospitalId(hospitalId)
                .hospitalName("Hospital Reina Sofia")
                .department("Urgencias")
                .jobTitle("Enfermera")
                .baseSalary(2000.0)
                .password(passwordService.encode("worker123"))
                .enabled(true)
                .accountNonLocked(true)
                .calendarEvents(buildCalendarEvents(worker2RefId))
                .createdAt(now.toString())
                .updatedAt(now.toString())
                .build();
        worker2Id = worker2RefId;

        String worker3RefId = UUID.randomUUID().toString();
        UserDocument worker3 = UserDocument.builder()
                .id(worker3RefId)
                .firstName("Pedro")
                .lastName("Martinez")
                .imageURL("/averonixlogo.png")
                .email("trabajador3@hospital-reina-sofia.com")
                .dni("33445566E")
                .role(UserRole.WORKER)
                .hospitalId(hospitalId)
                .hospitalName("Hospital Reina Sofia")
                .department("Urgencias")
                .jobTitle("Auxiliar Enfermeria")
                .baseSalary(1800.0)
                .password(passwordService.encode("worker123"))
                .enabled(true)
                .accountNonLocked(true)
                .calendarEvents(buildCalendarEvents(worker3RefId))
                .createdAt(now.toString())
                .updatedAt(now.toString())
                .build();
        worker3Id = worker3RefId;

        userRepository.saveAll(Arrays.asList(root, admin, worker, worker2, worker3));
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
     * Inserta solicitudes de ausencia para los trabajadores (vacaciones, dias personales).
     */
    private void seedLeaveRequests() {
        LocalDateTime now = LocalDateTime.now();
        YearMonth currentMonth = YearMonth.now();
        List<LeaveRequestDocument> requests = new java.util.ArrayList<>();
        if (workerId != null) {
            requests.add(LeaveRequestDocument.builder()
                    .id(UUID.randomUUID().toString())
                    .userId(workerId)
                    .hospitalId(hospitalId)
                    .startDate(currentMonth.atDay(Math.min(13, currentMonth.lengthOfMonth())).toString())
                    .endDate(currentMonth.atDay(Math.min(14, currentMonth.lengthOfMonth())).toString())
                    .reason("Vacaciones familiares planificadas")
                    .leaveType("VACATION")
                    .paid(true)
                    .status(com.joseluu.hospital.dto.LeaveRequestStatus.APPROVED)
                    .requestedAt(now.minusDays(10).toString())
                    .reviewedAt(now.minusDays(9).toString())
                    .build());
            requests.add(LeaveRequestDocument.builder()
                    .id(UUID.randomUUID().toString())
                    .userId(workerId)
                    .hospitalId(hospitalId)
                    .startDate(currentMonth.atDay(Math.min(20, currentMonth.lengthOfMonth())).toString())
                    .endDate(currentMonth.atDay(Math.min(20, currentMonth.lengthOfMonth())).toString())
                    .reason("Asuntos propios solicitados")
                    .leaveType("PERSONAL")
                    .paid(false)
                    .status(com.joseluu.hospital.dto.LeaveRequestStatus.APPROVED)
                    .requestedAt(now.toString())
                    .reviewedAt(now.plusMinutes(5).toString())
                    .build());
        }
        if (worker2Id != null) {
            requests.add(LeaveRequestDocument.builder()
                    .id(UUID.randomUUID().toString())
                    .userId(worker2Id)
                    .hospitalId(hospitalId)
                    .startDate(currentMonth.atDay(Math.min(20, currentMonth.lengthOfMonth())).toString())
                    .endDate(currentMonth.atDay(Math.min(21, currentMonth.lengthOfMonth())).toString())
                    .reason("Vacaciones ya aprobadas")
                    .leaveType("VACATION")
                    .paid(true)
                    .status(com.joseluu.hospital.dto.LeaveRequestStatus.APPROVED)
                    .requestedAt(now.minusDays(8).toString())
                    .reviewedAt(now.minusDays(7).toString())
                    .build());
        }
        if (worker3Id != null) {
            requests.add(LeaveRequestDocument.builder()
                    .id(UUID.randomUUID().toString())
                    .userId(worker3Id)
                    .hospitalId(hospitalId)
                    .startDate(currentMonth.atDay(Math.min(21, currentMonth.lengthOfMonth())).toString())
                    .endDate(currentMonth.atDay(Math.min(21, currentMonth.lengthOfMonth())).toString())
                    .reason("Dia personal no remunerado")
                    .leaveType("PERSONAL")
                    .paid(false)
                    .status(com.joseluu.hospital.dto.LeaveRequestStatus.APPROVED)
                    .requestedAt(now.minusDays(3).toString())
                    .reviewedAt(now.minusDays(2).toString())
                    .build());
            requests.add(LeaveRequestDocument.builder()
                    .id(UUID.randomUUID().toString())
                    .userId(worker3Id)
                    .hospitalId(hospitalId)
                    .startDate(currentMonth.atDay(Math.min(27, currentMonth.lengthOfMonth())).toString())
                    .endDate(currentMonth.atDay(Math.min(28, currentMonth.lengthOfMonth())).toString())
                    .reason("Vacaciones pendientes de aprobacion")
                    .leaveType("VACATION")
                    .paid(true)
                    .status(com.joseluu.hospital.dto.LeaveRequestStatus.PENDING)
                    .requestedAt(now.toString())
                    .build());
        }
        leaveRequestRepository.saveAll(requests);
    }

    /**
     * Crea ajustes manuales para testear la generacion de nominas.
     */
    private void seedPayrollAdjustments() {
        LocalDateTime now = LocalDateTime.now();
        String currentPeriod = java.time.YearMonth.now().toString();
        List<PayrollAdjustmentDocument> adjustments = new java.util.ArrayList<>();
        if (workerId != null) {
            adjustments.add(PayrollAdjustmentDocument.builder()
                    .id(UUID.randomUUID().toString())
                    .hospitalId(hospitalId)
                    .workerId(workerId)
                    .period(currentPeriod)
                    .type(PayrollAdjustmentType.BONUS)
                    .description("Bono productividad turnos nocturnos")
                    .amount(150.0)
                    .createdBy(adminId)
                    .createdAt(now.toString())
                    .build());
            adjustments.add(PayrollAdjustmentDocument.builder()
                    .id(UUID.randomUUID().toString())
                    .hospitalId(hospitalId)
                    .workerId(workerId)
                    .period(currentPeriod)
                    .type(PayrollAdjustmentType.BONUS)
                    .description("Plus festivo trabajado")
                    .amount(80.0)
                    .createdBy(adminId)
                    .createdAt(now.toString())
                    .build());
        }
        if (worker2Id != null) {
            adjustments.add(PayrollAdjustmentDocument.builder()
                    .id(UUID.randomUUID().toString())
                    .hospitalId(hospitalId)
                    .workerId(worker2Id)
                    .period(currentPeriod)
                    .type(PayrollAdjustmentType.BONUS)
                    .description("Bono nocturnidad acumulada")
                    .amount(120.0)
                    .createdBy(adminId)
                    .createdAt(now.toString())
                    .build());
        }
        if (worker3Id != null) {
            adjustments.add(PayrollAdjustmentDocument.builder()
                    .id(UUID.randomUUID().toString())
                    .hospitalId(hospitalId)
                    .workerId(worker3Id)
                    .period(currentPeriod)
                    .type(PayrollAdjustmentType.PENALTY)
                    .description("Penalizacion por retraso recurrente")
                    .amount(50.0)
                    .createdBy(adminId)
                    .createdAt(now.toString())
                    .build());
        }
        payrollAdjustmentRepository.saveAll(adjustments);
    }

    /**
     * Genera nominas reales a partir de contratos, ausencias, ajustes y turnos del seed.
     */
    private void seedPayrolls() {
        String currentPeriod = java.time.YearMonth.now().toString();
        if (workerId != null) {
            advancedPayrollService.generate(hospitalId, workerId, currentPeriod, adminId);
        }
        if (worker2Id != null) {
            advancedPayrollService.generate(hospitalId, worker2Id, currentPeriod, adminId);
        }
        if (worker3Id != null) {
            advancedPayrollService.generate(hospitalId, worker3Id, currentPeriod, adminId);
        }
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
        List<String> members = new java.util.ArrayList<>(Arrays.asList(adminId, workerId));
        List<String> memberNames = new java.util.ArrayList<>(Arrays.asList("Maria Garcia", "Juan Perez"));
        if (worker2Id != null) {
            members.add(worker2Id);
            memberNames.add("Ana Lopez");
        }
        if (worker3Id != null) {
            members.add(worker3Id);
            memberNames.add("Pedro Martinez");
        }
        WorkGroupDocument urgentGroup = WorkGroupDocument.builder()
                .id(UUID.randomUUID().toString())
                .name("Equipo de Urgencias")
                .description("Coordinacion diaria del equipo de urgencias")
                .hospitalId(hospitalId)
                .members(members)
                .memberNames(memberNames)
                .createdBy(adminId)
                .chatId(urgentGroupChatId)
                .createdAt(now)
                .updatedAt(now)
                .build();
        workGroupRepository.save(urgentGroup);
    }

    /**
     * Crea los tipos de turno para el hospital.
     */
    private void seedShiftTypes() {
        LocalDateTime now = LocalDateTime.now();
        List<ShiftTypeDocument> types = Arrays.asList(
                ShiftTypeDocument.builder()
                        .id(UUID.randomUUID().toString())
                        .hospitalId(hospitalId)
                        .code("MORNING")
                        .name("Turno de Mañana")
                        .startTime("07:00")
                        .endTime("15:00")
                        .crossesMidnight(false)
                        .build(),
                ShiftTypeDocument.builder()
                        .id(UUID.randomUUID().toString())
                        .hospitalId(hospitalId)
                        .code("AFTERNOON")
                        .name("Turno de Tarde")
                        .startTime("15:00")
                        .endTime("23:00")
                        .crossesMidnight(false)
                        .build(),
                ShiftTypeDocument.builder()
                        .id(UUID.randomUUID().toString())
                        .hospitalId(hospitalId)
                        .code("NIGHT")
                        .name("Turno de Noche")
                        .startTime("23:00")
                        .endTime("07:00")
                        .crossesMidnight(true)
                        .build(),
                ShiftTypeDocument.builder()
                        .id(UUID.randomUUID().toString())
                        .hospitalId(hospitalId)
                        .code("MIXED")
                        .name("Turno Mixto")
                        .startTime("10:00")
                        .endTime("18:00")
                        .crossesMidnight(false)
                        .build()
        );
        shiftTypeRepository.saveAll(types);
    }

    /**
     * Crea contratos de trabajo para los trabajadores.
     */
    private void seedWorkerContracts() {
        LocalDateTime now = LocalDateTime.now();
        String currentPeriod = java.time.YearMonth.now().toString();
        List<WorkerContractDocument> contracts = new java.util.ArrayList<>();
        if (workerId != null) {
            contracts.add(WorkerContractDocument.builder()
                    .id(UUID.randomUUID().toString())
                    .hospitalId(hospitalId)
                    .workerId(workerId)
                    .hourlyRate(13.75)
                    .weeklyHours(35)
                    .nightBonusPct(0.25)
                    .holidayBonusPct(0.15)
                    .overtimeMultiplier(1.5)
                    .effectiveFrom(currentPeriod + "-01T00:00:00")
                    .active(true)
                    .createdAt(now.toString())
                    .updatedAt(now.toString())
                    .build());
        }
        if (worker2Id != null) {
            contracts.add(WorkerContractDocument.builder()
                    .id(UUID.randomUUID().toString())
                    .hospitalId(hospitalId)
                    .workerId(worker2Id)
                    .hourlyRate(12.50)
                    .weeklyHours(35)
                    .nightBonusPct(0.25)
                    .holidayBonusPct(0.15)
                    .overtimeMultiplier(1.5)
                    .effectiveFrom(currentPeriod + "-01T00:00:00")
                    .active(true)
                    .createdAt(now.toString())
                    .updatedAt(now.toString())
                    .build());
        }
        if (worker3Id != null) {
            contracts.add(WorkerContractDocument.builder()
                    .id(UUID.randomUUID().toString())
                    .hospitalId(hospitalId)
                    .workerId(worker3Id)
                    .hourlyRate(11.25)
                    .weeklyHours(35)
                    .nightBonusPct(0.25)
                    .holidayBonusPct(0.15)
                    .overtimeMultiplier(1.5)
                    .effectiveFrom(currentPeriod + "-01T00:00:00")
                    .active(true)
                    .createdAt(now.toString())
                    .updatedAt(now.toString())
                    .build());
        }
        workerContractRepository.saveAll(contracts);
    }

    /**
     * Crea demandas de turno para el sistema de autoasignacion.
     */
    private void seedShiftRequirements() {
        LocalDate baseDate = LocalDate.now().plusDays(1);
        List<ShiftRequirementDocument> requirements = new java.util.ArrayList<>();
        requirements.add(ShiftRequirementDocument.builder()
                .id(UUID.randomUUID().toString())
                .hospitalId(hospitalId)
                .department("Urgencias")
                .date(baseDate.toString())
                .shiftTypeCode("MORNING")
                .requiredWorkers(2)
                .build());
        requirements.add(ShiftRequirementDocument.builder()
                .id(UUID.randomUUID().toString())
                .hospitalId(hospitalId)
                .department("Urgencias")
                .date(baseDate.toString())
                .shiftTypeCode("AFTERNOON")
                .requiredWorkers(1)
                .build());
        requirements.add(ShiftRequirementDocument.builder()
                .id(UUID.randomUUID().toString())
                .hospitalId(hospitalId)
                .department("Urgencias")
                .date(baseDate.plusDays(1).toString())
                .shiftTypeCode("NIGHT")
                .requiredWorkers(1)
                .build());
        requirements.add(ShiftRequirementDocument.builder()
                .id(UUID.randomUUID().toString())
                .hospitalId(hospitalId)
                .department("Urgencias")
                .date(baseDate.plusDays(1).toString())
                .shiftTypeCode("MORNING")
                .requiredWorkers(1)
                .build());
        requirements.add(ShiftRequirementDocument.builder()
                .id(UUID.randomUUID().toString())
                .hospitalId(hospitalId)
                .department("Urgencias")
                .date(baseDate.plusDays(2).toString())
                .shiftTypeCode("AFTERNOON")
                .requiredWorkers(2)
                .build());
        shiftRequirementRepository.saveAll(requirements);
    }

    /**
     * Crea asignaciones de turno manuales para testear nominas.
     */
    private void seedShiftAssignments() {
        YearMonth currentMonth = YearMonth.now();
        List<ShiftAssignmentDocument> assignments = new java.util.ArrayList<>();
        if (workerId != null) {
            addPatternAssignments(assignments, workerId, "Juan Perez", "Urgencias", currentMonth,
                    "8:MORNING", "9:MORNING", "10:AFTERNOON", "11:NIGHT", "12:MORNING",
                    "15:MORNING", "16:NIGHT", "17:MORNING", "18:AFTERNOON", "19:MORNING",
                    "22:NIGHT", "23:MORNING", "24:MORNING", "25:NIGHT", "26:MORNING",
                    "27:AFTERNOON", "28:MORNING", "29:NIGHT");
        }
        if (worker2Id != null) {
            addPatternAssignments(assignments, worker2Id, "Ana Lopez", "Urgencias", currentMonth,
                    "8:AFTERNOON", "9:NIGHT", "10:MORNING", "11:AFTERNOON", "12:MORNING",
                    "15:NIGHT", "16:MORNING", "17:AFTERNOON", "18:MORNING", "19:NIGHT",
                    "22:MORNING", "23:AFTERNOON", "24:MORNING", "25:NIGHT", "26:MORNING",
                    "27:AFTERNOON", "28:MORNING", "29:AFTERNOON");
        }
        if (worker3Id != null) {
            addPatternAssignments(assignments, worker3Id, "Pedro Martinez", "Urgencias", currentMonth,
                    "8:MORNING", "9:AFTERNOON", "10:MORNING", "11:AFTERNOON", "12:MORNING",
                    "15:AFTERNOON", "16:MORNING", "17:AFTERNOON", "18:MORNING", "19:AFTERNOON",
                    "22:MORNING", "23:AFTERNOON", "24:MORNING", "25:AFTERNOON", "26:MORNING",
                    "27:MORNING", "28:AFTERNOON", "29:MORNING");
        }
        shiftAssignmentRepository.saveAll(assignments);
    }

    /**
     * Añade un patrón de turnos al mes actual para un trabajador.
     */
    private void addPatternAssignments(List<ShiftAssignmentDocument> assignments,
                                       String workerRef,
                                       String fullName,
                                       String dept,
                                       YearMonth month,
                                       String... pattern) {
        for (String entry : pattern) {
            String[] parts = entry.split(":");
            int day = Integer.parseInt(parts[0]);
            if (day > month.lengthOfMonth()) {
                continue;
            }

            LocalDate date = month.atDay(day);
            assignments.add(buildAssignment(workerRef, fullName, dept, parts[1], date));
        }
    }

    /**
     * Construye una asignacion de turno.
     */
    private ShiftAssignmentDocument buildAssignment(String workerId, String fullName, String dept,
                                                    String shiftType, LocalDate date) {
        LocalDateTime start = buildShiftStart(date, shiftType);
        LocalDateTime end = buildShiftEnd(date, shiftType);
        return ShiftAssignmentDocument.builder()
                .id(UUID.randomUUID().toString())
                .hospitalId(hospitalId)
                .workerId(workerId)
                .workerFullName(fullName)
                .department(dept)
                .shiftTypeCode(shiftType)
                .startAt(start.toString())
                .endAt(end.toString())
                .status(date.isAfter(LocalDate.now()) ? ShiftAssignmentStatus.ASSIGNED : ShiftAssignmentStatus.WORKED)
                .source(ShiftAssignmentSource.MANUAL)
                .version(1)
                .createdAt(start.toString())
                .updatedAt(start.toString())
                .build();
    }

    /**
     * Calcula el inicio de un turno semilla.
     */
    private LocalDateTime buildShiftStart(LocalDate date, String shiftType) {
        return switch (shiftType) {
            case "AFTERNOON" -> date.atTime(15, 0);
            case "NIGHT" -> date.atTime(23, 0);
            case "MIXED" -> date.atTime(10, 0);
            default -> date.atTime(7, 0);
        };
    }

    /**
     * Calcula el fin de un turno semilla.
     */
    private LocalDateTime buildShiftEnd(LocalDate date, String shiftType) {
        return switch (shiftType) {
            case "AFTERNOON" -> date.atTime(23, 0);
            case "NIGHT" -> date.plusDays(1).atTime(7, 0);
            case "MIXED" -> date.atTime(18, 0);
            default -> date.atTime(15, 0);
        };
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
