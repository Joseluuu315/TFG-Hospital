package com.joseluu.hospital.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RefreshTokenRequestDto {
    @NotBlank(message = "El refreshToken es obligatorio")
    private String refreshToken;
}
