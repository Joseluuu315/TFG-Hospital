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
    private final ShiftTypeRepository shiftTypeRepository;
    private final ShiftRequirementRepository shiftRequirementRepository;
    private final ShiftAssignmentRepository shiftAssignmentRepository;
    private final WorkerContractRepository workerContractRepository;
    private final PayrollAdjustmentRepository payrollAdjustmentRepository;
    private final PayrollItemRepository payrollItemRepository;

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
                       PayrollItemRepository payrollItemRepository) {
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
     * Crea usuarios iniciales (root, admin y trabajador).
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
                .imageURL("/averonixlogo.png")
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
                .imageURL("/averonixlogo.png")
                .email("trabajador1@hospital-reina-sofia.com")
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
                .password("worker123")
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
                .password("worker123")
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
        List<LeaveRequestDocument> requests = new java.util.ArrayList<>();
        if (workerId != null) {
            requests.add(LeaveRequestDocument.builder()
                    .id(UUID.randomUUID().toString())
                    .userId(workerId)
                    .hospitalId(hospitalId)
                    .startDate(now.minusDays(5).toLocalDate().toString())
                    .endDate(now.minusDays(3).toLocalDate().toString())
                    .reason("Vacaciones de verano")
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
                    .startDate(now.plusDays(10).toLocalDate().toString())
                    .endDate(now.plusDays(12).toLocalDate().toString())
                    .reason("Asuntos propios")
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
                    .startDate(now.minusDays(3).toLocalDate().toString())
                    .endDate(now.minusDays(2).toLocalDate().toString())
                    .reason("Vacaciones de invierno")
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
                    .startDate(now.plusDays(5).toLocalDate().toString())
                    .endDate(now.plusDays(7).toLocalDate().toString())
                    .reason("Vacaciones familiares")
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
     * Genera nominas detalladas para los 3 trabajadores con explicacion de conceptos.
     * Incluye: vacaciones, horas extra, plus nocturnidad, festivos, deducciones.
     */
    private void seedPayrolls() {
        LocalDateTime now = LocalDateTime.now();
        String currentPeriod = java.time.YearMonth.now().toString();
        List<PayrollDocument> payrolls = new java.util.ArrayList<>();
        List<PayrollItemDocument> allItems = new java.util.ArrayList<>();

        if (workerId != null) {
            String payroll1Id = UUID.randomUUID().toString();
            payrolls.add(PayrollDocument.builder()
                    .id(payroll1Id)
                    .workerId(workerId)
                    .workerFullName("Juan Perez")
                    .hospitalId(hospitalId)
                    .period(currentPeriod)
                    .grossSalary(2450.0)
                    .overtimeAmount(180.0)
                    .bonusAmount(230.0)
                    .otherDeductions(120.0)
                    .incomeTaxWithholding(294.0)
                    .socialSecurityWorker(155.0)
                    .netSalary(1881.0)
                    .status(PayrollStatus.ISSUED)
                    .issuedAt(now.toString())
                    .build());
            allItems.addAll(java.util.Arrays.asList(
                    PayrollItemDocument.builder().id(UUID.randomUUID().toString()).payrollId(payroll1Id).workerId(workerId).hospitalId(hospitalId)
                            .type(com.joseluu.hospital.entity.enums.PayrollItemType.BASE_HOURS).description("Horas base trabajadas (140h)").quantity(140).unitAmount(13.75).totalAmount(1925.0).build(),
                    PayrollItemDocument.builder().id(UUID.randomUUID().toString()).payrollId(payroll1Id).workerId(workerId).hospitalId(hospitalId)
                            .type(com.joseluu.hospital.entity.enums.PayrollItemType.NIGHT_BONUS).description("Plus nocturnidad (20h x 25%)").quantity(20).unitAmount(3.4375).totalAmount(68.75).build(),
                    PayrollItemDocument.builder().id(UUID.randomUUID().toString()).payrollId(payroll1Id).workerId(workerId).hospitalId(hospitalId)
                            .type(com.joseluu.hospital.entity.enums.PayrollItemType.HOLIDAY_BONUS).description("Plus festivo/fin de semana (8h x 15%)").quantity(8).unitAmount(2.0625).totalAmount(16.5).build(),
                    PayrollItemDocument.builder().id(UUID.randomUUID().toString()).payrollId(payroll1Id).workerId(workerId).hospitalId(hospitalId)
                            .type(com.joseluu.hospital.entity.enums.PayrollItemType.OVERTIME).description("Horas extra (10h x 1.5)").quantity(10).unitAmount(20.625).totalAmount(206.25).build(),
                    PayrollItemDocument.builder().id(UUID.randomUUID().toString()).payrollId(payroll1Id).workerId(workerId).hospitalId(hospitalId)
                            .type(com.joseluu.hospital.entity.enums.PayrollItemType.MANUAL_BONUS).description("Bono productividad turnos nocturnos").quantity(1).unitAmount(150.0).totalAmount(150.0).build(),
                    PayrollItemDocument.builder().id(UUID.randomUUID().toString()).payrollId(payroll1Id).workerId(workerId).hospitalId(hospitalId)
                            .type(com.joseluu.hospital.entity.enums.PayrollItemType.MANUAL_BONUS).description("Plus festivo trabajado").quantity(1).unitAmount(80.0).totalAmount(80.0).build(),
                    PayrollItemDocument.builder().id(UUID.randomUUID().toString()).payrollId(payroll1Id).workerId(workerId).hospitalId(hospitalId)
                            .type(com.joseluu.hospital.entity.enums.PayrollItemType.UNPAID_ABSENCE).description("Dias no remunerados (asuntos propios 3 dias)").quantity(3).unitAmount(110.0).totalAmount(-330.0).build()
            ));
        }

        if (worker2Id != null) {
            String payroll2Id = UUID.randomUUID().toString();
            payrolls.add(PayrollDocument.builder()
                    .id(payroll2Id)
                    .workerId(worker2Id)
                    .workerFullName("Ana Lopez")
                    .hospitalId(hospitalId)
                    .period(currentPeriod)
                    .grossSalary(2280.0)
                    .overtimeAmount(100.0)
                    .bonusAmount(120.0)
                    .otherDeductions(80.0)
                    .incomeTaxWithholding(273.6)
                    .socialSecurityWorker(144.0)
                    .netSalary(1882.4)
                    .status(PayrollStatus.DRAFT)
                    .issuedAt(now.toString())
                    .build());
            allItems.addAll(java.util.Arrays.asList(
                    PayrollItemDocument.builder().id(UUID.randomUUID().toString()).payrollId(payroll2Id).workerId(worker2Id).hospitalId(hospitalId)
                            .type(com.joseluu.hospital.entity.enums.PayrollItemType.BASE_HOURS).description("Horas base trabajadas (140h)").quantity(140).unitAmount(12.50).totalAmount(1750.0).build(),
                    PayrollItemDocument.builder().id(UUID.randomUUID().toString()).payrollId(payroll2Id).workerId(worker2Id).hospitalId(hospitalId)
                            .type(com.joseluu.hospital.entity.enums.PayrollItemType.NIGHT_BONUS).description("Plus nocturnidad (16h x 25%)").quantity(16).unitAmount(3.125).totalAmount(50.0).build(),
                    PayrollItemDocument.builder().id(UUID.randomUUID().toString()).payrollId(payroll2Id).workerId(worker2Id).hospitalId(hospitalId)
                            .type(com.joseluu.hospital.entity.enums.PayrollItemType.HOLIDAY_BONUS).description("Plus festivo/fin de semana (12h x 15%)").quantity(12).unitAmount(1.875).totalAmount(22.5).build(),
                    PayrollItemDocument.builder().id(UUID.randomUUID().toString()).payrollId(payroll2Id).workerId(worker2Id).hospitalId(hospitalId)
                            .type(com.joseluu.hospital.entity.enums.PayrollItemType.OVERTIME).description("Horas extra (8h x 1.5)").quantity(8).unitAmount(18.75).totalAmount(150.0).build(),
                    PayrollItemDocument.builder().id(UUID.randomUUID().toString()).payrollId(payroll2Id).workerId(worker2Id).hospitalId(hospitalId)
                            .type(com.joseluu.hospital.entity.enums.PayrollItemType.MANUAL_BONUS).description("Bono nocturnidad acumulada").quantity(1).unitAmount(120.0).totalAmount(120.0).build(),
                    PayrollItemDocument.builder().id(UUID.randomUUID().toString()).payrollId(payroll2Id).workerId(worker2Id).hospitalId(hospitalId)
                            .type(com.joseluu.hospital.entity.enums.PayrollItemType.UNPAID_ABSENCE).description("Vacaciones pagadas (2 dias, sin deduccion)").quantity(2).unitAmount(0.0).totalAmount(0.0).build()
            ));
        }

        if (worker3Id != null) {
            String payroll3Id = UUID.randomUUID().toString();
            payrolls.add(PayrollDocument.builder()
                    .id(payroll3Id)
                    .workerId(worker3Id)
                    .workerFullName("Pedro Martinez")
                    .hospitalId(hospitalId)
                    .period(currentPeriod)
                    .grossSalary(1950.0)
                    .overtimeAmount(50.0)
                    .bonusAmount(0.0)
                    .otherDeductions(50.0)
                    .incomeTaxWithholding(234.0)
                    .socialSecurityWorker(123.0)
                    .netSalary(1543.0)
                    .status(PayrollStatus.DRAFT)
                    .issuedAt(now.toString())
                    .build());
            allItems.addAll(java.util.Arrays.asList(
                    PayrollItemDocument.builder().id(UUID.randomUUID().toString()).payrollId(payroll3Id).workerId(worker3Id).hospitalId(hospitalId)
                            .type(com.joseluu.hospital.entity.enums.PayrollItemType.BASE_HOURS).description("Horas base trabajadas (140h)").quantity(140).unitAmount(11.25).totalAmount(1575.0).build(),
                    PayrollItemDocument.builder().id(UUID.randomUUID().toString()).payrollId(payroll3Id).workerId(worker3Id).hospitalId(hospitalId)
                            .type(com.joseluu.hospital.entity.enums.PayrollItemType.HOLIDAY_BONUS).description("Plus festivo/fin de semana (10h x 15%)").quantity(10).unitAmount(1.6875).totalAmount(16.875).build(),
                    PayrollItemDocument.builder().id(UUID.randomUUID().toString()).payrollId(payroll3Id).workerId(worker3Id).hospitalId(hospitalId)
                            .type(com.joseluu.hospital.entity.enums.PayrollItemType.OVERTIME).description("Horas extra (4h x 1.5)").quantity(4).unitAmount(16.875).totalAmount(67.5).build(),
                    PayrollItemDocument.builder().id(UUID.randomUUID().toString()).payrollId(payroll3Id).workerId(worker3Id).hospitalId(hospitalId)
                            .type(com.joseluu.hospital.entity.enums.PayrollItemType.MANUAL_PENALTY).description("Penalizacion por retraso recurrente").quantity(1).unitAmount(50.0).totalAmount(-50.0).build()
            ));
        }

        payrollRepository.saveAll(payrolls);
        payrollItemRepository.saveAll(allItems);
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
        LocalDateTime now = LocalDateTime.now();
        List<ShiftRequirementDocument> requirements = new java.util.ArrayList<>();
        String baseDate = now.toLocalDate().toString();
        requirements.add(ShiftRequirementDocument.builder()
                .id(UUID.randomUUID().toString())
                .hospitalId(hospitalId)
                .department("Urgencias")
                .date(baseDate)
                .shiftTypeCode("MORNING")
                .requiredWorkers(2)
                .build());
        requirements.add(ShiftRequirementDocument.builder()
                .id(UUID.randomUUID().toString())
                .hospitalId(hospitalId)
                .department("Urgencias")
                .date(baseDate)
                .shiftTypeCode("AFTERNOON")
                .requiredWorkers(1)
                .build());
        requirements.add(ShiftRequirementDocument.builder()
                .id(UUID.randomUUID().toString())
                .hospitalId(hospitalId)
                .department("Urgencias")
                .date(baseDate)
                .shiftTypeCode("NIGHT")
                .requiredWorkers(1)
                .build());
        requirements.add(ShiftRequirementDocument.builder()
                .id(UUID.randomUUID().toString())
                .hospitalId(hospitalId)
                .department("Urgencias")
                .date(now.plusDays(1).toLocalDate().toString())
                .shiftTypeCode("MORNING")
                .requiredWorkers(1)
                .build());
        requirements.add(ShiftRequirementDocument.builder()
                .id(UUID.randomUUID().toString())
                .hospitalId(hospitalId)
                .department("Urgencias")
                .date(now.plusDays(1).toLocalDate().toString())
                .shiftTypeCode("NIGHT")
                .requiredWorkers(1)
                .build());
        requirements.add(ShiftRequirementDocument.builder()
                .id(UUID.randomUUID().toString())
                .hospitalId(hospitalId)
                .department("Urgencias")
                .date(now.plusDays(2).toLocalDate().toString())
                .shiftTypeCode("AFTERNOON")
                .requiredWorkers(2)
                .build());
        shiftRequirementRepository.saveAll(requirements);
    }

    /**
     * Crea asignaciones de turno manuales para testear nominas.
     */
    private void seedShiftAssignments() {
        LocalDateTime now = LocalDateTime.now();
        List<ShiftAssignmentDocument> assignments = new java.util.ArrayList<>();
        if (workerId != null) {
            assignments.add(buildAssignment(workerId, "Juan Perez", "Urgencias", "MORNING",
                    now.withHour(7).withMinute(0), now.withHour(15).withMinute(0), false));
            assignments.add(buildAssignment(workerId, "Juan Perez", "Urgencias", "NIGHT",
                    now.minusDays(1).withHour(23).withMinute(0), now.withHour(7).withMinute(0), true));
            assignments.add(buildAssignment(workerId, "Juan Perez", "Urgencias", "MORNING",
                    now.plusDays(1).withHour(7).withMinute(0), now.plusDays(1).withHour(15).withMinute(0), false));
        }
        if (worker2Id != null) {
            assignments.add(buildAssignment(worker2Id, "Ana Lopez", "Urgencias", "AFTERNOON",
                    now.withHour(15).withMinute(0), now.withHour(23).withMinute(0), false));
            assignments.add(buildAssignment(worker2Id, "Ana Lopez", "Urgencias", "MORNING",
                    now.minusDays(2).withHour(7).withMinute(0), now.minusDays(2).withHour(15).withMinute(0), false));
            assignments.add(buildAssignment(worker2Id, "Ana Lopez", "Urgencias", "NIGHT",
                    now.plusDays(1).withHour(23).withMinute(0), now.plusDays(2).withHour(7).withMinute(0), true));
        }
        if (worker3Id != null) {
            assignments.add(buildAssignment(worker3Id, "Pedro Martinez", "Urgencias", "MORNING",
                    now.withHour(7).withMinute(0), now.withHour(15).withMinute(0), false));
            assignments.add(buildAssignment(worker3Id, "Pedro Martinez", "Urgencias", "AFTERNOON",
                    now.plusDays(2).withHour(15).withMinute(0), now.plusDays(2).withHour(23).withMinute(0), false));
        }
        shiftAssignmentRepository.saveAll(assignments);
    }

    /**
     * Construye una asignacion de turno.
     */
    private ShiftAssignmentDocument buildAssignment(String workerId, String fullName, String dept,
                                                    String shiftType, LocalDateTime start, LocalDateTime end, boolean crossesMidnight) {
        return ShiftAssignmentDocument.builder()
                .id(UUID.randomUUID().toString())
                .hospitalId(hospitalId)
                .workerId(workerId)
                .workerFullName(fullName)
                .department(dept)
                .shiftTypeCode(shiftType)
                .startAt(start.toString())
                .endAt(end.toString())
                .status(ShiftAssignmentStatus.WORKED)
                .source(ShiftAssignmentSource.MANUAL)
                .version(1)
                .createdAt(start.toString())
                .updatedAt(start.toString())
                .build();
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
