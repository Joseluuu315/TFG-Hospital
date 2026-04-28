Title: TFG-Hospital
Subtitle: Plataforma web para la gestion integral de hospitales y la coordinacion operativa del personal
Document: Memoria del Trabajo de Fin de Grado
Author: Jose Luis Fuentes Parra
Tutor: Por completar
AcademicYear: 2025/2026
LocationDate: Cordoba, abril de 2026
Center: CFGS Desarrollo de Aplicaciones Multiplataforma

# 1. Datos del Proyecto

- Nombre del proyecto: TFG-Hospital
- Tipo de proyecto: aplicacion web full stack para la gestion hospitalaria
- Autor: Jose Luis Fuentes Parra
- Tutor del proyecto: por completar
- Curso academico: 2025/2026
- Entorno tecnologico principal: Spring Boot, Next.js, React y MongoDB
- Repositorio analizado: `C:\Users\Josel\Documents\GitHub\TFG-Hospital`

# 2. Resumen

## 2.1. Resumen

TFG-Hospital es una plataforma de gestion hospitalaria orientada a digitalizar procesos internos de organizacion, administracion y coordinacion del personal sanitario. El sistema centraliza la operativa de hospitales en una unica solucion web y cubre necesidades que van desde la autenticacion de usuarios y la gestion de hospitales hasta la planificacion de turnos, el control de ausencias, la generacion de nominas, la comunicacion interna y la auditoria de acciones.

El proyecto se apoya en una arquitectura separada en frontend y backend. El backend, implementado con Spring Boot sobre Java 17, expone una API REST que encapsula la logica de negocio y el acceso a MongoDB. El frontend, construido con Next.js 16 y React 19, ofrece paneles diferenciados por rol para administracion central, administracion hospitalaria y personal trabajador.

Durante la revision realizada el 27 de abril de 2026 se ha comprobado que el frontend supera correctamente los procesos de lint y build. Tambien se ha detectado que el backend depende del wrapper de Gradle para ejecutar pruebas, pero esa verificacion no ha podido completarse en el sandbox actual porque la descarga de Gradle desde red esta bloqueada. Ademas, no se han encontrado tests automatizados en `src/test`, por lo que el nivel de validacion automatizada del backend sigue siendo limitado.

# 3. Introduccion y Justificacion

## 3.1. Introduccion

La gestion diaria de un hospital exige coordinar informacion de naturaleza muy distinta: altas y mantenimiento de personal, reglas de turnicidad, distribucion de carga de trabajo, solicitudes de ausencia, incidencias operativas, comunicacion entre equipos y control economico de nominas. Cuando estos procesos se resuelven con hojas de calculo, mensajes dispersos o herramientas inconexas, se generan ineficiencias, errores y una baja trazabilidad.

TFG-Hospital nace como una propuesta de digitalizacion integral de ese contexto. La aplicacion no se limita a mostrar datos administrativos, sino que incorpora mecanismos operativos concretos, como configuracion de reglas de descanso, tipos de turno, demandas por departamento, autoasignacion de personal y calculo de conceptos de nomina derivados del trabajo realizado.

## 3.2. Justificacion del Proyecto

La justificacion principal del proyecto es la necesidad de unificar la operativa hospitalaria en una plataforma comun que reduzca carga administrativa y mejore la capacidad de seguimiento. El sistema aporta valor en varios niveles:

- permite a la administracion central supervisar hospitales, usuarios y estadisticas globales;
- facilita a cada hospital gestionar su propio personal y sus anuncios internos;
- ofrece a cada trabajador acceso a calendario, ausencias, nominas y canales de comunicacion;
- introduce reglas de negocio que acercan la solucion a un caso real, especialmente en planificacion de turnos y nomina avanzada;
- deja una base extensible para futuras mejoras de seguridad, automatizacion y analitica.

# 4. Objetivos

## 4.1. Objetivo General

Desarrollar una aplicacion web modular y escalable para la gestion integral de hospitales, con capacidad para organizar usuarios, procesos operativos y comunicacion interna desde una unica interfaz conectada a una API REST.

## 4.2. Objetivos Especificos

- implementar autenticacion con sesiones y control basico de acceso por roles `ROOT`, `HOSPITAL_ADMIN` y `WORKER`;
- permitir la administracion de hospitales, incluyendo altas, edicion, suspension y baja;
- proporcionar gestion completa de trabajadores, perfil, calendario y eventos asociados;
- registrar anuncios internos para cada hospital;
- gestionar solicitudes de ausencia y su revision por parte de administracion;
- generar nominas y ampliar su calculo con contratos, pluses, penalizaciones y conceptos detallados;
- definir tipos de turno, demandas por fecha y departamento, y ejecutar autoasignacion de personal;
- ofrecer canales de chat, grupos de trabajo y notificaciones internas;
- mantener trazabilidad mediante registros de auditoria y paneles de estadisticas.

# 5. Analisis del Problema y Requisitos

## 5.1. Analisis del Problema

El problema que aborda TFG-Hospital es la fragmentacion de la informacion operativa y administrativa. En un entorno hospitalario no basta con almacenar fichas de trabajadores o datos de centros. Tambien es necesario coordinar disponibilidad, descansos, necesidades de cobertura, incidencias y retribuciones. La complejidad aumenta cuando intervienen varios perfiles con permisos distintos y necesidades de consulta diferentes.

La aplicacion responde a ese escenario con una solucion de doble capa. Por un lado, la API centraliza datos y procesos. Por otro, el frontend presenta vistas adaptadas al rol, evitando exponer en la interfaz tareas que no corresponden a cada usuario.

## 5.2. Requisitos Funcionales (RF)

- RF1. Autenticar usuarios mediante email y password.
- RF2. Mantener sesion con `accessToken` y `refreshToken`.
- RF3. Permitir a `ROOT` consultar estadisticas globales del sistema.
- RF4. Permitir a `ROOT` crear, editar, suspender y eliminar hospitales.
- RF5. Permitir a `HOSPITAL_ADMIN` gestionar trabajadores de su hospital.
- RF6. Permitir el alta y edicion de datos de usuario, incluyendo departamento, puesto, salario base y estado de cuenta.
- RF7. Permitir a cada trabajador consultar y actualizar parte de su perfil.
- RF8. Permitir crear, listar y revisar solicitudes de ausencia.
- RF9. Permitir registrar eventos de calendario vinculados a usuarios.
- RF10. Permitir generar nominas basicas y consultar su PDF.
- RF11. Permitir calcular nominas avanzadas a partir de contratos, turnos y ajustes manuales.
- RF12. Permitir definir configuracion hospitalaria para horas maximas, descansos y multiplicadores economicos.
- RF13. Permitir crear tipos de turno y demandas de cobertura por fecha y departamento.
- RF14. Permitir ejecutar autoasignacion y asignaciones manuales de turnos.
- RF15. Permitir gestionar chats privados, de hospital, de grupo y de soporte.
- RF16. Permitir crear grupos de trabajo con chat asociado.
- RF17. Permitir emitir notificaciones y marcarlas como leidas.
- RF18. Permitir consultar registros de auditoria asociados a un hospital.

## 5.3. Requisitos No Funcionales (RNF)

- RNF1. La aplicacion debe ser accesible desde navegador y responder como SPA sobre Next.js.
- RNF2. La API debe seguir un diseño REST con rutas coherentes y DTOs de intercambio.
- RNF3. El sistema debe mantener una separacion clara entre controlador, servicio, repositorio y entidades.
- RNF4. La interfaz debe diferenciar claramente las operaciones disponibles segun el rol autenticado.
- RNF5. La persistencia debe soportar un modelo flexible para entidades heterogeneas, de ahi la eleccion de MongoDB.
- RNF6. El codigo debe ser mantenible y comprensible para un contexto academico de DAM.
- RNF7. Las operaciones criticas deben dejar algun rastro funcional, ya sea mediante notificaciones o auditoria.
- RNF8. El despliegue local debe ser sencillo, separando backend y frontend y conectandolos mediante rewrite a `/api`.

# 6. Diseno Tecnico

## 6.1. Arquitectura del Sistema

La solucion se divide en dos aplicaciones coordinadas:

- un backend Spring Boot que expone endpoints REST y encapsula la logica de negocio;
- un frontend Next.js que consume esa API y organiza la experiencia de usuario por paneles y rutas.

En el backend se aplica una estructura por capas:

- `controller`: recibe peticiones HTTP y devuelve respuestas JSON o binarios;
- `service`: implementa reglas de negocio, validaciones y procesos de alto nivel;
- `repository`: abstrae consultas a MongoDB con Spring Data;
- `entity`: define documentos persistidos;
- `dto`: fija los contratos de entrada y salida;
- `error` y `exception`: concentran tratamiento de errores y respuestas de fallo.

En el frontend, `app/` contiene las rutas del framework, `components/` agrupa UI reutilizable y componentes de dominio, `contexts/auth-context.tsx` gestiona el estado de autenticacion y `lib/api.ts` concentra el cliente HTTP, los tipos TypeScript y las funciones de acceso a la API.

## 6.2. Diseno de Base de Datos

La persistencia se resuelve con MongoDB, utilizando documentos independientes para las principales areas funcionales. Entre las colecciones mas relevantes se encuentran:

- `users`: datos personales, rol, hospital, salario base y eventos de calendario;
- `hospitals`: datos del centro, estado y anuncios;
- `leave_requests`: solicitudes de ausencia y su estado de revision;
- `payrolls`, `payroll_items` y `payroll_adjustments`: nominas, lineas de detalle y ajustes manuales;
- `shift_types`, `shift_requirements` y `shift_assignments`: configuracion y resultados de la planificacion de turnos;
- `worker_contracts`: informacion contractual activa por trabajador;
- `notifications`: avisos emitidos a usuarios;
- `chats`, `chat_messages` y `work_groups`: comunicacion interna y coordinacion entre equipos;
- `audit_logs`: trazabilidad de acciones relevantes;
- `hospital_settings`: reglas operativas y economicas de cada hospital.

## 6.2.1. Entidades y Relaciones

Aunque MongoDB no obliga a relaciones estrictas, el dominio del proyecto mantiene dependencias lógicas claras:

- un usuario puede pertenecer a un hospital y tener un rol determinado;
- un hospital acumula anuncios, configuracion, trabajadores y registros operativos;
- una solicitud de ausencia pertenece a un trabajador;
- una nomina pertenece a un trabajador y a un hospital, y puede tener lineas y ajustes;
- una demanda de turno genera asignaciones a trabajadores;
- un grupo de trabajo tiene miembros y un chat asociado;
- una accion administrativa puede producir notificaciones y logs de auditoria.

## 6.3. Diseno de Interfaz de Usuario (UI)

La interfaz esta organizada por paneles y tareas:

- `ROOT` dispone de dashboard global, gestion de hospitales, estadisticas y soporte;
- `HOSPITAL_ADMIN` accede a trabajadores, anuncios, ausencias, nominas, operaciones y chat;
- `WORKER` dispone de vistas de calendario, ausencias, nominas, chat y ajustes personales.

El frontend utiliza componentes UI basados en Radix UI y estilos utilitarios con Tailwind CSS. La navegacion se apoya en un shell comun con sidebar, cabecera y vistas de contenido. Tambien se emplean tablas, badges, dialogos, formularios y feedback mediante `sonner`.

# 7. Tecnologias Utilizadas

- Backend: Java 17, Spring Boot 4.0.2, Spring Web MVC, Spring Data MongoDB, Spring Validation y Lombok.
- Frontend: Next.js 16.1.6, React 19.2.4 y TypeScript 5.7.3.
- Cliente HTTP y estado remoto: Axios y SWR.
- Formularios y validacion en cliente: React Hook Form y Zod.
- UI: Tailwind CSS 4, shadcn/ui, Radix UI, Sonner y Lucide React.
- Persistencia: MongoDB.
- Build y tooling: Gradle para backend, npm para frontend, ESLint para calidad de codigo.

# 8. Desarrollo e Implementacion

## 8.1. Estructura de Modulos

En la implementacion real del proyecto se distinguen varios bloques funcionales:

- autenticacion y sesion;
- gestion global de hospitales y estadisticas;
- gestion de usuarios y calendarios;
- ausencias;
- nomina basica y nomina avanzada;
- configuracion operativa del hospital;
- tipos de turno, demandas y asignaciones;
- contratos laborales;
- chat, grupos y soporte;
- notificaciones y auditoria.

## 8.2. Modulo de Autenticacion

`AuthService` implementa un modelo de sesion en memoria. Cuando un usuario inicia sesion, el backend valida email y password contra MongoDB y genera dos UUID aleatorios, uno como `accessToken` y otro como `refreshToken`. Ambos quedan almacenados en mapas concurrentes en memoria, por lo que se pierden al reiniciar el servidor. El frontend añade automaticamente el bearer token en `lib/api.ts` y, ante un `401`, intenta renovar la sesion usando el refresh token.

El contexto `auth-context.tsx` tambien contempla un modo de autenticacion simulada activable con `NEXT_PUBLIC_USE_MOCK_AUTH=true`, util para desarrollo local o demostraciones.

## 8.3. Modulo de Hospitales y Administracion Global

`HospitalsController` y `HospitalService` permiten listar hospitales, consultar detalle, crearlos, actualizarlos, cambiar su estado y eliminarlos. El modelo incorpora anuncios por hospital y un estado funcional como `ACTIVE`, `SUSPENDED` o `PENDING_REVIEW`. El panel `ROOT` dispone ademas de `AdminStatsController` para mostrar metricas globales y de un area de soporte con chats de tipo `SUPPORT`.

## 8.4. Modulo de Usuarios, Calendario y Ausencias

`UsersController` ofrece alta y actualizacion de usuarios, obtencion por identificador y varias operaciones de autoservicio: calendario mensual, perfil propio y solicitudes de ausencia. El trabajador puede consultar sus propias solicitudes y crear nuevas, mientras que administracion revisa peticiones desde `LeaveRequestsController`.

## 8.5. Modulo de Planificacion Operativa

La parte mas diferencial del proyecto esta en `SchedulingService`. El sistema permite:

- definir tipos de turno con hora de inicio, hora de fin y cruce de medianoche;
- registrar demandas por fecha, departamento y numero de trabajadores requeridos;
- crear asignaciones manuales;
- ejecutar autoasignacion de turnos en un rango de fechas.

La autoasignacion aplica varios criterios: evita solapes, respeta descansos minimos, intenta no superar horas semanales y prioriza candidatos del mismo departamento. Si una demanda queda parcialmente descubierta, se generan notificaciones para administracion.

## 8.6. Modulo de Configuracion Hospitalaria y Contratos

`HospitalSettingsService` gestiona reglas de negocio por hospital, como horas maximas, descanso minimo, pluses nocturnos, pluses festivos y multiplicador de horas extra. `WorkerContractService` mantiene el contrato activo de cada trabajador y sirve de base para el calculo avanzado de nomina.

## 8.7. Modulo de Nomina

Existen dos niveles de funcionalidad:

- `PayrollsController` gestiona nominas basicas, cambios de estado y descarga de un PDF simple.
- `AdvancedPayrollService` recalcula nominas a partir de turnos trabajados, ausencias aprobadas, contrato activo y ajustes manuales.

La version avanzada desglosa horas base, pluses de noche, pluses de fin de semana o festivo, horas extra, ausencias no remuneradas y bonificaciones o penalizaciones manuales. El resultado se guarda en `payrolls` y en lineas detalladas dentro de `payroll_items`.

## 8.8. Modulo de Comunicacion, Notificaciones y Auditoria

El proyecto incluye chat privado, chat de hospital, chat de grupo y chat de soporte. Los grupos de trabajo se relacionan con un chat asociado. Ademas, cada accion relevante puede generar notificaciones para los usuarios implicados y entradas en `audit_logs`, lo que aporta una capa de trazabilidad bastante valiosa para el contexto del proyecto.

## 8.9. Frontend y Flujos Principales

Las rutas del frontend cubren los principales recorridos:

- `/login`;
- `/dashboard/root`, `/dashboard/root/hospitals`, `/dashboard/root/stats`, `/dashboard/root/support`;
- `/dashboard/admin`, `/dashboard/admin/workers`, `/dashboard/admin/announcements`, `/dashboard/admin/leave-requests`, `/dashboard/admin/payrolls`, `/dashboard/admin/operations`, `/dashboard/admin/chat`, `/dashboard/admin/audit`;
- `/dashboard/worker`, `/dashboard/worker/calendar`, `/dashboard/worker/leave-requests`, `/dashboard/worker/payrolls`, `/dashboard/worker/chat`;
- `/dashboard/settings`.

La integracion entre frontend y backend se realiza mediante un rewrite en `front-end/next.config.mjs` que redirige `/api/:path*` a `http://localhost:8080/api/:path*`.

# 9. Seguridad y Validaciones

## 9.1. Seguridad y Control de Acceso

El proyecto incorpora una seguridad funcional basica, pero no una capa de seguridad robusta de nivel productivo. Actualmente:

- el login compara contrasenas en texto plano;
- las sesiones viven solo en memoria del backend;
- no existe una integracion completa con Spring Security para autorizacion por filtros;
- el frontend adapta la navegacion al rol del usuario autenticado;
- `lib/api.ts` protege parte de la experiencia al reenviar el token y refrescar sesion automaticamente.

Esto es suficiente para una demostracion academica, pero debe considerarse una limitacion importante de cara a produccion.

## 9.2. Validaciones

El backend ya incluye `spring-boot-starter-validation`, manejo global de excepciones y varias comprobaciones de negocio distribuidas en servicios, como:

- obligatoriedad de tokens o credenciales en autenticacion;
- validacion de pertenencia de un trabajador a un hospital en contratos y nomina avanzada;
- bloqueo de autoasignacion cuando no hay demanda o no hay candidatos;
- evitacion de solapes y control de descansos en planificacion.

No obstante, todavia hay margen para reforzar DTOs con reglas declarativas mas completas y para endurecer validaciones de integridad de datos.

# 10. Persistencia y Entorno de Ejecucion

## 10.1. Persistencia

La aplicacion backend utiliza MongoDB. En el estado revisado, `application.properties` apunta a una base de datos `hospital` sobre una instancia de MongoDB Atlas. En la memoria se recomienda documentar la arquitectura de persistencia sin exponer credenciales sensibles, por lo que estas no deben figurar en la version final entregada.

El proyecto incluye un `DataSeeder` que inserta informacion de ejemplo cuando las colecciones estan vacias. Entre los datos iniciales figuran un hospital, usuarios de los tres roles, anuncios, eventos de calendario, una solicitud de ausencia, una nomina, chats y un grupo de trabajo.

## 10.2. Entorno de Ejecucion

El arranque local previsto es el siguiente:

- backend: `.\gradlew bootRun` desde la raiz del repositorio;
- frontend: `npm install` y `npm run dev` desde `front-end`.

Por defecto, la API se sirve en `http://localhost:8080` y la interfaz en `http://localhost:3000`. El frontend se apoya en el rewrite de Next para evitar configurar un proxy manual.

# 11. Pruebas y Limitaciones

## 11.1. Pruebas Realizadas

La revision tecnica del 27 de abril de 2026 ha dejado el siguiente resultado:

- `npm run lint`: correcto;
- `npm run build`: correcto tras corregir un tipo faltante en `front-end/app/dashboard/admin/operations/page.tsx`;
- `.\gradlew test`: no verificado dentro del sandbox porque el wrapper necesita descargar `gradle-9.3.0` y la red esta bloqueada;
- carpeta `src/test`: no se han detectado pruebas automatizadas en el backend.

## 11.2. Limitaciones del Proyecto

- autenticacion y refresco de sesion implementados en memoria;
- contrasenas sin hash;
- ausencia de una autorizacion fuerte de servidor basada en filtros y anotaciones de seguridad;
- generacion de PDF de nomina todavia simple;
- validacion automatizada del backend escasa o inexistente;
- dependencia de datos semilla y de una configuracion externa de MongoDB para ciertos flujos de demostracion.

# 12. Conclusiones y Lineas de Mejora

## 12.1. Conclusiones

TFG-Hospital presenta una base funcional notable para un proyecto academico de gestion hospitalaria. La aplicacion cubre tanto la dimension administrativa como la operativa, algo que se aprecia especialmente en los modulos de turnos, contratos y nomina avanzada. La separacion entre frontend y backend esta bien planteada, y el dominio refleja un esfuerzo claro por simular escenarios de uso reales.

El proyecto destaca mas por amplitud funcional que por endurecimiento tecnico. Precisamente por eso, la memoria debe valorar tanto lo construido como las mejoras pendientes para llevar la plataforma a un nivel mas cercano a produccion.

## 12.2. Lineas de Mejora Futuras

- migrar la autenticacion a JWT o Spring Security completo con persistencia real de sesion;
- hashear contrasenas con BCrypt;
- anadir pruebas unitarias e integracion para controladores y servicios;
- endurecer DTOs con Bean Validation y reglas de negocio mas declarativas;
- enriquecer el generador de PDF de nominas con un formato profesional;
- introducir observabilidad, logs estructurados y trazas;
- ampliar la autoasignacion con criterios mas sofisticados de fairness y preferencia;
- preparar despliegue con variables de entorno y separacion clara entre desarrollo y produccion.

# 13. Referencias

## 13.1. Fuentes del Proyecto

- `README.md`
- `documento.md`
- `build.gradle`
- `src/README.md`
- `src/main/resources/application.properties`
- `src/main/java/com/joseluu/hospital/controller/*`
- `src/main/java/com/joseluu/hospital/service/*`
- `front-end/package.json`
- `front-end/next.config.mjs`
- `front-end/lib/api.ts`
- `front-end/contexts/auth-context.tsx`
- `front-end/app/dashboard/**`

## 13.2. Documentacion Tecnica de Referencia

- Spring Boot
- Spring Data MongoDB
- Next.js
- React
- TypeScript
- Tailwind CSS
- Radix UI
- MongoDB
