package com.joseluu.hospital.error;

import com.joseluu.hospital.exception.BadRequestException;
import com.joseluu.hospital.exception.ConflictException;
import com.joseluu.hospital.exception.ForbiddenException;
import com.joseluu.hospital.exception.NotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Centraliza el mapeo de excepciones a respuestas HTTP consistentes.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleNotFound(NotFoundException ex, HttpServletRequest request) {
        return build(HttpStatus.NOT_FOUND, ex.getMessage(), request, null, null);
    }

    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<ApiErrorResponse> handleForbidden(ForbiddenException ex, HttpServletRequest request) {
        return build(HttpStatus.FORBIDDEN, ex.getMessage(), request, null, null);
    }

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ApiErrorResponse> handleConflict(ConflictException ex, HttpServletRequest request) {
        return build(HttpStatus.CONFLICT, ex.getMessage(), request, null, null);
    }

    @ExceptionHandler({BadRequestException.class, IllegalArgumentException.class})
    public ResponseEntity<ApiErrorResponse> handleBadRequest(RuntimeException ex, HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, ex.getMessage(), request, null, null);
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiErrorResponse> handleResponseStatus(ResponseStatusException ex, HttpServletRequest request) {
        HttpStatus status = HttpStatus.resolve(ex.getStatusCode().value());
        if (status == null) {
            status = HttpStatus.INTERNAL_SERVER_ERROR;
        }
        String message = ex.getReason() != null ? ex.getReason() : ex.getMessage();
        return build(status, message, request, null, null);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        List<ApiErrorResponse.FieldViolation> violations = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(this::toViolation)
                .toList();

        Map<String, Object> details = new HashMap<>();
        details.put("validationError", true);
        details.put("errorCount", violations.size());

        return build(HttpStatus.BAD_REQUEST, "Solicitud invalida", request, details, violations);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiErrorResponse> handleUnreadable(HttpMessageNotReadableException ex, HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, "Cuerpo JSON invalido o mal formado", request, null, null);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleUnhandled(Exception ex, HttpServletRequest request) {
        // No exponemos el mensaje real por defecto para evitar filtrar detalles internos.
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "Error interno del servidor", request, null, null);
    }

    private ApiErrorResponse.FieldViolation toViolation(FieldError error) {
        String field = error.getField();
        String message = error.getDefaultMessage() != null ? error.getDefaultMessage() : "Valor invalido";
        return new ApiErrorResponse.FieldViolation(field, message);
    }

    private ResponseEntity<ApiErrorResponse> build(HttpStatus status,
                                                   String message,
                                                   HttpServletRequest request,
                                                   Map<String, Object> details,
                                                   List<ApiErrorResponse.FieldViolation> violations) {
        ApiErrorResponse payload = new ApiErrorResponse(
                OffsetDateTime.now(ZoneOffset.UTC).toString(),
                status.value(),
                status.getReasonPhrase(),
                message,
                request != null ? request.getRequestURI() : null,
                details,
                violations
        );
        return ResponseEntity.status(status).body(payload);
    }
}

