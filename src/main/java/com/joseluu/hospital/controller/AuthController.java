package com.joseluu.hospital.controller;

import com.joseluu.hospital.dto.AuthResponseDto;
import com.joseluu.hospital.dto.LoginRequestDto;
import com.joseluu.hospital.dto.RefreshTokenRequestDto;
import com.joseluu.hospital.dto.UserDto;
import com.joseluu.hospital.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controlador de autenticacion y sesion.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * Inicia sesion con credenciales y devuelve tokens.
     */
    @PostMapping("/login")
    public AuthResponseDto login(@RequestBody LoginRequestDto request) {
        return authService.login(request);
    }

    /**
     * Genera un nuevo access token a partir del refresh token.
     */
    @PostMapping("/refresh")
    public AuthResponseDto refresh(@RequestBody RefreshTokenRequestDto request) {
        return authService.refresh(request);
    }

    /**
     * Cierra la sesion invalidando los tokens.
     */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestHeader(name = "Authorization", required = false) String authorization) {
        if (authorization != null) {
            authService.logout(authorization);
        }
        return ResponseEntity.ok().build();
    }

    /**
     * Devuelve el usuario asociado al token actual.
     */
    @GetMapping("/me")
    public UserDto me(@RequestHeader(name = "Authorization", required = false) String authorization) {
        return authService.getUserFromBearer(authorization);
    }
}
