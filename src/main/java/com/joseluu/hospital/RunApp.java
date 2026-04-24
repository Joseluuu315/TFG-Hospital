package com.joseluu.hospital;

import com.mongodb.MongoClientSettings;
import com.mongodb.client.MongoClient;
import com.mongodb.connection.ClusterDescription;
import com.mongodb.connection.ServerDescription;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.EnumerablePropertySource;
import org.springframework.core.env.PropertySource;

/**
 * Punto de entrada principal de la aplicación Spring Boot.
 */
@SpringBootApplication
public class RunApp {

    public static void main(String[] args) {
        ConfigurableApplicationContext context = SpringApplication.run(RunApp.class, args);
        ConfigurableEnvironment env = context.getEnvironment();

        System.out.println("\n╔══════════════════════════════════════════════════════╗");
        System.out.println(  "║         MONGODB DEBUG - ANÁLISIS COMPLETO DE CONEXIÓN ║");
        System.out.println(  "╚══════════════════════════════════════════════════════╝");

        // ── 1. Propiedades resueltas y su origen ──────────────────────────────
        String[] propiedades = {
                "spring.data.mongodb.uri",
                "spring.data.mongodb.host",
                "spring.data.mongodb.port",
                "spring.data.mongodb.database"
        };

        System.out.println("\n▶ VALORES ACTIVOS EN ENVIRONMENT:");
        for (String prop : propiedades) {
            String valor = env.getProperty(prop);
            System.out.printf("  %-40s = %s%n", prop, valor != null ? valor : "(no definida)");
        }

        System.out.println("\n▶ ORIGEN DE CADA PROPIEDAD:");
        for (PropertySource<?> source : env.getPropertySources()) {
            if (source instanceof EnumerablePropertySource<?> eps) {
                for (String prop : propiedades) {
                    if (eps.containsProperty(prop)) {
                        System.out.printf("  %-40s → [%s]%n  %-40s   valor: %s%n",
                                prop, source.getName(), "", eps.getProperty(prop));
                    }
                }
            }
        }

        // ── 2. ¡CLAVE! Inspeccionar el MongoClient REAL que Spring construyó ──
        System.out.println("\n▶ CONEXIÓN REAL DEL MONGOCLIENT (lo que Spring realmente usa):");
        try {
            MongoClient mongoClient = context.getBean(MongoClient.class);
            ClusterDescription cluster = mongoClient.getClusterDescription();

            System.out.println("  Tipo de cluster    : " + cluster.getType());
            System.out.println("  Servidores conectados:");

            for (ServerDescription server : cluster.getServerDescriptions()) {
                System.out.println("  ┌─────────────────────────────────────────");
                System.out.println("  │  Host      : " + server.getAddress().getHost());
                System.out.println("  │  Puerto    : " + server.getAddress().getPort());
                System.out.println("  │  Estado    : " + server.getState());
                System.out.println("  │  Tipo      : " + server.getType());
                System.out.println("  └─────────────────────────────────────────");
            }

        } catch (Exception e) {
            System.out.println("  ❌ Error al obtener MongoClient: " + e.getMessage());
        }

        // ── 3. Variables de entorno del sistema que puedan sobreescribir ──────
        System.out.println("\n▶ VARIABLES DE ENTORNO DEL SISTEMA (posibles sobreescrituras):");
        String[] envVars = {
                "SPRING_DATA_MONGODB_URI",
                "SPRING_DATA_MONGODB_HOST",
                "SPRING_DATA_MONGODB_PORT",
                "SPRING_DATA_MONGODB_DATABASE",
                "MONGODB_URI",
                "MONGO_URI"
        };
        boolean hayVarsEntorno = false;
        for (String var : envVars) {
            String val = System.getenv(var);
            if (val != null) {
                System.out.println("  ⚠️  " + var + " = " + val);
                hayVarsEntorno = true;
            }
        }
        if (!hayVarsEntorno) {
            System.out.println("  ✅ Ninguna variable de entorno sobreescribe MongoDB");
        }

        // ── 4. Perfil activo ──────────────────────────────────────────────────
        String[] perfiles = env.getActiveProfiles();
        System.out.println("\n▶ PERFILES ACTIVOS: " +
                (perfiles.length > 0 ? String.join(", ", perfiles) : "(ninguno → default)"));

        // ── 5. Todas las fuentes cargadas ─────────────────────────────────────
        System.out.println("\n▶ TODAS LAS FUENTES DE CONFIGURACIÓN:");
        for (PropertySource<?> source : env.getPropertySources()) {
            System.out.println("  - " + source.getName());
        }

        System.out.println("\n══════════════════════════════════════════════════════\n");
    }
}