package com.joseluu.hospital.service;

import com.joseluu.hospital.dto.HospitalSettingsDto;
import com.joseluu.hospital.entity.HospitalSettingsDocument;
import com.joseluu.hospital.entity.enums.NotificationType;
import com.joseluu.hospital.entity.enums.UserRole;
import com.joseluu.hospital.exception.NotFoundException;
import com.joseluu.hospital.repository.HospitalRepository;
import com.joseluu.hospital.repository.HospitalSettingsRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * Servicio encargado de la configuracion general de turnos y nominas por hospital.
 */
@Service
public class HospitalSettingsService {
    private final HospitalSettingsRepository hospitalSettingsRepository;
    private final HospitalRepository hospitalRepository;
    private final NotificationService notificationService;

    public HospitalSettingsService(HospitalSettingsRepository hospitalSettingsRepository,
                                   HospitalRepository hospitalRepository,
                                   NotificationService notificationService) {
        this.hospitalSettingsRepository = hospitalSettingsRepository;
        this.hospitalRepository = hospitalRepository;
        this.notificationService = notificationService;
    }

    /**
     * Devuelve la configuracion de un hospital y crea valores por defecto si faltan.
     */
    public HospitalSettingsDto getByHospital(String hospitalId) {
        ensureDefaults(hospitalId);
        return toDto(requireSettings(hospitalId));
    }

    /**
     * Crea o actualiza la configuracion de un hospital.
     */
    public HospitalSettingsDto upsert(String hospitalId, HospitalSettingsDto request) {
        hospitalRepository.findById(hospitalId)
                .orElseThrow(() -> new NotFoundException("Hospital no encontrado"));

        LocalDateTime now = LocalDateTime.now();
        HospitalSettingsDocument current = hospitalSettingsRepository.findById(hospitalId)
                .orElse(HospitalSettingsDocument.builder()
                        .hospitalId(hospitalId)
                        .createdAt(now.toString())
                        .build());

        current.setMaxWeeklyHours(request.getMaxWeeklyHours());
        current.setMinRestHours(request.getMinRestHours());
        current.setMaxConsecutiveDays(request.getMaxConsecutiveDays());
        current.setMaxConsecutiveNights(request.getMaxConsecutiveNights());
        current.setFairnessWeight(request.getFairnessWeight());
        current.setAutoRecalculate(request.isAutoRecalculate());
        current.setNightBonusPct(request.getNightBonusPct());
        current.setHolidayBonusPct(request.getHolidayBonusPct());
        current.setOvertimeMultiplier(request.getOvertimeMultiplier());
        current.setUpdatedAt(now.toString());

        HospitalSettingsDocument saved = hospitalSettingsRepository.save(current);
        notificationService.createNotificationForRole(
                UserRole.HOSPITAL_ADMIN,
                NotificationType.HOSPITAL_SETTINGS_UPDATED,
                "La configuracion de turnos y nominas ha sido actualizada"
        );
        return toDto(saved);
    }

    /**
     * Inserta la configuracion inicial de un hospital si no existe.
     */
    public void seedDefaults(String hospitalId) {
        if (hospitalSettingsRepository.existsById(hospitalId)) {
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        hospitalSettingsRepository.save(HospitalSettingsDocument.builder()
                .hospitalId(hospitalId)
                .maxWeeklyHours(40)
                .minRestHours(12)
                .maxConsecutiveDays(6)
                .maxConsecutiveNights(3)
                .fairnessWeight(1.0d)
                .autoRecalculate(true)
                .nightBonusPct(0.25d)
                .holidayBonusPct(0.50d)
                .overtimeMultiplier(1.50d)
                .createdAt(now.toString())
                .updatedAt(now.toString())
                .build());
    }

    /**
     * Asegura que el hospital tenga una configuracion base.
     */
    private void ensureDefaults(String hospitalId) {
        if (!hospitalSettingsRepository.existsById(hospitalId)) {
            seedDefaults(hospitalId);
        }
    }

    /**
     * Obtiene la configuracion persistida o lanza error.
     */
    private HospitalSettingsDocument requireSettings(String hospitalId) {
        return hospitalSettingsRepository.findById(hospitalId)
                .orElseThrow(() -> new NotFoundException("Configuracion no encontrada"));
    }

    /**
     * Convierte la entidad a DTO.
     */
    private HospitalSettingsDto toDto(HospitalSettingsDocument document) {
        return HospitalSettingsDto.builder()
                .hospitalId(document.getHospitalId())
                .maxWeeklyHours(document.getMaxWeeklyHours())
                .minRestHours(document.getMinRestHours())
                .maxConsecutiveDays(document.getMaxConsecutiveDays())
                .maxConsecutiveNights(document.getMaxConsecutiveNights())
                .fairnessWeight(document.getFairnessWeight())
                .autoRecalculate(document.isAutoRecalculate())
                .nightBonusPct(document.getNightBonusPct())
                .holidayBonusPct(document.getHolidayBonusPct())
                .overtimeMultiplier(document.getOvertimeMultiplier())
                .createdAt(document.getCreatedAt())
                .updatedAt(document.getUpdatedAt())
                .build();
    }
}
