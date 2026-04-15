package com.joseluu.hospital.exception;

/**
 * Conflicto de negocio (HTTP 409).
 */
public class ConflictException extends RuntimeException {
    public ConflictException(String message) {
        super(message);
    }
}

