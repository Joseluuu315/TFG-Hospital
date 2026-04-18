package com.joseluu.hospital.service;

import com.joseluu.hospital.dto.ShiftTypeDto;
import com.joseluu.hospital.entity.ShiftTypeDocument;
import com.joseluu.hospital.repository.ShiftTypeRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ShiftTypeService {
    private final ShiftTypeRepository shiftTypeRepository;

    public ShiftTypeService(ShiftTypeRepository shiftTypeRepository) {
        this.shiftTypeRepository = shiftTypeRepository;
    }

    public List<ShiftTypeDto> getByHospital(String hospitalId) {
        return shiftTypeRepository.findByHospitalId(hospitalId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public ShiftTypeDto create(String hospitalId, ShiftTypeDto request) {
        ShiftTypeDocument saved = shiftTypeRepository.save(ShiftTypeDocument.builder()
                .id(UUID.randomUUID().toString())
                .hospitalId(hospitalId)
                .code(request.getCode())
                .name(request.getName())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .crossesMidnight(request.isCrossesMidnight())
                .build());
        return toDto(saved);
    }

    public void seedDefaults(String hospitalId) {
        if (!shiftTypeRepository.findByHospitalId(hospitalId).isEmpty()) {
            return;
        }
        shiftTypeRepository.saveAll(List.of(
                ShiftTypeDocument.builder().id(UUID.randomUUID().toString()).hospitalId(hospitalId).code("MORNING").name("Manana").startTime("06:00").endTime("14:00").crossesMidnight(false).build(),
                ShiftTypeDocument.builder().id(UUID.randomUUID().toString()).hospitalId(hospitalId).code("AFTERNOON").name("Tarde").startTime("14:00").endTime("22:00").crossesMidnight(false).build(),
                ShiftTypeDocument.builder().id(UUID.randomUUID().toString()).hospitalId(hospitalId).code("NIGHT").name("Noche").startTime("22:00").endTime("06:00").crossesMidnight(true).build()
        ));
    }

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
