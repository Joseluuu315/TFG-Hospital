package com.joseluu.hospital.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreatePrivateChatRequestDto {
    @NotBlank(message = "El userId es obligatorio")
    private String userId;
}
