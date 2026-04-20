package com.joseluu.hospital.service;

import com.joseluu.hospital.dto.AuthResponseDto;
import com.joseluu.hospital.dto.LoginRequestDto;
import com.joseluu.hospital.dto.RefreshTokenRequestDto;
import com.joseluu.hospital.dto.UserDto;
import com.joseluu.hospital.entity.UserDocument;
import com.joseluu.hospital.repository.UserRepository;
import org.springframework.dao.IncorrectResultSizeDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Servicio de autenticacion basado en tokens en memoria.
 */
@Service
public class AuthService {
    private final UserRepository userRepository;
    private final UserService userService;
    private final Map<String, AuthSession> sessionsByAccessToken = new ConcurrentHashMap<>();
    private final Map<String, AuthSession> sessionsByRefreshToken = new ConcurrentHashMap<>();

    public AuthService(UserRepository userRepository, UserService userService) {
        this.userRepository = userRepository;
        this.userService = userService;
    }

    /**
     * Valida credenciales y crea una sesion.
     */
    public AuthResponseDto login(LoginRequestDto request) {
        if (request == null || request.getEmail() == null || request.getPassword() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email y password son obligatorios");
        }

        UserDocument userDocument;
        try {
            // Intentamos buscar el usuario
            userDocument = userRepository.findByEmailIgnoreCase(request.getEmail())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciales invalidas"));

        } catch (IncorrectResultSizeDataAccessException e) {
            // Si entra aquí, es porque hay más de un usuario con el mismo email
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Error de integridad: Existen múltiples cuentas con este email. Contacte con soporte."
            );
        }

        if (!userDocument.getPassword().equals(request.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciales invalidas");
        }

        UserDto user = userService.findById(userDocument.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario no encontrado"));

        return createSession(user);
    }

    /**
     * Renueva tokens usando el refresh token.
     */
    public AuthResponseDto refresh(RefreshTokenRequestDto request) {
        if (request == null || request.getRefreshToken() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Refresh token requerido");
        }
        AuthSession session = sessionsByRefreshToken.get(request.getRefreshToken());
        if (session == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token invalido");
        }
        return createSession(session.user());
    }

    /**
     * Invalida los tokens asociados al bearer.
     */
    public void logout(String bearer) {
        String token = extractToken(bearer);
        AuthSession session = sessionsByAccessToken.remove(token);
        if (session != null) {
            sessionsByRefreshToken.remove(session.refreshToken());
        }
    }

    /**
     * Obtiene el usuario autenticado a partir del bearer token.
     */
    public UserDto getUserFromBearer(String bearer) {
        String token = extractToken(bearer);
        AuthSession session = sessionsByAccessToken.get(token);
        if (session == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token no valido");
        }
        return session.user();
    }

    /**
     * Crea una nueva sesion con tokens aleatorios.
     */
    private AuthResponseDto createSession(UserDto user) {
        String accessToken = UUID.randomUUID().toString();
        String refreshToken = UUID.randomUUID().toString();
        AuthSession session = new AuthSession(accessToken, refreshToken, user);
        sessionsByAccessToken.put(accessToken, session);
        sessionsByRefreshToken.put(refreshToken, session);
        return AuthResponseDto.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(user)
                .build();
    }

    /**
     * Extrae el token desde la cabecera Authorization.
     */
    private String extractToken(String bearer) {
        if (bearer == null || !bearer.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Cabecera Authorization requerida");
        }
        String token = bearer.substring(7).trim();
        if (token.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token no valido");
        }
        return token;
    }

    private record AuthSession(String accessToken, String refreshToken, UserDto user) {}
}
