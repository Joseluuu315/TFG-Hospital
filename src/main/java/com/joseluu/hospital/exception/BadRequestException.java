package com.joseluu.hospital.exception;

/**
 * Error de entrada del cliente (HTTP 400).
 */
public class BadRequestException extends RuntimeException {
    public BadRequestException(String message) {
        super(message);
    }
}

