package com.joseluu.hospital.controller;

import com.joseluu.hospital.dto.AuthResponseDto;
import com.joseluu.hospital.dto.LoginRequestDto;
import com.joseluu.hospital.dto.RefreshTokenRequestDto;
import com.joseluu.hospital.dto.UserDto;
import com.joseluu.hospital.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

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
    @ResponseStatus(HttpStatus.OK)
    public AuthResponseDto login(@Valid @RequestBody LoginRequestDto request) {
        return authService.login(request);
    }

    /**
     * Genera un nuevo access token a partir del refresh token.
     */
    @PostMapping("/refresh")
    @ResponseStatus(HttpStatus.OK)
    public AuthResponseDto refresh(@Valid @RequestBody RefreshTokenRequestDto request) {
        return authService.refresh(request);
    }

    /**
     * Cierra la sesion invalidando los tokens.
     */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestHeader(name = "Authorization", required = false) String authorization) {
        if (authorization == null || authorization.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Cabecera Authorization requerida");
        }
        authService.logout(authorization);
        return ResponseEntity.noContent().build();
    }

    /**
     * Devuelve el usuario asociado al token actual.
     */
    @GetMapping("/me")
    @ResponseStatus(HttpStatus.OK)
    public UserDto me(@RequestHeader(name = "Authorization", required = false) String authorization) {
        return authService.getUserFromBearer(authorization);
    }
}
