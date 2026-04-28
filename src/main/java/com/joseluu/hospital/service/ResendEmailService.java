package com.joseluu.hospital.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Envia correos transaccionales mediante la API HTTP de Resend.
 */
@Service
public class ResendEmailService {
    private static final String RESEND_ENDPOINT = "https://api.resend.com/emails";
    private static final Pattern MESSAGE_PATTERN = Pattern.compile("\"message\"\\s*:\\s*\"([^\"]+)\"");

    private final HttpClient httpClient;
    private final String apiKey;
    private final String from;

    public ResendEmailService(@Value("${app.mail.resend.api-key:}") String apiKey,
                              @Value("${app.mail.from}") String from) {
        this.httpClient = HttpClient.newHttpClient();
        this.apiKey = apiKey;
        this.from = from;
    }

    /**
     * Envia el email de recuperacion con el enlace de restablecimiento.
     */
    public void sendPasswordResetEmail(String recipientEmail, String recipientName, String resetLink) {
        ensureConfigured();
        String payload = """
                {
                  "from":"%s",
                  "to":["%s"],
                  "subject":"Restablece tu contrasena",
                  "html":"%s",
                  "text":"%s"
                }
                """.formatted(
                escapeJson(from),
                escapeJson(recipientEmail),
                escapeJson(buildHtml(recipientName, resetLink)),
                escapeJson(buildText(recipientName, resetLink))
        );

        try {
            HttpRequest request = HttpRequest.newBuilder(URI.create(RESEND_ENDPOINT))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .header("User-Agent", "TFG-Hospital/1.0")
                    .POST(HttpRequest.BodyPublishers.ofString(payload))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 400) {
                throw new ResponseStatusException(
                        HttpStatus.INTERNAL_SERVER_ERROR,
                        "No se pudo enviar el correo de recuperacion: " + extractError(response.body())
                );
            }
        } catch (IOException | InterruptedException exception) {
            if (exception instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "No se pudo enviar el correo de recuperacion"
            );
        }
    }

    private void ensureConfigured() {
        if (apiKey == null || apiKey.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Resend no esta configurado. Define app.mail.resend.api-key."
            );
        }
    }

    private String extractError(String responseBody) {
        if (responseBody != null) {
            Matcher matcher = MESSAGE_PATTERN.matcher(responseBody);
            if (matcher.find()) {
                return matcher.group(1);
            }
        }
        return responseBody == null || responseBody.isBlank() ? "respuesta vacia del proveedor" : responseBody;
    }

    private String escapeJson(String value) {
        return value
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\r", "\\r")
                .replace("\n", "\\n");
    }

    private String buildHtml(String recipientName, String resetLink) {
        String safeName = recipientName == null || recipientName.isBlank() ? "usuario" : recipientName;
        return """
                <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;max-width:560px;margin:0 auto;padding:24px">
                  <h2 style="margin:0 0 16px">Restablecimiento de contrasena</h2>
                  <p>Hola %s,</p>
                  <p>Hemos recibido una solicitud para restablecer la contrasena de tu cuenta.</p>
                  <p>
                    <a href="%s" style="display:inline-block;padding:12px 20px;background:#111827;color:#ffffff;text-decoration:none;border-radius:8px">
                      Restablecer contrasena
                    </a>
                  </p>
                  <p>Si no has solicitado este cambio, puedes ignorar este correo.</p>
                  <p>El enlace caduca en 60 minutos.</p>
                </div>
                """.formatted(safeName, resetLink);
    }

    private String buildText(String recipientName, String resetLink) {
        String safeName = recipientName == null || recipientName.isBlank() ? "usuario" : recipientName;
        return """
                Hola %s,

                Hemos recibido una solicitud para restablecer la contrasena de tu cuenta.

                Usa este enlace para continuar:
                %s

                Si no has solicitado este cambio, puedes ignorar este correo.
                El enlace caduca en 60 minutos.
                """.formatted(safeName, resetLink);
    }
}
