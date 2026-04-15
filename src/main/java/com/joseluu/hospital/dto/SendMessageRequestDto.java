package com.joseluu.hospital.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SendMessageRequestDto {
    @NotBlank(message = "El contenido del mensaje es obligatorio")
    private String content;
}
