package com.joseluu.hospital.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RefreshTokenRequestDto {
    @NotBlank(message = "El refresh token es obligatorio")
    private String refreshToken;
}
