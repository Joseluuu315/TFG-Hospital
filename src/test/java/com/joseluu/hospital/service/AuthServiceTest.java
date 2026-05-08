package com.joseluu.hospital.service;

import com.joseluu.hospital.dto.AuthResponseDto;
import com.joseluu.hospital.dto.LoginRequestDto;
import com.joseluu.hospital.dto.UserDto;
import com.joseluu.hospital.entity.AuthSessionDocument;
import com.joseluu.hospital.entity.UserDocument;
import com.joseluu.hospital.entity.enums.UserRole;
import com.joseluu.hospital.repository.AuthSessionRepository;
import com.joseluu.hospital.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

/**
 * Tests unitarios del servicio de autenticacion.
 *
 * <p>Se prueban los caminos criticos de seguridad: extraccion de token,
 * validacion de credenciales y manejo de sesiones caducadas.</p>
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService — Tests unitarios")
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private AuthSessionRepository authSessionRepository;

    @Mock
    private UserService userService;

    @Mock
    private PasswordService passwordService;

    @Mock
    private ResendEmailService resendEmailService;

    // Construido manualmente para controlar los @Value (campos final)
    private AuthService authService;

    // Construye el servicio directamente pasando los @Value como argumentos.
    // Esto evita la inyeccion de reflexion sobre campos final.
    @BeforeEach
    void setUp() {
        authService = new AuthService(
                userRepository,
                authSessionRepository,
                userService,
                passwordService,
                resendEmailService,
                "http://localhost:3000",  // frontendBaseUrl
                60L,                      // passwordResetTtlMinutes
                720L,                     // accessTokenTtlMinutes
                30L                       // refreshTokenTtlDays
        );
    }

    // -----------------------------------------------------------------------
    // getUserFromBearer
    // -----------------------------------------------------------------------

    @Test
    @DisplayName("getUserFromBearer — lanza 401 si Authorization es null")
    void getUserFromBearer_shouldThrow401_whenAuthorizationIsNull() {
        assertThatThrownBy(() -> authService.getUserFromBearer(null))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode().value()).isEqualTo(401));
    }

    @Test
    @DisplayName("getUserFromBearer — lanza 401 si Authorization no empieza por Bearer")
    void getUserFromBearer_shouldThrow401_whenAuthorizationHasInvalidPrefix() {
        assertThatThrownBy(() -> authService.getUserFromBearer("Basic dXNlcjpwYXNz"))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode().value()).isEqualTo(401));
    }

    @Test
    @DisplayName("getUserFromBearer — lanza 401 si el token no existe en sesiones")
    void getUserFromBearer_shouldThrow401_whenTokenNotFound() {
        when(authSessionRepository.findByAccessTokenHash(anyString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.getUserFromBearer("Bearer token-invalido"))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode().value()).isEqualTo(401));
    }

    @Test
    @DisplayName("getUserFromBearer — lanza 401 si el token esta caducado")
    void getUserFromBearer_shouldThrow401_whenTokenExpired() {
        AuthSessionDocument expiredSession = AuthSessionDocument.builder()
                .id("session-1")
                .userId("user-1")
                .accessTokenHash("some-hash")
                .accessTokenExpiresAt(Instant.now().minus(1, ChronoUnit.HOURS).toString())
                .build();

        when(authSessionRepository.findByAccessTokenHash(anyString())).thenReturn(Optional.of(expiredSession));

        assertThatThrownBy(() -> authService.getUserFromBearer("Bearer token-caducado"))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode().value()).isEqualTo(401));
    }

    @Test
    @DisplayName("getUserFromBearer — devuelve UserDto con token valido")
    void getUserFromBearer_shouldReturnUser_whenTokenValid() {
        AuthSessionDocument validSession = AuthSessionDocument.builder()
                .id("session-1")
                .userId("user-1")
                .accessTokenHash("valid-hash")
                .accessTokenExpiresAt(Instant.now().plus(1, ChronoUnit.HOURS).toString())
                .build();

        UserDto expectedUser = UserDto.builder()
                .id("user-1")
                .email("admin@hospital.com")
                .role(UserRole.HOSPITAL_ADMIN)
                .enabled(true)
                .accountNonLocked(true)
                .build();

        when(authSessionRepository.findByAccessTokenHash(anyString())).thenReturn(Optional.of(validSession));
        when(userService.findById("user-1")).thenReturn(Optional.of(expectedUser));

        UserDto result = authService.getUserFromBearer("Bearer token-valido");

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo("user-1");
        assertThat(result.getEmail()).isEqualTo("admin@hospital.com");
    }

    // -----------------------------------------------------------------------
    // login
    // -----------------------------------------------------------------------

    @Test
    @DisplayName("login — lanza 400 si request es null")
    void login_shouldThrow400_whenRequestIsNull() {
        assertThatThrownBy(() -> authService.login(null))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode().value()).isEqualTo(400));
    }

    @Test
    @DisplayName("login — lanza 401 con email incorrecto")
    void login_shouldThrow401_whenEmailNotFound() {
        when(userRepository.findByEmailIgnoreCase("noexiste@test.com")).thenReturn(Optional.empty());

        LoginRequestDto request = new LoginRequestDto();
        request.setEmail("noexiste@test.com");
        request.setPassword("cualquier-pass");

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode().value()).isEqualTo(401));
    }

    @Test
    @DisplayName("login — lanza 401 con password incorrecta")
    void login_shouldThrow401_whenPasswordWrong() {
        UserDocument userDoc = UserDocument.builder()
                .id("user-1")
                .email("admin@hospital.com")
                .password("hashed-password")
                .role(UserRole.HOSPITAL_ADMIN)
                .enabled(true)
                .accountNonLocked(true)
                .build();

        when(userRepository.findByEmailIgnoreCase("admin@hospital.com")).thenReturn(Optional.of(userDoc));
        when(passwordService.matches("wrong-pass", "hashed-password")).thenReturn(false);

        LoginRequestDto request = new LoginRequestDto();
        request.setEmail("admin@hospital.com");
        request.setPassword("wrong-pass");

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode().value()).isEqualTo(401));
    }

    @Test
    @DisplayName("login — devuelve tokens con credenciales correctas")
    void login_shouldReturnTokens_whenCredentialsCorrect() {
        UserDocument userDoc = UserDocument.builder()
                .id("user-1")
                .email("admin@hospital.com")
                .password("hashed-password")
                .role(UserRole.HOSPITAL_ADMIN)
                .enabled(true)
                .accountNonLocked(true)
                .build();

        UserDto userDto = UserDto.builder()
                .id("user-1")
                .email("admin@hospital.com")
                .role(UserRole.HOSPITAL_ADMIN)
                .enabled(true)
                .accountNonLocked(true)
                .build();

        when(userRepository.findByEmailIgnoreCase("admin@hospital.com")).thenReturn(Optional.of(userDoc));
        when(passwordService.matches("correct-pass", "hashed-password")).thenReturn(true);
        when(userRepository.save(any())).thenReturn(userDoc);
        when(userService.findById("user-1")).thenReturn(Optional.of(userDto));
        when(authSessionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        LoginRequestDto request = new LoginRequestDto();
        request.setEmail("admin@hospital.com");
        request.setPassword("correct-pass");

        AuthResponseDto response = authService.login(request);

        assertThat(response).isNotNull();
        assertThat(response.getAccessToken()).isNotBlank();
        assertThat(response.getRefreshToken()).isNotBlank();
        assertThat(response.getUser().getId()).isEqualTo("user-1");
    }
}
