# Documento tecnico completo - TFG-Hospital

## Indice

1. Datos del Proyecto
2. Resumen
   2.1. Resumen
3. Introduccion y Justificacion
   3.1. Introduccion
   3.2. Justificacion del Proyecto
4. Objetivos
   4.1. Objetivo General
   4.2. Objetivos Especificos
5. Analisis del Problema y Requisitos
   5.1. Analisis del Problema
   5.2. Requisitos Funcionales (RF)
   5.3. Requisitos No Funcionales (RNF)
6. Diseno Tecnico
   6.1. Arquitectura del Sistema
   6.2. Diseno de Base de Datos
   6.2.1. Entidades y Relaciones
   6.3. Diseno de Interfaz de Usuario (UI)
7. Tecnologias Utilizadas
8. Desarrollo e Implementacion
   8.1. Estructura de Modulos
   8.2. Modulos principales del sistema
9. Seguridad y Validaciones
   9.1. Seguridad y Control de Acceso
   9.2. Validaciones
10. Persistencia y Entorno de Ejecucion
    10.1. Persistencia
    10.2. Entorno de Ejecucion
11. Pruebas y Limitaciones
    11.1. Pruebas Realizadas
    11.2. Limitaciones del Proyecto
12. Conclusiones y Lineas de Mejora
    12.1. Conclusiones
    12.2. Lineas de Mejora Futuras
13. Referencias
    13.1. Bibliografia

## 1. Datos del Proyecto

| Campo | Valor |
| --- | --- |
| Nombre del proyecto | TFG-Hospital |
| Tipo de proyecto | Aplicacion web full stack para la gestion operativa de hospitales |
| Repositorio GitHub | <https://github.com/Joseluuu315/TFG-Hospital> |
| Backend | Java 17, Spring Boot 4.0.2, MongoDB |
| Frontend | Next.js 16.1.6, React 19.2.4, TypeScript |
| Base de datos | MongoDB |
| Roles principales | ROOT, HOSPITAL_ADMIN, WORKER |
| Entorno local | Backend en `http://localhost:8080` y frontend en `http://localhost:3000` |
| Despliegue previsto | VPS con backend Spring Boot, frontend Next.js y configuracion mediante variables de entorno |

## 2. Resumen

### 2.1. Resumen

`TFG-Hospital` es una aplicacion web orientada a centralizar la gestion interna de hospitales. El proyecto combina una API REST desarrollada con Spring Boot y un frontend moderno construido con Next.js, React y TypeScript. La informacion se almacena en MongoDB y se organiza mediante documentos por dominio.

El sistema no se limita a una gestion basica de usuarios. Incluye administracion de hospitales, trabajadores, calendarios, ausencias, nominas, turnos, contratos, chat interno, grupos de trabajo, notificaciones, auditoria, seguridad con tokens persistidos y documentacion de API mediante Swagger/OpenAPI.

La aplicacion esta pensada para tres perfiles. El usuario `ROOT` administra la plataforma y los hospitales registrados. El usuario `HOSPITAL_ADMIN` gestiona la operativa de un hospital concreto. El usuario `WORKER` consulta su calendario, solicita ausencias, revisa nominas y participa en la comunicacion interna.

## 3. Introduccion y Justificacion

### 3.1. Introduccion

La gestion hospitalaria requiere coordinar informacion administrativa, laboral y operativa de forma continua. En un hospital se gestionan trabajadores, turnos, ausencias, nominas, comunicaciones internas, incidencias y decisiones de administracion. Si estos procesos se reparten entre hojas de calculo, correos y herramientas aisladas, aumenta el riesgo de errores, duplicidades y falta de trazabilidad.

`TFG-Hospital` nace como una solucion academica pero realista para integrar estos procesos en una sola plataforma. La aplicacion plantea una arquitectura separada entre backend y frontend, con una API centralizada y una interfaz organizada por paneles segun el rol del usuario.

### 3.2. Justificacion del Proyecto

El proyecto se justifica por la necesidad de digitalizar procesos internos que suelen ser repetitivos y sensibles. La planificacion de turnos, el control de ausencias y el calculo de nominas requieren reglas claras, datos consistentes y capacidad de consulta.

El sistema aporta valor porque:

- centraliza la informacion del hospital y sus trabajadores;
- facilita la gestion de ausencias, contratos y nominas;
- permite configurar reglas operativas de turnos;
- ayuda a repartir turnos mediante autoasignacion;
- mejora la comunicacion interna con chats y grupos;
- incorpora trazabilidad mediante logs de auditoria;
- esta preparado para despliegue en VPS y mantenimiento desde GitHub.

## 4. Objetivos

### 4.1. Objetivo General

Desarrollar una aplicacion web full stack para gestionar la operativa de hospitales desde una plataforma centralizada, segura y extensible, separando claramente la API REST del backend y la interfaz de usuario del frontend.

### 4.2. Objetivos Especificos

- implementar autenticacion con tokens Bearer y refresh token;
- persistir sesiones de usuario en MongoDB mediante hashes;
- proteger contrasenas con BCrypt;
- ofrecer recuperacion de contrasena mediante token temporal y correo;
- gestionar hospitales, estados y anuncios internos;
- gestionar trabajadores, perfiles, calendarios y contratos;
- registrar y revisar solicitudes de ausencia;
- definir configuracion operativa por hospital;
- crear tipos de turno, demandas y asignaciones;
- calcular nominas basadas en contratos, turnos, ausencias y ajustes;
- permitir chats, grupos de trabajo y notificaciones;
- registrar acciones sensibles mediante auditoria;
- documentar endpoints con Swagger/OpenAPI;
- preparar el proyecto para repositorio remoto y despliegue en VPS.

## 5. Analisis del Problema y Requisitos

### 5.1. Analisis del Problema

El problema principal es la dispersion de informacion en la gestion diaria de un hospital. Un administrador necesita conocer trabajadores disponibles, ausencias, demandas de cobertura, turnos asignados, nominas generadas y comunicaciones internas. Al mismo tiempo, cada trabajador necesita acceder a su informacion personal, calendario, nominas y solicitudes.

La solucion propuesta divide el sistema en dominios funcionales. Cada modulo resuelve una parte del problema y se conecta con el resto mediante identificadores compartidos. Por ejemplo, una nomina se calcula a partir del trabajador, su contrato, sus turnos y sus ausencias; una demanda de turno se convierte en asignaciones; una accion administrativa puede crear una notificacion y un registro de auditoria.

### 5.2. Requisitos Funcionales (RF)

- RF1. El sistema debe permitir iniciar sesion con email y contrasena.
- RF2. El sistema debe generar `accessToken` y `refreshToken`.
- RF3. El sistema debe permitir cerrar sesion invalidando tokens.
- RF4. El sistema debe permitir recuperar contrasena mediante correo y token temporal.
- RF5. El usuario `ROOT` debe poder gestionar hospitales y consultar estadisticas globales.
- RF6. El usuario `HOSPITAL_ADMIN` debe poder gestionar trabajadores de su hospital.
- RF7. El usuario `WORKER` debe poder consultar y modificar parte de su perfil.
- RF8. El sistema debe permitir crear, revisar y listar solicitudes de ausencia.
- RF9. El sistema debe permitir registrar eventos de calendario.
- RF10. El sistema debe permitir configurar reglas operativas del hospital.
- RF11. El sistema debe permitir crear tipos de turno.
- RF12. El sistema debe permitir crear demandas de cobertura por fecha y departamento.
- RF13. El sistema debe permitir asignar turnos manualmente.
- RF14. El sistema debe permitir autoasignar turnos segun reglas de negocio.
- RF15. El sistema debe permitir crear y consultar contratos laborales.
- RF16. El sistema debe permitir generar nominas y descargar PDF.
- RF17. El sistema debe permitir generar nomina avanzada con lineas de detalle.
- RF18. El sistema debe permitir crear chats, mensajes y grupos de trabajo.
- RF19. El sistema debe emitir notificaciones funcionales.
- RF20. El sistema debe guardar logs de auditoria.
- RF21. El sistema debe exponer documentacion de API mediante Swagger UI.

### 5.3. Requisitos No Funcionales (RNF)

- RNF1. El backend debe exponer una API REST clara y organizada.
- RNF2. El frontend debe ofrecer una interfaz web responsive.
- RNF3. El codigo debe mantener separacion por capas.
- RNF4. La configuracion sensible debe mantenerse fuera del repositorio.
- RNF5. El sistema debe permitir despliegue en VPS usando variables de entorno.
- RNF6. Las contrasenas no deben almacenarse en texto plano.
- RNF7. Los tokens persistidos no deben guardarse en claro, sino hasheados.
- RNF8. El proyecto debe poder versionarse y mantenerse desde GitHub.
- RNF9. La base de datos debe soportar un modelo flexible de documentos.
- RNF10. La aplicacion debe poder ejecutarse localmente para desarrollo y pruebas.

## 6. Diseno Tecnico

### 6.1. Arquitectura del Sistema

La arquitectura se divide en dos aplicaciones principales:

- backend REST con Spring Boot;
- frontend web con Next.js.

El backend se encuentra en `src/main/java/com/joseluu/hospital` y sigue una organizacion por capas:

- `controller`: recibe peticiones HTTP y expone endpoints;
- `service`: concentra la logica de negocio;
- `repository`: accede a MongoDB con Spring Data;
- `entity`: define documentos persistidos;
- `dto`: define contratos de entrada y salida;
- `security`: configura autenticacion y filtros Bearer;
- `exception` y `error`: centralizan errores de API;
- `config`: agrupa configuraciones como OpenAPI.

El frontend se encuentra en `front-end` y usa App Router de Next.js. Su estructura principal es:

- `app/`: rutas y paginas;
- `components/`: componentes de UI y componentes de dominio;
- `contexts/`: estado global, especialmente autenticacion;
- `lib/`: cliente HTTP, tipos y utilidades.

La integracion entre frontend y backend se hace mediante llamadas a `/api/*`. En desarrollo, `next.config.mjs` reescribe estas rutas hacia `http://localhost:8080/api/*`.

### 6.2. Diseno de Base de Datos

La persistencia usa MongoDB. Cada area funcional tiene colecciones propias. Las colecciones principales son:

- `users`;
- `auth_sessions`;
- `hospitals`;
- `leave_requests`;
- `hospital_settings`;
- `shift_types`;
- `shift_requirements`;
- `shift_assignments`;
- `worker_contracts`;
- `payrolls`;
- `payroll_items`;
- `payroll_adjustments`;
- `chats`;
- `chat_messages`;
- `work_groups`;
- `notifications`;
- `audit_logs`.

### 6.2.1. Entidades y Relaciones

Aunque MongoDB no impone claves foraneas como una base relacional, el dominio mantiene relaciones logicas claras:

- un hospital agrupa trabajadores, anuncios, configuracion, turnos y chats;
- un usuario pertenece a un hospital cuando su rol lo requiere;
- un trabajador puede tener contrato activo, ausencias, calendario, turnos y nominas;
- una demanda de turno puede generar varias asignaciones;
- una nomina puede tener lineas de detalle y ajustes manuales;
- un chat contiene mensajes y puede estar ligado a un grupo;
- una accion relevante puede generar notificacion y auditoria;
- una sesion de autenticacion queda vinculada a un usuario mediante `auth_sessions`.

### 6.3. Diseno de Interfaz de Usuario (UI)

La interfaz se organiza en paneles por rol:

- `/dashboard/root`: administracion global;
- `/dashboard/admin`: administracion hospitalaria;
- `/dashboard/worker`: area del trabajador;
- `/dashboard/settings`: configuracion de perfil.

Rutas destacadas del frontend:

- `/login`;
- `/reset-password`;
- `/dashboard/root/hospitals`;
- `/dashboard/root/stats`;
- `/dashboard/root/support`;
- `/dashboard/admin/workers`;
- `/dashboard/admin/announcements`;
- `/dashboard/admin/leave-requests`;
- `/dashboard/admin/payrolls`;
- `/dashboard/admin/operations`;
- `/dashboard/admin/chat`;
- `/dashboard/admin/audit`;
- `/dashboard/worker/calendar`;
- `/dashboard/worker/leave-requests`;
- `/dashboard/worker/payrolls`;
- `/dashboard/worker/chat`.

La UI utiliza Tailwind CSS, Radix UI, componentes tipo shadcn, iconos de Lucide, tablas, formularios, dialogos, notificaciones con Sonner y componentes reutilizables para el layout del dashboard.

## 7. Tecnologias Utilizadas

### Backend

- Java 17.
- Spring Boot 4.0.2.
- Spring Web MVC.
- Spring Data MongoDB.
- Spring Security.
- Spring Validation.
- Spring Actuator.
- Springdoc OpenAPI / Swagger UI.
- Lombok.
- Gradle.
- JUnit 5, Mockito y MockMvc para pruebas.

### Frontend

- Next.js 16.1.6.
- React 19.2.4.
- TypeScript 5.7.3.
- Tailwind CSS 4.
- Radix UI / shadcn UI.
- Axios.
- SWR.
- React Hook Form.
- Zod.
- Sonner.
- Lucide React.
- Recharts.

### Infraestructura y herramientas

- MongoDB.
- Git y GitHub.
- VPS para despliegue.
- Variables de entorno y `config/application-secrets.properties` para secretos.
- Swagger UI en `/swagger-ui.html`.
- Health check en `/actuator/health`.

## 8. Desarrollo e Implementacion

### 8.1. Estructura de Modulos

Los modulos principales del proyecto son:

- autenticacion y recuperacion de contrasena;
- administracion global y hospitales;
- usuarios, trabajadores y perfil;
- calendario y ausencias;
- configuracion hospitalaria;
- turnos y operaciones;
- contratos laborales;
- nomina basica y avanzada;
- chat, grupos y soporte;
- notificaciones;
- auditoria;
- documentacion OpenAPI.

### 8.2. Modulos principales del sistema

#### Autenticacion y sesion

`AuthService` valida credenciales, genera tokens y crea sesiones persistidas en `auth_sessions`. Los tokens se entregan al cliente en claro, pero se guardan en MongoDB como hash SHA-256. El access token tiene caducidad configurable y el refresh token permite renovar sesion. El logout elimina la sesion asociada al token.

El sistema tambien permite recuperar contrasena. Para ello genera un token temporal, guarda su hash en el usuario y envia un enlace de recuperacion con la URL base definida en `FRONTEND_BASE_URL`.

#### Hospitales y administracion global

`HospitalsController` y `HospitalService` permiten crear, listar, editar, suspender y eliminar hospitales. Tambien gestionan anuncios internos. `AdminStatsController` ofrece metricas globales para el perfil `ROOT`.

#### Usuarios y trabajadores

`UsersController` permite listar usuarios, obtener detalle, crear trabajadores, editar datos y gestionar calendario. Los trabajadores incluyen datos personales, hospital asociado, departamento, puesto, salario base, estado de cuenta y eventos de calendario.

#### Ausencias

`LeaveRequestsController` y `LeaveRequestService` gestionan solicitudes de ausencia. Un trabajador puede solicitarlas y un administrador puede revisarlas. Las ausencias pueden ser pagadas o no pagadas, lo que afecta a la nomina avanzada.

#### Operaciones y turnos

`SchedulingService` gestiona demandas de turno, asignaciones manuales y autoasignacion. El algoritmo tiene en cuenta solapes, descanso minimo, horas semanales, departamento y una puntuacion de reparto de carga basada en horas, fines de semana y noches.

#### Configuracion hospitalaria

`HospitalSettingsService` define reglas por hospital: horas semanales maximas, descanso minimo, dias consecutivos maximos, noches consecutivas maximas, peso de reparto, plus nocturno, plus festivo y multiplicador de horas extra.

#### Contratos y nominas

`WorkerContractService` mantiene el contrato activo de cada trabajador. `AdvancedPayrollService` genera nominas a partir del contrato, los turnos, ausencias y ajustes manuales. Las nominas se guardan en `payrolls` y sus conceptos en `payroll_items`. `PayrollService` permite descarga de PDF.

#### Chat, grupos, notificaciones y auditoria

El sistema soporta chats privados, chats de hospital, chats de grupo y chats de soporte. Los grupos de trabajo tienen chat asociado. Las notificaciones avisan sobre acciones relevantes y `AuditLogService` registra operaciones sensibles para trazabilidad.

#### Datos semilla

`DataSeeder` prepara un entorno demo si las colecciones estan vacias. Crea hospital, usuarios base, trabajadores, contratos, turnos, ausencias, nominas, chats y grupos. Las credenciales de demo son:

- `superadmin@trassierra.com` / `admin123`;
- `admin@hospital-reina-sofia.com` / `admin123`;
- `trabajador1@hospital-reina-sofia.com` / `worker123`;
- `trabajador2@hospital-reina-sofia.com` / `worker123`;
- `trabajador3@hospital-reina-sofia.com` / `worker123`.

## 9. Seguridad y Validaciones

### 9.1. Seguridad y Control de Acceso

La seguridad se basa en Spring Security con API stateless. `SecurityConfig` desactiva CSRF para la API, publica solo rutas concretas y exige autenticacion para el resto. Las rutas publicas principales son:

- `/api/auth/login`;
- `/api/auth/refresh`;
- `/api/auth/forgot-password`;
- `/api/auth/reset-password`;
- `/actuator/health`;
- `/v3/api-docs/**`;
- `/swagger-ui/**`;
- `/swagger-ui.html`.

`BearerTokenAuthenticationFilter` lee `Authorization: Bearer <token>`, valida la sesion persistida y carga el usuario autenticado en el contexto de seguridad. `AuthenticatedUserPrincipal` expone el usuario y su rol como autoridad `ROLE_*`.

Las contrasenas se guardan con BCrypt mediante `PasswordService`. Los tokens de sesion y recuperacion se almacenan hasheados. Al restablecer contrasena se invalidan sesiones previas del usuario.

### 9.2. Validaciones

El proyecto usa `spring-boot-starter-validation` y DTOs con validaciones `jakarta.validation`. Ademas, los servicios aplican reglas de negocio como:

- email y contrasena obligatorios en login;
- refresh token obligatorio para renovacion;
- pertenencia de trabajadores al hospital correspondiente;
- contrato activo requerido para nomina avanzada;
- control de solapes al asignar turnos;
- respeto de descanso minimo y horas semanales en autoasignacion;
- gestion de errores mediante excepciones propias y `GlobalExceptionHandler`.

En frontend, los formularios usan TypeScript, Zod, React Hook Form y feedback visual con Sonner para mejorar la experiencia y reducir errores de entrada.

## 10. Persistencia y Entorno de Ejecucion

### 10.1. Persistencia

MongoDB es la base de datos principal. La configuracion se define en `src/main/resources/application.properties`, pero las credenciales no deben estar en el repositorio. El proyecto esta preparado para leer:

- `MONGODB_URI`;
- `MONGODB_DATABASE`;
- `SERVER_PORT`;
- `FRONTEND_BASE_URL`;
- `MAIL_FROM`;
- `RESEND_API_KEY`.

Para desarrollo local existe la plantilla `config/application-secrets.properties.example`. El fichero real `config/application-secrets.properties` queda fuera de Git y se usa para secretos locales.

En un VPS, lo recomendable es definir las variables mediante un fichero protegido, por ejemplo `/etc/tfg-hospital/secrets.env`, y cargarlo desde `systemd`.

Ejemplo orientativo:

```ini
[Service]
EnvironmentFile=/etc/tfg-hospital/secrets.env
ExecStart=/usr/bin/java -jar /opt/tfg-hospital/backend/TFG-Hospital.jar
Restart=always
```

### 10.2. Entorno de Ejecucion

#### Ejecucion local del backend

Desde la raiz del repositorio:

```powershell
.\gradlew.bat bootRun
```

La API escucha por defecto en:

- `http://localhost:8080`.

#### Ejecucion local del frontend

Desde `front-end`:

```powershell
npm install
npm run dev
```

La interfaz escucha por defecto en:

- `http://localhost:3000`.

#### Repositorio de GitHub

El proyecto esta versionado en:

- <https://github.com/Joseluuu315/TFG-Hospital>

El remoto local configurado es:

- `origin https://github.com/Joseluuu315/TFG-Hospital.git`

GitHub se usa como punto central para:

- conservar historico del codigo;
- compartir el proyecto;
- documentar incidencias y mejoras mediante plantillas en `.github/ISSUE_TEMPLATE`;
- facilitar despliegues en VPS mediante clonacion o pull del repositorio.

#### Despliegue en VPS

El despliegue en VPS se plantea separando backend, frontend y secretos:

- el backend se compila con Gradle y se ejecuta como servicio Java;
- el frontend se instala y compila con npm, y se ejecuta con `npm run start` o se sirve detras de un proxy;
- MongoDB puede estar en Atlas o en una instancia externa;
- los secretos se inyectan por variables de entorno;
- un proxy como Nginx puede exponer dominio publico, HTTPS y redireccionar `/api` al backend.

Flujo de despliegue recomendado:

1. clonar el repositorio desde GitHub en el VPS;
2. configurar variables de entorno y secretos;
3. compilar backend con `.\gradlew.bat build` en Windows o `./gradlew build` en Linux;
4. compilar frontend con `npm install` y `npm run build`;
5. levantar backend con `systemd`;
6. levantar frontend con `npm run start` o gestor de procesos;
7. configurar Nginx y HTTPS;
8. verificar `/actuator/health` y `/swagger-ui.html`.

## 11. Pruebas y Limitaciones

### 11.1. Pruebas Realizadas

El proyecto incluye pruebas automatizadas en `src/test`:

- `AuthServiceTest`;
- `AdminStatsControllerSecurityTest`;
- `UsersControllerSecurityTest`.

Estas pruebas cubren puntos de autenticacion y seguridad de controladores. Ademas, el proyecto dispone de comandos de verificacion:

```powershell
.\gradlew.bat build
```

```powershell
cd front-end
npm run lint
npm run build
```

En revisiones anteriores el backend se valido con `.\gradlew.bat build`. Para una entrega final conviene ejecutar de nuevo backend y frontend en el entorno donde se vaya a entregar o desplegar.

### 11.2. Limitaciones del Proyecto

- la autorizacion fina por rol puede reforzarse con reglas por endpoint y anotaciones mas especificas;
- el PDF de nomina es funcional, pero puede mejorar visualmente;
- el despliegue en VPS requiere configurar secretos y proxy correctamente;
- el seed depende de que las colecciones esten vacias para preparar el escenario completo;
- las pruebas automatizadas todavia pueden ampliarse mucho;
- la autoasignacion usa reglas razonables, pero no cubre toda la complejidad legal y operativa real de un hospital.

## 12. Conclusiones y Lineas de Mejora

### 12.1. Conclusiones

`TFG-Hospital` ha evolucionado hasta convertirse en una plataforma hospitalaria bastante completa para un Trabajo de Fin de Grado. Integra gestion administrativa, operativa y laboral, y lo hace con una arquitectura moderna separada entre backend y frontend.

El proyecto destaca por la amplitud de modulos: seguridad, hospitales, trabajadores, ausencias, turnos, contratos, nominas, chat, notificaciones, auditoria y documentacion de API. Tambien esta mejor preparado para un entorno real gracias a la externalizacion de secretos, el uso de BCrypt, sesiones persistidas y despliegue previsto en VPS.

### 12.2. Lineas de Mejora Futuras

- reforzar autorizacion por rol en todos los endpoints sensibles;
- ampliar pruebas unitarias, de integracion y end-to-end;
- mejorar el diseno del PDF de nomina;
- anadir paneles analiticos mas avanzados;
- registrar historico de cambios en configuracion hospitalaria;
- mejorar la estrategia de despliegue con CI/CD desde GitHub;
- dockerizar backend, frontend y dependencias auxiliares;
- anadir backups automatizados de MongoDB;
- ampliar Swagger con ejemplos de request y response;
- mejorar observabilidad con logs estructurados y metricas.

## 13. Referencias

### 13.1. Bibliografia

- Repositorio GitHub del proyecto: <https://github.com/Joseluuu315/TFG-Hospital>
- Documentacion oficial de Spring Boot: <https://spring.io/projects/spring-boot>
- Documentacion oficial de Spring Security: <https://spring.io/projects/spring-security>
- Documentacion oficial de Spring Data MongoDB: <https://spring.io/projects/spring-data-mongodb>
- Documentacion oficial de MongoDB: <https://www.mongodb.com/docs/>
- Documentacion oficial de Next.js: <https://nextjs.org/docs>
- Documentacion oficial de React: <https://react.dev/>
- Documentacion oficial de TypeScript: <https://www.typescriptlang.org/docs/>
- Documentacion oficial de Tailwind CSS: <https://tailwindcss.com/docs>
- Documentacion oficial de Radix UI: <https://www.radix-ui.com/>
- Documentacion oficial de OpenAPI / Swagger: <https://swagger.io/specification/>

### Archivos clave del proyecto

- `README.md`
- `build.gradle`
- `src/main/resources/application.properties`
- `config/application-secrets.properties.example`
- `src/main/java/com/joseluu/hospital/security/SecurityConfig.java`
- `src/main/java/com/joseluu/hospital/security/BearerTokenAuthenticationFilter.java`
- `src/main/java/com/joseluu/hospital/service/AuthService.java`
- `src/main/java/com/joseluu/hospital/service/SchedulingService.java`
- `src/main/java/com/joseluu/hospital/service/AdvancedPayrollService.java`
- `src/main/java/com/joseluu/hospital/service/DataSeeder.java`
- `front-end/lib/api.ts`
- `front-end/contexts/auth-context.tsx`
- `front-end/next.config.mjs`
