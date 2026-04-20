package com.joseluu.hospital.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class CreateWorkGroupRequestDto {
    @NotBlank(message = "El nombre del grupo es obligatorio")
    private String name;
    private String description;
    private List<String> members;
}
