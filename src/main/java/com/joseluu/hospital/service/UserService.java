package com.joseluu.hospital.service;

import com.joseluu.hospital.dto.CalendarEventDto;
import com.joseluu.hospital.dto.CreateUserRequestDto;
import com.joseluu.hospital.dto.LeaveRequestDto;
import com.joseluu.hospital.dto.UpdateUserRequestDto;
import com.joseluu.hospital.dto.UserDto;
import com.joseluu.hospital.dto.UserPresenceDto;
import com.joseluu.hospital.entity.CalendarEventDocument;
import com.joseluu.hospital.entity.ChatDocument;
import com.joseluu.hospital.entity.HospitalDocument;
import com.joseluu.hospital.entity.LeaveRequestDocument;
import com.joseluu.hospital.entity.PayrollDocument;
import com.joseluu.hospital.entity.UserDocument;
import com.joseluu.hospital.entity.WorkGroupDocument;
import com.joseluu.hospital.entity.enums.ChatType;
import com.joseluu.hospital.entity.enums.UserRole;
import com.joseluu.hospital.exception.BadRequestException;
import com.joseluu.hospital.exception.ConflictException;
import com.joseluu.hospital.exception.ForbiddenException;
import com.joseluu.hospital.exception.NotFoundException;
import com.joseluu.hospital.repository.AuthSessionRepository;
import com.joseluu.hospital.repository.ChatMessageRepository;
import com.joseluu.hospital.repository.ChatRepository;
import com.joseluu.hospital.repository.HospitalRepository;
import com.joseluu.hospital.repository.LeaveRequestRepository;
import com.joseluu.hospital.repository.NotificationRepository;
import com.joseluu.hospital.repository.PayrollAdjustmentRepository;
import com.joseluu.hospital.repository.PayrollItemRepository;
import com.joseluu.hospital.repository.PayrollRepository;
import com.joseluu.hospital.repository.ShiftAssignmentRepository;
import com.joseluu.hospital.repository.UserRepository;
import com.joseluu.hospital.repository.WorkGroupRepository;
import com.joseluu.hospital.repository.WorkerContractRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Servicio para gestionar usuarios y sus datos asociados.
 */
@Service
public class UserService {
    private static final Logger LOGGER = LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final HospitalRepository hospitalRepository;
    private final PasswordService passwordService;
    private final ResendEmailService resendEmailService;
    private final AuthSessionRepository authSessionRepository;
    private final ChatRepository chatRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final WorkGroupRepository workGroupRepository;
    private final WorkerContractRepository workerContractRepository;
    private final PayrollRepository payrollRepository;
    private final PayrollItemRepository payrollItemRepository;
    private final PayrollAdjustmentRepository payrollAdjustmentRepository;
    private final ShiftAssignmentRepository shiftAssignmentRepository;
    private final NotificationRepository notificationRepository;

    public UserService(UserRepository userRepository,
                       LeaveRequestRepository leaveRequestRepository,
                       HospitalRepository hospitalRepository,
                       PasswordService passwordService,
                       ResendEmailService resendEmailService,
                       AuthSessionRepository authSessionRepository,
                       ChatRepository chatRepository,
                       ChatMessageRepository chatMessageRepository,
                       WorkGroupRepository workGroupRepository,
                       WorkerContractRepository workerContractRepository,
                       PayrollRepository payrollRepository,
                       PayrollItemRepository payrollItemRepository,
                       PayrollAdjustmentRepository payrollAdjustmentRepository,
                       ShiftAssignmentRepository shiftAssignmentRepository,
                       NotificationRepository notificationRepository) {
        this.userRepository = userRepository;
        this.leaveRequestRepository = leaveRequestRepository;
        this.hospitalRepository = hospitalRepository;
        this.passwordService = passwordService;
        this.resendEmailService = resendEmailService;
        this.authSessionRepository = authSessionRepository;
        this.chatRepository = chatRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.workGroupRepository = workGroupRepository;
        this.workerContractRepository = workerContractRepository;
        this.payrollRepository = payrollRepository;
        this.payrollItemRepository = payrollItemRepository;
        this.payrollAdjustmentRepository = payrollAdjustmentRepository;
        this.shiftAssignmentRepository = shiftAssignmentRepository;
        this.notificationRepository = notificationRepository;
    }

    /**
     * Lista todos los usuarios del sistema.
     */
    public List<UserDto> getAll() {
        List<UserDto> users = new ArrayList<>();
        for (UserDocument document : userRepository.findAll()) {
            users.add(toDto(document));
        }
        return users;
    }

    /**
     * Busca un usuario por id.
     */
    public Optional<UserDto> findById(String id) {
        return userRepository.findById(id).map(this::toDto);
    }

    /**
     * Obtiene un usuario por id o lanza error.
     */
    public UserDto getById(String id) {
        return toDto(requireUser(id));
    }

    /**
     * Anade un evento al calendario de un trabajador.
     */
    public CalendarEventDto addCalendarEvent(String userId, CalendarEventDto dto) {
        UserDocument user = requireUser(userId);

        CalendarEventDocument event = CalendarEventDocument.builder()
                .id(UUID.randomUUID().toString())
                .userId(userId)
                .date(dto.getDate())
                .type(dto.getType())
                .startTime(dto.getStartTime())
                .endTime(dto.getEndTime())
                .notes(dto.getNotes())
                .build();

        getOrCreateCalendarEvents(user).add(event);
        saveUser(user);
        return toCalendarEvent(event);
    }

    /**
     * Elimina un evento del calendario de un trabajador.
     */
    public void removeCalendarEvent(String userId, String eventId) {
        UserDocument user = requireUser(userId);
        List<CalendarEventDocument> events = user.getCalendarEvents();
        if (events == null) {
            return;
        }

        boolean removed = events.removeIf(event -> eventId.equals(event.getId()));
        if (removed) {
            saveUser(user);
        }
    }

    /**
     * Actualiza un evento del calendario de un trabajador.
     */
    public CalendarEventDto updateCalendarEvent(String userId, String eventId, CalendarEventDto dto) {
        UserDocument user = requireUser(userId);
        CalendarEventDocument event = requireCalendarEvent(user, eventId);

        event.setDate(dto.getDate());
        event.setType(dto.getType());
        event.setStartTime(dto.getStartTime());
        event.setEndTime(dto.getEndTime());
        event.setNotes(dto.getNotes());

        saveUser(user);
        return toCalendarEvent(event);
    }

    /**
     * Devuelve los eventos del calendario de un usuario, con filtro mensual opcional.
     */
    public List<CalendarEventDto> getCalendarEvents(String userId, String month) {
        UserDocument user = requireUser(userId);
        List<CalendarEventDto> result = new ArrayList<>();

        for (CalendarEventDocument event : getCalendarEventsOrEmpty(user)) {
            if (month == null || matchesMonth(event, month)) {
                result.add(toCalendarEvent(event));
            }
        }

        return result;
    }

    /**
     * Crea un trabajador asociado a un hospital.
     */
    public UserDto createWorker(CreateUserRequestDto request, UserDto actor) {
        validateCreatePermission(request, actor);
        ensureUniqueEmail(request.getEmail(), null);
        ensureUniqueDni(request.getDni(), null);

        LocalDateTime now = LocalDateTime.now();
        HospitalDocument hospital = requireHospital(request.getHospitalId());
        UserRole role = request.getRole() != null ? request.getRole() : UserRole.WORKER;
        String temporaryPassword = !isBlank(request.getPassword())
                ? request.getPassword()
                : passwordService.generateTemporaryPassword();

        UserDocument document = UserDocument.builder()
                .id(UUID.randomUUID().toString())
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .imageURL(request.getImageURL())
                .email(request.getEmail())
                .phone(request.getPhone())
                .dni(request.getDni())
                .role(role)
                .enabled(true)
                .accountNonLocked(true)
                .hospitalId(hospital.getId())
                .hospitalName(hospital.getName())
                .department(resolveDepartment(role, request.getDepartment()))
                .jobTitle(resolveJobTitle(role, request.getJobTitle()))
                .baseSalary(request.getBaseSalary())
                .hireDate(now.toLocalDate().toString())
                .calendarEvents(new ArrayList<>())
                .leaveRequestIds(new ArrayList<>())
                .lastSeenAt(null)
                .createdAt(now.toString())
                .updatedAt(now.toString())
                .password(passwordService.encode(temporaryPassword))
                .build();

        UserDocument savedUser = userRepository.save(document);
        sendWelcomeEmailIfPossible(savedUser, hospital.getName(), temporaryPassword);

        return toDto(savedUser);
    }

    /**
     * Devuelve el estado de presencia de un subconjunto de usuarios.
     */
    public List<UserPresenceDto> getPresence(List<String> userIds) {
        List<String> filteredIds = userIds == null ? List.of() : userIds.stream()
                .filter(id -> id != null && !id.isBlank())
                .distinct()
                .toList();

        if (filteredIds.isEmpty()) {
            return List.of();
        }

        LocalDateTime threshold = LocalDateTime.now().minusSeconds(45);
        return filteredIds.stream()
                .map(userRepository::findById)
                .flatMap(Optional::stream)
                .map(user -> UserPresenceDto.builder()
                        .userId(user.getId())
                        .online(isUserOnline(user, threshold))
                        .lastSeenAt(user.getLastSeenAt())
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * Actualiza el latido del usuario autenticado.
     */
    public void heartbeat(String userId) {
        UserDocument user = requireUser(userId);
        user.setLastSeenAt(LocalDateTime.now().toString());
        userRepository.save(user);
    }

    /**
     * Actualiza los datos editables de un usuario.
     */
    public UserDto updateUser(String userId, UpdateUserRequestDto request, UserDto actor) {
        UserDocument user = requireUser(userId);
        validateUpdatePermission(user, request, actor);
        ensureUniqueEmail(request.getEmail(), userId);
        ensureUniqueDni(request.getDni(), userId);

        applyBasicChanges(user, request);
        applyWorkChanges(user, request);
        applyAccessChanges(user, request);

        saveUser(user);
        return toDto(user);
    }

    /**
     * Actualiza solo campos de perfil propios, sin permitir cambios de rol ni estado.
     */
    public UserDto updateMyProfile(String userId, UpdateUserRequestDto request) {
        UserDocument user = requireUser(userId);
        ensureUniqueEmail(request.getEmail(), userId);
        ensureUniqueDni(request.getDni(), userId);

        applyBasicChanges(user, request);
        if (!isBlank(request.getPassword())) {
            user.setPassword(passwordService.encode(request.getPassword()));
        }

        saveUser(user);
        return toDto(user);
    }

    /**
     * Elimina un usuario y limpia los datos operativos que dependen de el.
     */
    public void deleteUser(String userId, UserDto actor) {
        UserDocument target = requireUser(userId);
        validateDeletePermission(target, actor);

        removeUserFromWorkGroups(userId);
        removeUserFromChats(userId);
        deletePayrollData(userId);

        authSessionRepository.deleteByUserId(userId);
        leaveRequestRepository.deleteAll(leaveRequestRepository.findByUserId(userId));
        workerContractRepository.deleteByWorkerId(userId);
        payrollAdjustmentRepository.deleteByWorkerId(userId);
        shiftAssignmentRepository.deleteAll(shiftAssignmentRepository.findByWorkerId(userId));
        notificationRepository.deleteByUserId(userId);
        userRepository.deleteById(userId);
    }

    /**
     * Convierte la entidad de usuario a DTO completo.
     */
    private UserDto toDto(UserDocument document) {
        List<LeaveRequestDto> leaveRequests = new ArrayList<>();
        for (LeaveRequestDocument request : leaveRequestRepository.findByUserId(document.getId())) {
            leaveRequests.add(toLeaveRequestDto(request));
        }

        List<CalendarEventDto> calendarEvents = new ArrayList<>();
        for (CalendarEventDocument event : getCalendarEventsOrEmpty(document)) {
            calendarEvents.add(toCalendarEvent(event));
        }

        UserDto dto = UserDto.builder()
                .id(document.getId())
                .firstName(document.getFirstName())
                .lastName(document.getLastName())
                .imageURL(document.getImageURL())
                .email(document.getEmail())
                .phone(document.getPhone())
                .dni(document.getDni())
                .dateOfBirth(document.getDateOfBirth())
                .role(document.getRole())
                .enabled(document.isEnabled())
                .accountNonLocked(document.isAccountNonLocked())
                .hospitalId(document.getHospitalId())
                .hospitalName(document.getHospitalName())
                .department(document.getDepartment())
                .jobTitle(document.getJobTitle())
                .hireDate(document.getHireDate())
                .baseSalary(document.getBaseSalary())
                .calendarEvents(calendarEvents)
                .leaveRequests(leaveRequests)
                .lastSeenAt(document.getLastSeenAt())
                .createdAt(document.getCreatedAt())
                .updatedAt(document.getUpdatedAt())
                .build();

        dto.syncNames();
        return dto;
    }

    /**
     * Convierte una solicitud de ausencia a DTO.
     */
    private LeaveRequestDto toLeaveRequestDto(LeaveRequestDocument document) {
        return LeaveRequestDto.builder()
                .id(document.getId())
                .userId(document.getUserId())
                .hospitalId(document.getHospitalId())
                .startDate(document.getStartDate())
                .endDate(document.getEndDate())
                .reason(document.getReason())
                .leaveType(document.getLeaveType())
                .paid(document.isPaid())
                .status(document.getStatus())
                .requestedAt(document.getRequestedAt())
                .reviewedAt(document.getReviewedAt())
                .reviewComment(document.getReviewComment())
                .build();
    }

    /**
     * Convierte un evento de calendario a DTO.
     */
    private CalendarEventDto toCalendarEvent(CalendarEventDocument document) {
        return CalendarEventDto.builder()
                .id(document.getId())
                .date(document.getDate())
                .type(document.getType())
                .startTime(document.getStartTime())
                .endTime(document.getEndTime())
                .notes(document.getNotes())
                .build();
    }

    /**
     * Busca un usuario o lanza error.
     */
    private UserDocument requireUser(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado"));
    }

    /**
     * Valida que el alta respete el alcance del actor.
     */
    private void validateCreatePermission(CreateUserRequestDto request, UserDto actor) {
        if (actor == null || actor.getRole() == null) {
            throw new ForbiddenException("No tienes permisos para crear usuarios");
        }

        UserRole requestedRole = request.getRole() != null ? request.getRole() : UserRole.WORKER;
        if (requestedRole == UserRole.ROOT) {
            throw new BadRequestException("No se pueden crear usuarios ROOT desde esta pantalla");
        }

        if (actor.getRole() == UserRole.ROOT) {
            return;
        }

        boolean sameHospital = actor.getHospitalId() != null && actor.getHospitalId().equals(request.getHospitalId());
        if (actor.getRole() == UserRole.HOSPITAL_ADMIN && sameHospital && requestedRole == UserRole.WORKER) {
            return;
        }

        throw new ForbiddenException("Solo puedes crear trabajadores en tu hospital");
    }

    /**
     * Valida que la edicion respete el alcance del actor.
     */
    private void validateUpdatePermission(UserDocument target, UpdateUserRequestDto request, UserDto actor) {
        if (actor == null || actor.getRole() == null) {
            throw new ForbiddenException("No tienes permisos para editar usuarios");
        }
        if (actor.getRole() == UserRole.ROOT) {
            return;
        }

        boolean sameHospital = actor.getHospitalId() != null && actor.getHospitalId().equals(target.getHospitalId());
        boolean targetIsWorker = target.getRole() == UserRole.WORKER;
        boolean keepsWorkerRole = request.getRole() == null || request.getRole() == UserRole.WORKER;
        if (actor.getRole() == UserRole.HOSPITAL_ADMIN && sameHospital && targetIsWorker && keepsWorkerRole) {
            return;
        }

        throw new ForbiddenException("Solo puedes editar trabajadores de tu hospital");
    }

    /**
     * Evita duplicados de email, que romperian el login de forma poco visible.
     */
    private void ensureUniqueEmail(String email, String currentUserId) {
        if (isBlank(email)) {
            return;
        }
        userRepository.findByEmailIgnoreCase(email.trim()).ifPresent(existing -> {
            if (currentUserId == null || !existing.getId().equals(currentUserId)) {
                throw new ConflictException("Ya existe un usuario con ese email");
            }
        });
    }

    /**
     * Evita duplicados de DNI cuando se informa el campo.
     */
    private void ensureUniqueDni(String dni, String currentUserId) {
        if (isBlank(dni)) {
            return;
        }
        userRepository.findByDniIgnoreCase(dni.trim()).ifPresent(existing -> {
            if (currentUserId == null || !existing.getId().equals(currentUserId)) {
                throw new ConflictException("Ya existe un usuario con ese DNI");
            }
        });
    }

    /**
     * El alta no debe fallar si el proveedor de correo no esta disponible durante la demo.
     */
    private void sendWelcomeEmailIfPossible(UserDocument savedUser, String hospitalName, String temporaryPassword) {
        if (!resendEmailService.isConfigured()) {
            LOGGER.warn("Resend no esta configurado; usuario {} creado sin correo de bienvenida", savedUser.getEmail());
            return;
        }

        try {
            resendEmailService.sendWelcomeCredentialsEmail(
                    savedUser.getEmail(),
                    buildDisplayName(savedUser),
                    hospitalName,
                    temporaryPassword
            );
        } catch (ResponseStatusException exception) {
            LOGGER.warn("No se pudo enviar el correo de bienvenida a {}: {}", savedUser.getEmail(), exception.getReason());
        }
    }

    /**
     * Valida que el actor pueda borrar el usuario solicitado.
     */
    private void validateDeletePermission(UserDocument target, UserDto actor) {
        if (target.getRole() == UserRole.ROOT) {
            throw new BadRequestException("No se puede eliminar un usuario ROOT");
        }
        if (actor == null || actor.getRole() == null) {
            throw new ForbiddenException("No tienes permisos para eliminar usuarios");
        }
        if (actor.getRole() == UserRole.ROOT) {
            return;
        }
        if (actor.getRole() == UserRole.HOSPITAL_ADMIN
                && target.getRole() == UserRole.WORKER
                && actor.getHospitalId() != null
                && actor.getHospitalId().equals(target.getHospitalId())) {
            return;
        }

        throw new ForbiddenException("Solo puedes eliminar trabajadores de tu hospital");
    }

    /**
     * Elimina nominas y lineas de nomina asociadas al trabajador.
     */
    private void deletePayrollData(String userId) {
        for (PayrollDocument payroll : payrollRepository.findByWorkerId(userId)) {
            payrollItemRepository.deleteByPayrollId(payroll.getId());
            payrollRepository.delete(payroll);
        }
        payrollItemRepository.deleteByWorkerId(userId);
    }

    /**
     * Quita el usuario de los grupos y borra grupos vacios si los hubiera.
     */
    private void removeUserFromWorkGroups(String userId) {
        for (WorkGroupDocument group : workGroupRepository.findAll()) {
            List<String> currentMembers = group.getMembers();
            if (currentMembers == null || !currentMembers.contains(userId)) {
                continue;
            }

            List<String> members = currentMembers.stream()
                    .filter(memberId -> !userId.equals(memberId))
                    .toList();

            if (members.isEmpty()) {
                if (group.getChatId() != null) {
                    chatMessageRepository.deleteByChatId(group.getChatId());
                    chatRepository.deleteById(group.getChatId());
                }
                workGroupRepository.delete(group);
                continue;
            }

            group.setMembers(members);
            group.setMemberNames(buildParticipantNames(members));
            if (userId.equals(group.getCreatedBy())) {
                group.setCreatedBy(members.get(0));
            }
            group.setUpdatedAt(LocalDateTime.now().toString());
            workGroupRepository.save(group);
        }
    }

    /**
     * Quita el usuario de chats compartidos y elimina privados que queden huerfanos.
     */
    private void removeUserFromChats(String userId) {
        for (ChatDocument chat : chatRepository.findByParticipantsContaining(userId)) {
            List<String> participants = chat.getParticipants() == null
                    ? new ArrayList<>()
                    : chat.getParticipants().stream()
                    .filter(participant -> !userId.equals(participant))
                    .toList();

            if (participants.isEmpty() || chat.getType() == ChatType.PRIVATE) {
                chatMessageRepository.deleteByChatId(chat.getId());
                chatRepository.delete(chat);
                continue;
            }

            chat.setParticipants(participants);
            chat.setParticipantNames(buildParticipantNames(participants));
            chat.setUnreadCounts(removeUnreadCounter(chat.getUnreadCounts(), userId));
            if (userId.equals(chat.getCreatedBy())) {
                chat.setCreatedBy(participants.get(0));
            }
            chat.setUpdatedAt(LocalDateTime.now().toString());
            chatRepository.save(chat);
        }
    }

    /**
     * Reconstruye nombres visibles para una lista de ids.
     */
    private List<String> buildParticipantNames(List<String> userIds) {
        List<UserDocument> users = userRepository.findAllById(userIds);
        List<String> names = new ArrayList<>();
        for (String memberId : userIds) {
            names.add(users.stream()
                    .filter(user -> memberId.equals(user.getId()))
                    .findFirst()
                    .map(this::buildDisplayName)
                    .orElse("Usuario"));
        }
        return names;
    }

    /**
     * Elimina el contador de no leidos del usuario borrado.
     */
    private Map<String, Integer> removeUnreadCounter(Map<String, Integer> currentCounts, String userId) {
        Map<String, Integer> counts = currentCounts == null ? new HashMap<>() : new HashMap<>(currentCounts);
        counts.remove(userId);
        return counts;
    }

    /**
     * Busca un hospital o lanza error.
     */
    private HospitalDocument requireHospital(String hospitalId) {
        return hospitalRepository.findById(hospitalId)
                .orElseThrow(() -> new NotFoundException("Hospital no encontrado"));
    }

    /**
     * Devuelve los eventos del usuario o una lista vacia.
     */
    private List<CalendarEventDocument> getCalendarEventsOrEmpty(UserDocument user) {
        if (user.getCalendarEvents() == null) {
            return new ArrayList<>();
        }
        return user.getCalendarEvents();
    }

    /**
     * Devuelve la lista de eventos y la crea si no existe.
     */
    private List<CalendarEventDocument> getOrCreateCalendarEvents(UserDocument user) {
        if (user.getCalendarEvents() == null) {
            user.setCalendarEvents(new ArrayList<>());
        }
        return user.getCalendarEvents();
    }

    /**
     * Busca un evento concreto dentro del usuario.
     */
    private CalendarEventDocument requireCalendarEvent(UserDocument user, String eventId) {
        for (CalendarEventDocument event : getCalendarEventsOrEmpty(user)) {
            if (eventId.equals(event.getId())) {
                return event;
            }
        }
        throw new NotFoundException("Evento de calendario no encontrado");
    }

    /**
     * Indica si el evento pertenece al mes solicitado.
     */
    private boolean matchesMonth(CalendarEventDocument event, String month) {
        String date = event.getDate();
        return date != null && date.startsWith(month);
    }

    /**
     * Aplica un departamento por defecto a administradores de hospital.
     */
    private String resolveDepartment(UserRole role, String department) {
        if (role == UserRole.HOSPITAL_ADMIN && isBlank(department)) {
            return "Administracion";
        }
        return department;
    }

    /**
     * Aplica un cargo por defecto a administradores de hospital.
     */
    private String resolveJobTitle(UserRole role, String jobTitle) {
        if (role == UserRole.HOSPITAL_ADMIN && isBlank(jobTitle)) {
            return "Administrador del hospital";
        }
        return jobTitle;
    }

    /**
     * Actualiza los datos personales basicos.
     */
    private void applyBasicChanges(UserDocument user, UpdateUserRequestDto request) {
        if (request.getFirstName() != null) {
            user.setFirstName(request.getFirstName());
        }
        if (request.getLastName() != null) {
            user.setLastName(request.getLastName());
        }
        if (request.getEmail() != null) {
            user.setEmail(request.getEmail());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }
        if (request.getDni() != null) {
            user.setDni(request.getDni());
        }
        if (request.getImageURL() != null) {
            user.setImageURL(request.getImageURL());
        }
    }

    /**
     * Actualiza los datos laborales del usuario.
     */
    private void applyWorkChanges(UserDocument user, UpdateUserRequestDto request) {
        if (request.getRole() != null) {
            user.setRole(request.getRole());
        }
        if (request.getDepartment() != null) {
            user.setDepartment(request.getDepartment());
        }
        if (request.getJobTitle() != null) {
            user.setJobTitle(request.getJobTitle());
        }
        if (request.getBaseSalary() != null) {
            user.setBaseSalary(request.getBaseSalary());
        }
    }

    /**
     * Actualiza datos de acceso y estado de la cuenta.
     */
    private void applyAccessChanges(UserDocument user, UpdateUserRequestDto request) {
        if (request.getEnabled() != null) {
            user.setEnabled(request.getEnabled());
        }
        if (request.getAccountNonLocked() != null) {
            user.setAccountNonLocked(request.getAccountNonLocked());
        }
        if (!isBlank(request.getPassword())) {
            user.setPassword(passwordService.encode(request.getPassword()));
        }
    }

    /**
     * Guarda el usuario actualizando la fecha de modificacion.
     */
    private void saveUser(UserDocument user) {
        user.setUpdatedAt(LocalDateTime.now().toString());
        userRepository.save(user);
    }

    /**
     * Comprueba si un texto es nulo o vacio.
     */
    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private boolean isUserOnline(UserDocument user, LocalDateTime threshold) {
        if (user.getLastSeenAt() == null || user.getLastSeenAt().isBlank()) {
            return false;
        }

        try {
            return !LocalDateTime.parse(user.getLastSeenAt()).isBefore(threshold);
        } catch (Exception ignored) {
            return false;
        }
    }

    private String buildDisplayName(UserDocument user) {
        String firstName = user.getFirstName() == null ? "" : user.getFirstName().trim();
        String lastName = user.getLastName() == null ? "" : user.getLastName().trim();
        String fullName = (firstName + " " + lastName).trim();
        return fullName.isBlank() ? user.getEmail() : fullName;
    }
}
