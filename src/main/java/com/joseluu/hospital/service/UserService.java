package com.joseluu.hospital.service;

import com.joseluu.hospital.dto.CalendarEventDto;
import com.joseluu.hospital.dto.CreateUserRequestDto;
import com.joseluu.hospital.dto.LeaveRequestDto;
import com.joseluu.hospital.dto.UpdateUserRequestDto;
import com.joseluu.hospital.dto.UserDto;
import com.joseluu.hospital.entity.CalendarEventDocument;
import com.joseluu.hospital.entity.HospitalDocument;
import com.joseluu.hospital.entity.LeaveRequestDocument;
import com.joseluu.hospital.entity.UserDocument;
import com.joseluu.hospital.entity.enums.UserRole;
import com.joseluu.hospital.exception.NotFoundException;
import com.joseluu.hospital.repository.HospitalRepository;
import com.joseluu.hospital.repository.LeaveRequestRepository;
import com.joseluu.hospital.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Servicio para gestionar usuarios y sus datos asociados.
 */
@Service
public class UserService {
    private final UserRepository userRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final HospitalRepository hospitalRepository;

    public UserService(UserRepository userRepository,
                       LeaveRequestRepository leaveRequestRepository,
                       HospitalRepository hospitalRepository) {
        this.userRepository = userRepository;
        this.leaveRequestRepository = leaveRequestRepository;
        this.hospitalRepository = hospitalRepository;
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
    public UserDto createWorker(CreateUserRequestDto request) {
        LocalDateTime now = LocalDateTime.now();
        HospitalDocument hospital = requireHospital(request.getHospitalId());
        UserRole role = request.getRole() != null ? request.getRole() : UserRole.WORKER;

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
                .createdAt(now.toString())
                .updatedAt(now.toString())
                .password(request.getPassword())
                .build();

        return toDto(userRepository.save(document));
    }

    /**
     * Actualiza los datos editables de un usuario.
     */
    public UserDto updateUser(String userId, UpdateUserRequestDto request) {
        UserDocument user = requireUser(userId);

        applyBasicChanges(user, request);
        applyWorkChanges(user, request);
        applyAccessChanges(user, request);

        saveUser(user);
        return toDto(user);
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
            user.setPassword(request.getPassword());
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
}
