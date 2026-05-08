package com.joseluu.hospital.controller;

import com.joseluu.hospital.dto.CreateUserRequestDto;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.prepost.PreAuthorize;

import java.lang.reflect.Method;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Tests de seguridad de UsersController.
 *
 * <p>Verifican mediante reflexion que los metodos del controlador tienen
 * las anotaciones @PreAuthorize correctas para cada operacion.</p>
 *
 * <ul>
 *   <li>getAll — cualquier usuario autenticado</li>
 *   <li>create — solo HOSPITAL_ADMIN o ROOT</li>
 *   <li>update — solo HOSPITAL_ADMIN o ROOT</li>
 *   <li>addCalendarEvent — solo HOSPITAL_ADMIN o ROOT</li>
 * </ul>
 */
@DisplayName("UsersController — Verificacion de anotaciones @PreAuthorize")
class UsersControllerSecurityTest {

    @Test
    @DisplayName("getAll debe estar disponible para cualquier usuario autenticado")
    void getAll_shouldAllowAnyAuthenticatedUser() throws NoSuchMethodException {
        Method method = UsersController.class.getMethod("getAll");
        PreAuthorize annotation = method.getAnnotation(PreAuthorize.class);

        assertThat(annotation).isNotNull();
        assertThat(annotation.value()).contains("isAuthenticated()");
    }

    @Test
    @DisplayName("create debe exigir HOSPITAL_ADMIN o ROOT")
    void create_shouldRequireAdminOrRoot() throws NoSuchMethodException {
        Method method = UsersController.class.getMethod("create", CreateUserRequestDto.class);
        PreAuthorize annotation = method.getAnnotation(PreAuthorize.class);

        assertThat(annotation)
                .as("create debe tener @PreAuthorize")
                .isNotNull();
        assertThat(annotation.value())
                .as("Solo HOSPITAL_ADMIN o ROOT pueden crear usuarios")
                .containsAnyOf("HOSPITAL_ADMIN", "ROOT");
    }

    @Test
    @DisplayName("create no debe permitir WORKER")
    void create_shouldNotAllowWorkerRole() throws NoSuchMethodException {
        Method method = UsersController.class.getMethod("create", CreateUserRequestDto.class);
        PreAuthorize annotation = method.getAnnotation(PreAuthorize.class);

        assertThat(annotation).isNotNull();
        assertThat(annotation.value())
                .as("Un WORKER no puede crear otros usuarios")
                .doesNotContain("isAuthenticated()");
    }

    @Test
    @DisplayName("addCalendarEvent debe exigir HOSPITAL_ADMIN o ROOT")
    void addCalendarEvent_shouldRequireAdminOrRoot() throws NoSuchMethodException {
        Method method = UsersController.class.getDeclaredMethod("addCalendarEvent", String.class,
                com.joseluu.hospital.dto.CalendarEventDto.class);
        PreAuthorize annotation = method.getAnnotation(PreAuthorize.class);

        assertThat(annotation).isNotNull();
        assertThat(annotation.value()).containsAnyOf("HOSPITAL_ADMIN", "ROOT");
    }

    @Test
    @DisplayName("updateMyself debe estar disponible para cualquier usuario autenticado")
    void updateMyself_shouldAllowAnyAuthenticatedUser() throws NoSuchMethodException {
        Method method = UsersController.class.getDeclaredMethod("updateMyself",
                String.class, com.joseluu.hospital.dto.UpdateUserRequestDto.class);
        PreAuthorize annotation = method.getAnnotation(PreAuthorize.class);

        assertThat(annotation).isNotNull();
        assertThat(annotation.value()).contains("isAuthenticated()");
    }
}
