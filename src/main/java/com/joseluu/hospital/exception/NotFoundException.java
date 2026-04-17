package com.joseluu.hospital.exception;

/**
 * Excepcion lanzada cuando un recurso solicitado no existe.
 * El {@link GlobalExceptionHandler} la mapea a un HTTP 404.
 */
public class NotFoundException extends RuntimeException {
    public NotFoundException(String message) {
        super(message);
    }
}
