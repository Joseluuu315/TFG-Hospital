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
     * Valida credenciales y crea una nueva sesion.
     */
    public AuthResponseDto login(LoginRequestDto request) {
        validateLoginRequest(request);

        UserDocument userDocument = findUserByEmail(request.getEmail());
        if (!request.getPassword().equals(userDocument.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciales invalidas");
        }

        return createSession(loadUser(userDocument.getId()));
    }

    /**
     * Renueva los tokens a partir del refresh token.
     */
    public AuthResponseDto refresh(RefreshTokenRequestDto request) {
        if (request == null || request.getRefreshToken() == null || request.getRefreshToken().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Refresh token requerido");
        }

        AuthSession session = requireSessionByRefreshToken(request.getRefreshToken());
        return createSession(session.getUser());
    }

    /**
     * Cierra la sesion asociada al bearer token.
     */
    public void logout(String bearer) {
        String token = extractToken(bearer);
        AuthSession session = sessionsByAccessToken.remove(token);
        if (session != null) {
            sessionsByRefreshToken.remove(session.getRefreshToken());
        }
    }

    /**
     * Devuelve el usuario autenticado asociado al bearer token.
     */
    public UserDto getUserFromBearer(String bearer) {
        String token = extractToken(bearer);
        return requireSessionByAccessToken(token).getUser();
    }

    /**
     * Crea y guarda una sesion con tokens aleatorios.
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
     * Extrae el token real de la cabecera Authorization.
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

    /**
     * Comprueba que la peticion de login trae email y password.
     */
    private void validateLoginRequest(LoginRequestDto request) {
        if (request == null || request.getEmail() == null || request.getPassword() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email y password son obligatorios");
        }
    }

    /**
     * Busca un usuario por email controlando conflictos de integridad.
     */
    private UserDocument findUserByEmail(String email) {
        try {
            return userRepository.findByEmailIgnoreCase(email)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciales invalidas"));
        } catch (IncorrectResultSizeDataAccessException exception) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Error de integridad: Existen multiples cuentas con este email. Contacte con soporte."
            );
        }
    }

    /**
     * Carga el usuario de sesion en formato DTO.
     */
    private UserDto loadUser(String userId) {
        return userService.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario no encontrado"));
    }

    /**
     * Obtiene una sesion por access token o lanza error.
     */
    private AuthSession requireSessionByAccessToken(String accessToken) {
        AuthSession session = sessionsByAccessToken.get(accessToken);
        if (session == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token no valido");
        }
        return session;
    }

    /**
     * Obtiene una sesion por refresh token o lanza error.
     */
    private AuthSession requireSessionByRefreshToken(String refreshToken) {
        AuthSession session = sessionsByRefreshToken.get(refreshToken);
        if (session == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token invalido");
        }
        return session;
    }

    private static class AuthSession {
        private final String accessToken;
        private final String refreshToken;
        private final UserDto user;

        /**
         * Crea una sesion en memoria.
         */
        private AuthSession(String accessToken, String refreshToken, UserDto user) {
            this.accessToken = accessToken;
            this.refreshToken = refreshToken;
            this.user = user;
        }

        /**
         * Devuelve el refresh token de la sesion.
         */
        public String getRefreshToken() {
            return refreshToken;
        }

        /**
         * Devuelve el usuario asociado a la sesion.
         */
        public UserDto getUser() {
            return user;
        }
    }
}
