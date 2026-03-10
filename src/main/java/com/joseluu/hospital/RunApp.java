package com.joseluu.hospital;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Punto de entrada principal de la aplicación Spring Boot.
 */
@SpringBootApplication
public class RunApp {
    /**
     * Arranca el contexto de Spring y expone la API HTTP.
     */
    public static void main(String[] args) {
        SpringApplication.run(RunApp.class, args);
    }
}
