# Back-end (API REST)

![Java](https://img.shields.io/badge/Java-17-blue.svg) ![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.0.2-brightgreen.svg) ![MongoDB](https://img.shields.io/badge/MongoDB-blue.svg)

## Descripción

Este directorio contiene el código fuente del back-end para el proyecto **TFG-Hospital**. Se trata de una API RESTful desarrollada con **Spring Boot** que se encarga de toda la lógica de negocio, la seguridad y la persistencia de datos.

## Tecnologías Utilizadas

- **Lenguaje**: Java 17
- **Framework**: Spring Boot 4.0.2
- **Módulos de Spring**:
  - `spring-boot-starter-data-mongodb`: para la integración con la base de datos NoSQL MongoDB.
  - `spring-boot-starter-webmvc`: para la creación de controladores REST.
  - `spring-security-crypto`: para el hash de contraseñas y otras operaciones de seguridad.
- **Base de Datos**: MongoDB
- **Herramientas**:
  - **Lombok**: para reducir el código repetitivo (boilerplate).
  - **Gradle**: como gestor de dependencias y para la construcción del proyecto.

## Prerrequisitos

- JDK 17 o superior.
- Una instancia de MongoDB en ejecución.
- Gradle (el wrapper `gradlew` está incluido en el repositorio).

## Configuración

1.  **Clonar el repositorio**:
    ```bash
    git clone https://github.com/tu-usuario/TFG-Hospital.git
    cd TFG-Hospital
    ```

2.  **Configurar la base de datos**:
    Abre el archivo `src/main/resources/application.properties` (o `application.yml`) y asegúrate de que la URI de conexión a tu base de datos MongoDB es correcta:
    ```properties
    spring.data.mongodb.uri=mongodb://localhost:27017/hospital_db
    ```

## Instalación y Ejecución

1.  **Construir el proyecto**:
    Desde la raíz del proyecto (`TFG-Hospital`), ejecuta el siguiente comando para compilar el código y descargar las dependencias.
    ```bash
    ./gradlew build
    ```

2.  **Ejecutar la aplicación**:
    Puedes iniciar la aplicación usando el plugin de Spring Boot para Gradle:
    ```bash
    ./gradlew bootRun
    ```
    La API estará disponible en `http://localhost:8080`.

## Endpoints de la API

A continuación se describen algunos de los endpoints principales (puedes añadir más detalles aquí):

- `GET /api/patients`: Obtiene una lista de todos los pacientes.
- `POST /api/patients`: Crea un nuevo paciente.
- `GET /api/appointments`: Obtiene una lista de todas las citas.
- `POST /api/appointments`: Crea una nueva cita.
- `GET /api/doctors`: Obtiene una lista de todos los médicos.
- `POST /api/doctors`: Crea un nuevo médico
