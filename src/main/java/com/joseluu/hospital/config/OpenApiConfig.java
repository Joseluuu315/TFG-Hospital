package com.joseluu.hospital.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.servers.Server;
import org.springframework.context.annotation.Configuration;

/**
 * Configuracion de Swagger / OpenAPI para el TFG-Hospital.
 *
 * <p>Accesible en: <a href="http://localhost:8080/swagger-ui.html">swagger-ui.html</a></p>
 *
 * <p>Para autenticarte en Swagger UI:
 * <ol>
 *   <li>Llama a {@code POST /api/auth/login} con tus credenciales.</li>
 *   <li>Copia el {@code accessToken} de la respuesta.</li>
 *   <li>Haz clic en "Authorize" (candado) e introduce {@code Bearer &lt;token&gt;}.</li>
 * </ol>
 */
@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "TFG-Hospital API",
                version = "1.0",
                description = "API REST del sistema de gestion hospitalaria — Trabajo de Fin de Grado. "
                        + "Incluye gestion de usuarios, turnos, nominas, chat interno y solicitudes de ausencia.",
                contact = @Contact(name = "Jose Luis Fuentes", email = "support@averonix.org")
        ),
        servers = {
                @Server(url = "http://localhost:8080", description = "Desarrollo local"),
                @Server(url = "https://api.tudominio.com", description = "Produccion VPS")
        },
        security = @SecurityRequirement(name = "bearerAuth")
)
@SecurityScheme(
        name = "bearerAuth",
        type = SecuritySchemeType.HTTP,
        scheme = "bearer",
        bearerFormat = "JWT",
        description = "Token de acceso obtenido en POST /api/auth/login. Formato: Bearer <token>"
)
public class OpenApiConfig {
    // La configuracion se declara via anotaciones; no se necesita logica adicional.
}
