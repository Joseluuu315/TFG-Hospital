
package com.joseluu.hospital.service;

import com.joseluu.hospital.dto.CalendarEventDto;
import com.joseluu.hospital.dto.CreateUserRequestDto;
import com.joseluu.hospital.dto.LeaveRequestDto;
import com.joseluu.hospital.dto.UpdateUserRequestDto;
import com.joseluu.hospital.dto.UserDto;
import com.joseluu.hospital.entity.CalendarEventDocument;
import com.joseluu.hospital.entity.HospitalDocument;
import com.joseluu.hospital.entity.UserDocument;
import com.joseluu.hospital.entity.enums.UserRole;
import com.joseluu.hospital.exception.NotFoundException;
import com.joseluu.hospital.repository.HospitalRepository;
import com.joseluu.hospital.repository.LeaveRequestRepository;
import com.joseluu.hospital.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

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
     * Lista todos los usuarios.
     */
    public List<UserDto> getAll() {
        return userRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Busca un usuario por id.
     */
    public Optional<UserDto> findById(String id) {
        return userRepository.findById(id)
                .map(this::toDto);
    }

    /**
     * Obtiene un usuario por id o lanza error.
     */
    public UserDto getById(String id) {
        return findById(id)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado"));
    }

    /**
     * Obtiene los eventos de calendario de un usuario para un mes dado.
     */
    public List<CalendarEventDto> getCalendarEvents(String userId, String month) {
        UserDocument user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado"));

        return Optional.ofNullable(user.getCalendarEvents())
                .orElse(Collections.emptyList())
                .stream()
                .filter(event -> {
                    if (month == null) {
                        return true;
                    }
                    String date = event.getDate();
                    return date != null && date.startsWith(month);
                })
                .map(this::toCalendarEvent)
                .collect(Collectors.toList());
    }

    /**
     * Crea un trabajador asociado al primer hospital disponible.
     */
    public UserDto createWorker(CreateUserRequestDto request) {
        LocalDateTime now = LocalDateTime.now();
        Optional<HospitalDocument> hospital = hospitalRepository.findAll().stream().findFirst();

        UserDocument document = UserDocument.builder()
                .id(UUID.randomUUID().toString())
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .imageURL(request.getImageURL()) // Added imageURL
                .email(request.getEmail())
                .phone(request.getPhone())
                .dni(request.getDni())
                .role(UserRole.WORKER)
                .enabled(true)
                .accountNonLocked(true)
                .hospitalId(hospital.map(HospitalDocument::getId).orElse(null))
                .hospitalName(hospital.map(HospitalDocument::getName).orElse(null))
                .department(request.getDepartment())
                .jobTitle(request.getJobTitle())
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
     * Actualiza los datos de un usuario.
     */
    public UserDto updateUser(String userId, UpdateUserRequestDto request) {
        UserDocument user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("Usuario no encontrado"));

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
        if (request.getDepartment() != null) {
            user.setDepartment(request.getDepartment());
        }
        if (request.getJobTitle() != null) {
            user.setJobTitle(request.getJobTitle());
        }
        if (request.getBaseSalary() != null) {
            user.setBaseSalary(request.getBaseSalary());
        }
        if (request.getEnabled() != null) {
            user.setEnabled(request.getEnabled());
        }
        if (request.getAccountNonLocked() != null) {
            user.setAccountNonLocked(request.getAccountNonLocked());
        }
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPassword(request.getPassword());
        }
        user.setUpdatedAt(LocalDateTime.now().toString());

        return toDto(userRepository.save(user));
    }

    /**
     * Convierte la entidad en DTO y adjunta calendarios y solicitudes.
     */
    private UserDto toDto(UserDocument document) {
        List<LeaveRequestDto> leaveRequests = leaveRequestRepository.findByUserId(document.getId()).stream()
                .map(this::toLeaveRequestDto)
                .collect(Collectors.toList());

        List<CalendarEventDto> calendarEvents = Optional.ofNullable(document.getCalendarEvents())
                .orElse(Collections.emptyList())
                .stream()
                .map(this::toCalendarEvent)
                .collect(Collectors.toList());

        UserDto dto = UserDto.builder()
                .id(document.getId())
                .firstName(document.getFirstName())
                .lastName(document.getLastName())
                .imageURL(document.getImageURL()) // Added imageURL
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
     * Convierte solicitudes de ausencia a DTO.
     */
    private LeaveRequestDto toLeaveRequestDto(com.joseluu.hospital.entity.LeaveRequestDocument document) {
        return LeaveRequestDto.builder()
                .id(document.getId())
                .userId(document.getUserId())
                .startDate(document.getStartDate())
                .endDate(document.getEndDate())
                .reason(document.getReason())
                .status(document.getStatus())
                .requestedAt(document.getRequestedAt())
                .reviewedAt(document.getReviewedAt())
                .reviewComment(document.getReviewComment())
                .build();
    }

    /**
     * Convierte eventos de calendario a DTO.
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
}
