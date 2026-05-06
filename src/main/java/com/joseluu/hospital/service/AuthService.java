package com.joseluu.hospital.service;

import com.joseluu.hospital.dto.AuthResponseDto;
import com.joseluu.hospital.dto.ForgotPasswordRequestDto;
import com.joseluu.hospital.dto.LoginRequestDto;
import com.joseluu.hospital.dto.MessageResponseDto;
import com.joseluu.hospital.dto.RefreshTokenRequestDto;
import com.joseluu.hospital.dto.ResetPasswordRequestDto;
import com.joseluu.hospital.dto.UserDto;
import com.joseluu.hospital.entity.AuthSessionDocument;
import com.joseluu.hospital.entity.UserDocument;
import com.joseluu.hospital.repository.AuthSessionRepository;
import com.joseluu.hospital.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.IncorrectResultSizeDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
import java.util.UUID;

/**
 * Servicio de autenticacion basado en tokens persistidos.
 */
@Service
public class AuthService {
    private final UserRepository userRepository;
    private final AuthSessionRepository authSessionRepository;
    private final UserService userService;
    private final PasswordService passwordService;
    private final ResendEmailService resendEmailService;
    private final String frontendBaseUrl;
    private final long passwordResetTtlMinutes;
    private final long accessTokenTtlMinutes;
    private final long refreshTokenTtlDays;

    public AuthService(UserRepository userRepository,
                       AuthSessionRepository authSessionRepository,
                       UserService userService,
                       PasswordService passwordService,
                       ResendEmailService resendEmailService,
                       @Value("${app.frontend.base-url}") String frontendBaseUrl,
                       @Value("${app.auth.password-reset.ttl-minutes:60}") long passwordResetTtlMinutes,
                       @Value("${app.auth.access-token.ttl-minutes:720}") long accessTokenTtlMinutes,
                       @Value("${app.auth.refresh-token.ttl-days:30}") long refreshTokenTtlDays) {
        this.userRepository = userRepository;
        this.authSessionRepository = authSessionRepository;
        this.userService = userService;
        this.passwordService = passwordService;
        this.resendEmailService = resendEmailService;
        this.frontendBaseUrl = frontendBaseUrl;
        this.passwordResetTtlMinutes = passwordResetTtlMinutes;
        this.accessTokenTtlMinutes = accessTokenTtlMinutes;
        this.refreshTokenTtlDays = refreshTokenTtlDays;
    }

    /**
     * Valida credenciales y crea una nueva sesion.
     */
    public AuthResponseDto login(LoginRequestDto request) {
        validateLoginRequest(request);

        UserDocument userDocument = findUserByEmail(request.getEmail());
        if (!passwordService.matches(request.getPassword(), userDocument.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciales invalidas");
        }
        userDocument.setLastSeenAt(java.time.LocalDateTime.now().toString());
        userRepository.save(userDocument);

        return createSession(loadUser(userDocument.getId()));
    }

    /**
     * Genera un token temporal y envia el email de recuperacion.
     */
    public MessageResponseDto requestPasswordReset(ForgotPasswordRequestDto request) {
        if (request == null || request.getEmail() == null || request.getEmail().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El email es obligatorio");
        }

        try {
            UserDocument user = findUserByEmail(request.getEmail());
            String rawToken = UUID.randomUUID() + UUID.randomUUID().toString().replace("-", "");
            user.setPasswordResetTokenHash(hashToken(rawToken));
            user.setPasswordResetTokenExpiresAt(Instant.now().plus(Duration.ofMinutes(passwordResetTtlMinutes)).toString());
            userRepository.save(user);

            resendEmailService.sendPasswordResetEmail(
                    user.getEmail(),
                    buildDisplayName(user),
                    buildResetLink(rawToken)
            );
        } catch (ResponseStatusException exception) {
            if (exception.getStatusCode().value() != HttpStatus.UNAUTHORIZED.value()) {
                throw exception;
            }
        }

        return new MessageResponseDto("Si el correo existe, hemos enviado un enlace para restablecer la contrasena.");
    }

    /**
     * Restablece la contrasena usando el token recibido por correo.
     */
    public MessageResponseDto resetPassword(ResetPasswordRequestDto request) {
        if (request == null || request.getToken() == null || request.getToken().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El token es obligatorio");
        }
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La nueva contrasena es obligatoria");
        }

        UserDocument user = userRepository.findByPasswordResetTokenHash(hashToken(request.getToken()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "El enlace de recuperacion no es valido."));

        if (user.getPasswordResetTokenExpiresAt() == null
                || Instant.parse(user.getPasswordResetTokenExpiresAt()).isBefore(Instant.now())) {
            clearPasswordReset(user);
            userRepository.save(user);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El enlace de recuperacion ha caducado.");
        }

        user.setPassword(passwordService.encode(request.getPassword()));
        clearPasswordReset(user);
        userRepository.save(user);
        invalidateSessionsForUser(user.getId());

        return new MessageResponseDto("Contrasena actualizada correctamente.");
    }

    /**
     * Renueva los tokens a partir del refresh token.
     */
    public AuthResponseDto refresh(RefreshTokenRequestDto request) {
        if (request == null || request.getRefreshToken() == null || request.getRefreshToken().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Refresh token requerido");
        }

        AuthSessionDocument session = requireSessionByRefreshToken(request.getRefreshToken());
        UserDto user = loadUser(session.getUserId());
        authSessionRepository.delete(session);
        return createSession(user);
    }

    /**
     * Cierra la sesion asociada al bearer token.
     */
    public void logout(String bearer) {
        String token = extractToken(bearer);
        authSessionRepository.deleteByAccessTokenHash(hashToken(token));
    }

    /**
     * Devuelve el usuario autenticado asociado al bearer token.
     */
    public UserDto getUserFromBearer(String bearer) {
        String token = extractToken(bearer);
        AuthSessionDocument session = requireSessionByAccessToken(token);
        return loadUser(session.getUserId());
    }

    /**
     * Crea y guarda una sesion con tokens aleatorios.
     */
    private AuthResponseDto createSession(UserDto user) {
        String accessToken = UUID.randomUUID().toString();
        String refreshToken = UUID.randomUUID().toString();
        Instant now = Instant.now();

        AuthSessionDocument session = AuthSessionDocument.builder()
                .id(UUID.randomUUID().toString())
                .accessTokenHash(hashToken(accessToken))
                .refreshTokenHash(hashToken(refreshToken))
                .userId(user.getId())
                .accessTokenExpiresAt(now.plus(Duration.ofMinutes(accessTokenTtlMinutes)).toString())
                .refreshTokenExpiresAt(now.plus(Duration.ofDays(refreshTokenTtlDays)).toString())
                .createdAt(now.toString())
                .updatedAt(now.toString())
                .build();
        authSessionRepository.save(session);

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
    private AuthSessionDocument requireSessionByAccessToken(String accessToken) {
        AuthSessionDocument session = authSessionRepository.findByAccessTokenHash(hashToken(accessToken))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token no valido"));
        if (isExpired(session.getAccessTokenExpiresAt())) {
            authSessionRepository.delete(session);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token caducado");
        }
        return session;
    }

    /**
     * Obtiene una sesion por refresh token o lanza error.
     */
    private AuthSessionDocument requireSessionByRefreshToken(String refreshToken) {
        AuthSessionDocument session = authSessionRepository.findByRefreshTokenHash(hashToken(refreshToken))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token invalido"));
        if (isExpired(session.getRefreshTokenExpiresAt())) {
            authSessionRepository.delete(session);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token caducado");
        }
        return session;
    }

    private String buildResetLink(String rawToken) {
        String baseUrl = frontendBaseUrl.endsWith("/") ? frontendBaseUrl.substring(0, frontendBaseUrl.length() - 1) : frontendBaseUrl;
        return baseUrl + "/reset-password?token=" + URLEncoder.encode(rawToken, StandardCharsets.UTF_8);
    }

    private String buildDisplayName(UserDocument user) {
        String firstName = user.getFirstName() == null ? "" : user.getFirstName().trim();
        String lastName = user.getLastName() == null ? "" : user.getLastName().trim();
        String fullName = (firstName + " " + lastName).trim();
        return fullName.isBlank() ? user.getEmail() : fullName;
    }

    private String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 no disponible", exception);
        }
    }

    private void clearPasswordReset(UserDocument user) {
        user.setPasswordResetTokenHash(null);
        user.setPasswordResetTokenExpiresAt(null);
    }

    private void invalidateSessionsForUser(String userId) {
        authSessionRepository.deleteByUserId(userId);
    }

    private boolean isExpired(String expiresAt) {
        return expiresAt == null || Instant.parse(expiresAt).isBefore(Instant.now());
    }
}
