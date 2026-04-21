package com.joseluu.hospital.service;

import com.joseluu.hospital.dto.ShiftTypeDto;
import com.joseluu.hospital.entity.ShiftTypeDocument;
import com.joseluu.hospital.repository.ShiftTypeRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Servicio encargado de los tipos de turno disponibles en cada hospital.
 */
@Service
public class ShiftTypeService {
    private final ShiftTypeRepository shiftTypeRepository;

    public ShiftTypeService(ShiftTypeRepository shiftTypeRepository) {
        this.shiftTypeRepository = shiftTypeRepository;
    }

    /**
     * Lista los tipos de turno de un hospital.
     */
    public List<ShiftTypeDto> getByHospital(String hospitalId) {
        List<ShiftTypeDto> shiftTypes = new ArrayList<>();
        for (ShiftTypeDocument document : shiftTypeRepository.findByHospitalId(hospitalId)) {
            shiftTypes.add(toDto(document));
        }
        return shiftTypes;
    }

    /**
     * Crea un tipo de turno.
     */
    public ShiftTypeDto create(String hospitalId, ShiftTypeDto request) {
        ShiftTypeDocument document = ShiftTypeDocument.builder()
                .id(UUID.randomUUID().toString())
                .hospitalId(hospitalId)
                .code(request.getCode())
                .name(request.getName())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .crossesMidnight(request.isCrossesMidnight())
                .build();

        return toDto(shiftTypeRepository.save(document));
    }

    /**
     * Elimina un tipo de turno si existe.
     */
    public void delete(String hospitalId, String code) {
        shiftTypeRepository.findByHospitalIdAndCode(hospitalId, code)
                .ifPresent(shiftTypeRepository::delete);
    }

    /**
     * Inserta los tipos de turno basicos si el hospital aun no tiene ninguno.
     */
    public void seedDefaults(String hospitalId) {
        if (!shiftTypeRepository.findByHospitalId(hospitalId).isEmpty()) {
            return;
        }

        List<ShiftTypeDocument> defaults = List.of(
                createDefaultShift(hospitalId, "MORNING", "Manana", "06:00", "14:00", false),
                createDefaultShift(hospitalId, "AFTERNOON", "Tarde", "14:00", "22:00", false),
                createDefaultShift(hospitalId, "NIGHT", "Noche", "22:00", "06:00", true)
        );
        shiftTypeRepository.saveAll(defaults);
    }

    /**
     * Crea una entidad base de tipo de turno.
     */
    private ShiftTypeDocument createDefaultShift(String hospitalId,
                                                 String code,
                                                 String name,
                                                 String startTime,
                                                 String endTime,
                                                 boolean crossesMidnight) {
        return ShiftTypeDocument.builder()
                .id(UUID.randomUUID().toString())
                .hospitalId(hospitalId)
                .code(code)
                .name(name)
                .startTime(startTime)
                .endTime(endTime)
                .crossesMidnight(crossesMidnight)
                .build();
    }

    /**
     * Convierte la entidad a DTO.
     */
    private ShiftTypeDto toDto(ShiftTypeDocument document) {
        return ShiftTypeDto.builder()
                .id(document.getId())
                .hospitalId(document.getHospitalId())
                .code(document.getCode())
                .name(document.getName())
                .startTime(document.getStartTime())
                .endTime(document.getEndTime())
                .crossesMidnight(document.isCrossesMidnight())
                .build();
    }
}
