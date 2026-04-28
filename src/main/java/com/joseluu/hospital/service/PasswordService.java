package com.joseluu.hospital.service;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Gestiona el hash y la validacion de contrasenas.
 */
@Service
public class PasswordService {
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

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
        if (isEncoded(storedPassword)) {
            return passwordEncoder.matches(rawPassword, storedPassword);
        }
        return rawPassword.equals(storedPassword);
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

    private boolean isEncoded(String value) {
        return value.startsWith("$2a$") || value.startsWith("$2b$") || value.startsWith("$2y$");
    }
}
