package com.joseluu.hospital.service;

import com.joseluu.hospital.dto.HospitalSettingsDto;
import com.joseluu.hospital.dto.UpsertWorkerContractRequestDto;
import com.joseluu.hospital.dto.UserDto;
import com.joseluu.hospital.dto.WorkerContractDto;
import com.joseluu.hospital.entity.UserDocument;
import com.joseluu.hospital.entity.enums.UserRole;
import com.joseluu.hospital.exception.ForbiddenException;
import com.joseluu.hospital.entity.WorkerContractDocument;
import com.joseluu.hospital.exception.NotFoundException;
import com.joseluu.hospital.repository.UserRepository;
import com.joseluu.hospital.repository.WorkerContractRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Servicio encargado de los contratos activos de los trabajadores.
 */
@Service
public class WorkerContractService {
    private final WorkerContractRepository workerContractRepository;
    private final UserRepository userRepository;
    private final HospitalSettingsService hospitalSettingsService;

    public WorkerContractService(WorkerContractRepository workerContractRepository,
                                 UserRepository userRepository,
                                 HospitalSettingsService hospitalSettingsService) {
        this.workerContractRepository = workerContractRepository;
        this.userRepository = userRepository;
        this.hospitalSettingsService = hospitalSettingsService;
    }

    /**
     * Devuelve el contrato activo de un trabajador.
     */
    public WorkerContractDto getActiveByWorker(String workerId, UserDto actor) {
        UserDocument worker = requireWorker(workerId);
        validateHospitalAccess(worker.getHospitalId(), actor);
        return workerContractRepository.findByWorkerIdAndActiveTrue(workerId)
                .map(this::toDto)
                .orElseThrow(() -> new NotFoundException("Contrato no encontrado"));
    }

    /**
     * Crea o sustituye el contrato activo del trabajador.
     */
    public WorkerContractDto upsert(String hospitalId, UpsertWorkerContractRequestDto request, UserDto actor) {
        validateHospitalAccess(hospitalId, actor);
        UserDocument worker = requireWorkerInHospital(hospitalId, request.getWorkerId());
        deactivateCurrentContract(worker.getId());

        HospitalSettingsDto settings = hospitalSettingsService.getByHospital(hospitalId);
        LocalDateTime now = LocalDateTime.now();

        WorkerContractDocument document = WorkerContractDocument.builder()
                .id(UUID.randomUUID().toString())
                .hospitalId(hospitalId)
                .workerId(worker.getId())
                .hourlyRate(request.getHourlyRate())
                .weeklyHours(request.getWeeklyHours())
                .nightBonusPct(valueOrDefault(request.getNightBonusPct(), settings.getNightBonusPct()))
                .holidayBonusPct(valueOrDefault(request.getHolidayBonusPct(), settings.getHolidayBonusPct()))
                .overtimeMultiplier(valueOrDefault(request.getOvertimeMultiplier(), settings.getOvertimeMultiplier()))
                .effectiveFrom(request.getEffectiveFrom() != null ? request.getEffectiveFrom() : LocalDate.now().toString())
                .active(true)
                .createdAt(now.toString())
                .updatedAt(now.toString())
                .build();

        return toDto(workerContractRepository.save(document));
    }

    /**
     * Obtiene el trabajador y comprueba que pertenece al hospital.
     */
    private UserDocument requireWorkerInHospital(String hospitalId, String workerId) {
        UserDocument worker = requireWorker(workerId);
        if (!hospitalId.equals(worker.getHospitalId())) {
            throw new NotFoundException("Trabajador fuera del hospital");
        }
        return worker;
    }

    private UserDocument requireWorker(String workerId) {
        return userRepository.findById(workerId)
                .orElseThrow(() -> new NotFoundException("Trabajador no encontrado"));
    }

    private void validateHospitalAccess(String hospitalId, UserDto actor) {
        if (actor == null || actor.getRole() == null) {
            throw new ForbiddenException("No tienes permisos para gestionar contratos");
        }
        if (actor.getRole() == UserRole.ROOT) {
            return;
        }
        if (actor.getRole() == UserRole.HOSPITAL_ADMIN
                && actor.getHospitalId() != null
                && actor.getHospitalId().equals(hospitalId)) {
            return;
        }
        throw new ForbiddenException("Solo puedes gestionar contratos de tu hospital");
    }

    /**
     * Desactiva el contrato actual si existe.
     */
    private void deactivateCurrentContract(String workerId) {
        workerContractRepository.findByWorkerIdAndActiveTrue(workerId).ifPresent(current -> {
            current.setActive(false);
            current.setUpdatedAt(LocalDateTime.now().toString());
            workerContractRepository.save(current);
        });
    }

    /**
     * Devuelve el valor indicado o el valor por defecto.
     */
    private Double valueOrDefault(Double value, Double defaultValue) {
        return value != null ? value : defaultValue;
    }

    /**
     * Convierte la entidad a DTO.
     */
    private WorkerContractDto toDto(WorkerContractDocument document) {
        return WorkerContractDto.builder()
                .id(document.getId())
                .hospitalId(document.getHospitalId())
                .workerId(document.getWorkerId())
                .hourlyRate(document.getHourlyRate())
                .weeklyHours(document.getWeeklyHours())
                .nightBonusPct(document.getNightBonusPct())
                .holidayBonusPct(document.getHolidayBonusPct())
                .overtimeMultiplier(document.getOvertimeMultiplier())
                .effectiveFrom(document.getEffectiveFrom())
                .active(document.isActive())
                .createdAt(document.getCreatedAt())
                .updatedAt(document.getUpdatedAt())
                .build();
    }
}
