package com.joseluu.hospital.service;

import com.joseluu.hospital.dto.HospitalSettingsDto;
import com.joseluu.hospital.dto.UpsertWorkerContractRequestDto;
import com.joseluu.hospital.dto.WorkerContractDto;
import com.joseluu.hospital.entity.UserDocument;
import com.joseluu.hospital.entity.WorkerContractDocument;
import com.joseluu.hospital.exception.NotFoundException;
import com.joseluu.hospital.repository.UserRepository;
import com.joseluu.hospital.repository.WorkerContractRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

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

    public WorkerContractDto getActiveByWorker(String workerId) {
        return workerContractRepository.findByWorkerIdAndActiveTrue(workerId)
                .map(this::toDto)
                .orElseThrow(() -> new NotFoundException("Contrato no encontrado"));
    }

    public WorkerContractDto upsert(String hospitalId, UpsertWorkerContractRequestDto request) {
        UserDocument worker = userRepository.findById(request.getWorkerId())
                .orElseThrow(() -> new NotFoundException("Trabajador no encontrado"));
        if (!hospitalId.equals(worker.getHospitalId())) {
            throw new NotFoundException("Trabajador fuera del hospital");
        }

        workerContractRepository.findByWorkerIdAndActiveTrue(worker.getId()).ifPresent(current -> {
            current.setActive(false);
            current.setUpdatedAt(LocalDateTime.now().toString());
            workerContractRepository.save(current);
        });

        HospitalSettingsDto settings = hospitalSettingsService.getByHospital(hospitalId);
        LocalDateTime now = LocalDateTime.now();
        WorkerContractDocument document = WorkerContractDocument.builder()
                .id(UUID.randomUUID().toString())
                .hospitalId(hospitalId)
                .workerId(worker.getId())
                .hourlyRate(request.getHourlyRate())
                .weeklyHours(request.getWeeklyHours())
                .nightBonusPct(request.getNightBonusPct() != null ? request.getNightBonusPct() : settings.getNightBonusPct())
                .holidayBonusPct(request.getHolidayBonusPct() != null ? request.getHolidayBonusPct() : settings.getHolidayBonusPct())
                .overtimeMultiplier(request.getOvertimeMultiplier() != null ? request.getOvertimeMultiplier() : settings.getOvertimeMultiplier())
                .effectiveFrom(request.getEffectiveFrom() != null ? request.getEffectiveFrom() : LocalDate.now().toString())
                .active(true)
                .createdAt(now.toString())
                .updatedAt(now.toString())
                .build();

        return toDto(workerContractRepository.save(document));
    }

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
