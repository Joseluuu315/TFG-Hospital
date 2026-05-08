package com.joseluu.hospital.controller;

import com.joseluu.hospital.service.GlobalStatsService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.prepost.PreAuthorize;

import java.lang.reflect.Method;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Tests de seguridad de AdminStatsController.
 *
 * <p>Verifican mediante reflexion que los metodos del controlador tienen
 * las anotaciones @PreAuthorize correctas. Este enfoque no requiere
 * contexto Spring y es compatible con Spring Boot 4.</p>
 */
@DisplayName("AdminStatsController — Verificacion de anotaciones @PreAuthorize")
class AdminStatsControllerSecurityTest {

    @Test
    @DisplayName("getGlobalStats debe exigir rol ROOT")
    void getGlobalStats_shouldRequireRootRole() throws NoSuchMethodException {
        Method method = AdminStatsController.class.getMethod("getGlobalStats");

        PreAuthorize annotation = method.getAnnotation(PreAuthorize.class);

        assertThat(annotation)
                .as("El metodo getGlobalStats debe tener @PreAuthorize")
                .isNotNull();
        assertThat(annotation.value())
                .as("Solo ROOT puede ver estadisticas globales")
                .contains("ROOT");
    }

    @Test
    @DisplayName("getGlobalStats no debe estar abierto a WORKER")
    void getGlobalStats_shouldNotAllowWorkerRole() throws NoSuchMethodException {
        Method method = AdminStatsController.class.getMethod("getGlobalStats");
        PreAuthorize annotation = method.getAnnotation(PreAuthorize.class);

        assertThat(annotation).isNotNull();
        // La expresion no debe permitir WORKER sin ROOT
        assertThat(annotation.value())
                .as("WORKER no debe tener acceso a stats globales")
                .doesNotContain("isAuthenticated()");
    }
}
