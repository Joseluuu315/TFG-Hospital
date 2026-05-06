package com.joseluu.hospital.service;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;

/**
 * Gestiona el hash y la validacion de contrasenas.
 */
@Service
public class PasswordService {
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private static final String ALLOWED_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%_";
    private final SecureRandom secureRandom = new SecureRandom();

    /**
     * Devuelve la contrasena en hash BCrypt.
     */
    public String encode(String rawPassword) {
        return passwordEncoder.encode(rawPassword);
    }

    /**
     * Valida una contrasena contra el valor almacenado.
     */
    public boolean matches(String rawPassword, String storedPassword) {
        if (rawPassword == null || storedPassword == null) {
            return false;
        }
        return isEncoded(storedPassword) && passwordEncoder.matches(rawPassword, storedPassword);
    }

    /**
     * Indica si el valor guardado debe migrarse a hash.
     */
    public boolean needsMigration(String storedPassword) {
        return storedPassword != null && !isEncoded(storedPassword);
    }

    /**
     * Aplica hash solo cuando aun no esta codificada.
     */
    public String encodeIfNeeded(String password) {
        if (password == null || password.isBlank() || isEncoded(password)) {
            return password;
        }
        return encode(password);
    }

    /**
     * Genera una contrasena temporal legible para altas iniciales.
     */
    public String generateTemporaryPassword() {
        StringBuilder builder = new StringBuilder(14);
        for (int index = 0; index < 14; index++) {
            int charIndex = secureRandom.nextInt(ALLOWED_CHARS.length());
            builder.append(ALLOWED_CHARS.charAt(charIndex));
        }
        return builder.toString();
    }

    private boolean isEncoded(String value) {
        return value.startsWith("$2a$") || value.startsWith("$2b$") || value.startsWith("$2y$");
    }
}
