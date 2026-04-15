package com.joseluu.hospital.exception;

/**
 * Acceso prohibido (HTTP 403).
 */
public class ForbiddenException extends RuntimeException {
    public ForbiddenException(String message) {
        super(message);
    }
}

