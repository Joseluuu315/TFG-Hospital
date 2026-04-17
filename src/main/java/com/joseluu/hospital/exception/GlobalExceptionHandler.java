package com.joseluu.hospital.exception;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Centraliza las respuestas de error para toda la API y garantiza
 * que los codigos HTTP sean consistentes.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Construye el cuerpo estandar de error.
     */
    private Map<String, Object> buildBody(HttpStatus status, String message) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", OffsetDateTime.now().toString());
        body.put("status", status.value());
        body.put("error", status.getReasonPhrase());
        body.put("message", message);
        return body;
    }

    /**
     * Recursos no encontrados -> 404.
     */
    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(NotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(buildBody(HttpStatus.NOT_FOUND, ex.getMessage()));
    }

    /**
     * Errores de validacion de @Valid en @RequestBody.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        List<Map<String, String>> errors = ex.getBindingResult().getFieldErrors().stream()
                .map(this::toFieldError)
                .collect(Collectors.toList());
        Map<String, Object> body = buildBody(HttpStatus.BAD_REQUEST, "Datos de entrada invalidos");
        body.put("errors", errors);
        return ResponseEntity.badRequest().body(body);
    }

    /**
     * Errores de validacion de @Validated en @PathVariable / @RequestParam.
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Map<String, Object>> handleConstraintViolation(ConstraintViolationException ex) {
        List<Map<String, String>> errors = ex.getConstraintViolations().stream()
                .map(this::toConstraintError)
                .collect(Collectors.toList());
        Map<String, Object> body = buildBody(HttpStatus.BAD_REQUEST, "Parametros invalidos");
        body.put("errors", errors);
        return ResponseEntity.badRequest().body(body);
    }

    /**
     * Cuerpo JSON malformado o faltante -> 400.
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleUnreadable(HttpMessageNotReadableException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(buildBody(HttpStatus.BAD_REQUEST, "Cuerpo de la peticion invalido o ausente"));
    }

    /**
     * Valores incompatibles con el tipo esperado en parametros -> 400.
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, Object>> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        String required = ex.getRequiredType() != null ? ex.getRequiredType().getSimpleName() : "tipo esperado";
        String message = "El parametro '" + ex.getName() + "' no es un " + required + " valido";
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(buildBody(HttpStatus.BAD_REQUEST, message));
    }

    /**
     * Argumentos ilegales de servicios -> 400 por defecto.
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(buildBody(HttpStatus.BAD_REQUEST, ex.getMessage()));
    }

    /**
     * Excepciones con codigo HTTP explicito (ej. AuthService).
     */
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatus(ResponseStatusException ex) {
        HttpStatus status = HttpStatus.resolve(ex.getStatusCode().value());
        if (status == null) {
            status = HttpStatus.INTERNAL_SERVER_ERROR;
        }
        String message = ex.getReason() != null ? ex.getReason() : status.getReasonPhrase();
        return ResponseEntity.status(status).body(buildBody(status, message));
    }

    private Map<String, String> toFieldError(FieldError error) {
        Map<String, String> entry = new LinkedHashMap<>();
        entry.put("field", error.getField());
        entry.put("message", error.getDefaultMessage());
        return entry;
    }

    private Map<String, String> toConstraintError(ConstraintViolation<?> violation) {
        Map<String, String> entry = new LinkedHashMap<>();
        entry.put("field", violation.getPropertyPath().toString());
        entry.put("message", violation.getMessage());
        return entry;
    }
}
