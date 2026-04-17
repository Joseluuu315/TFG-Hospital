package com.joseluu.hospital.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreatePrivateChatRequestDto {
    @NotBlank(message = "El identificador del usuario es obligatorio")
    private String userId;
}
