package com.joseluu.hospital.error;

import java.util.List;
import java.util.Map;

/**
 * Respuesta de error unificada para el API.
 */
public record ApiErrorResponse(
        String timestamp,
        int status,
        String error,
        String message,
        String path,
        Map<String, Object> details,
        List<FieldViolation> violations
) {
    public record FieldViolation(String field, String message) {}
}

