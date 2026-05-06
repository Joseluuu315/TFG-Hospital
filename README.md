# TFG-Hospital

Aplicacion web full stack para la gestion operativa de hospitales. El proyecto combina un backend REST en Spring Boot con un frontend en Next.js y una base de datos MongoDB para cubrir administracion, personal, turnos, ausencias, nominas, chat interno y auditoria.

## Vision general

El sistema esta pensado para tres perfiles:

- `ROOT`: administracion global de la plataforma.
- `HOSPITAL_ADMIN`: gestion de un hospital concreto.
- `WORKER`: trabajador del hospital.

Los modulos principales del proyecto son:

- autenticacion y sesion
- gestion de hospitales
- gestion de trabajadores y perfil
- calendario y ausencias
- configuracion operativa del hospital
- tipos de turno, demandas y autoasignacion
- contratos y nomina avanzada
- chat, grupos y notificaciones
- auditoria de acciones

## Stack tecnico

### Backend

- Java 17
- Spring Boot 4
- Spring Web MVC
- Spring Data MongoDB
- Spring Validation
- Spring Security Crypto
- Gradle

### Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Radix UI / shadcn
- Axios
- SWR
- React Hook Form + Zod

### Base de datos

- MongoDB

## Estructura del repositorio

```text
TFG-Hospital/
|-- src/
|   |-- main/java/com/joseluu/hospital/
|   |   |-- controller/
|   |   |-- service/
|   |   |-- repository/
|   |   |-- entity/
|   |   `-- dto/
|   `-- main/resources/application.properties
|-- front-end/
|   |-- app/
|   |-- components/
|   |-- contexts/
|   `-- lib/
|-- docs/
|-- README.md
`-- documento.md
```

## Arquitectura

### Backend

El backend sigue una separacion clasica por capas:

- `controller`: expone endpoints REST.
- `service`: concentra logica de negocio y procesos.
- `repository`: acceso a MongoDB con Spring Data.
- `entity`: documentos persistidos.
- `dto`: contratos de entrada y salida.

Servicios especialmente importantes:

- `AuthService`: login, refresh y sesion en memoria.
- `HospitalService`: ciclo de vida de hospitales.
- `UsersService`: trabajadores, perfil y calendario.
- `SchedulingService`: demandas, asignacion manual y autoasignacion.
- `AdvancedPayrollService`: calculo de nomina desde turnos, contrato y ausencias.
- `PayrollService`: descarga de PDF de nomina.
- `ChatService`, `WorkGroupService`, `NotificationService`, `AuditLogService`.

### Frontend

El frontend usa App Router y organiza la experiencia por paneles:

- `front-end/app/dashboard/root`
- `front-end/app/dashboard/admin`
- `front-end/app/dashboard/worker`

Piezas compartidas relevantes:

- `components/dashboard/*`: shell, header y sidebar.
- `components/ui/*`: primitives reutilizables.
- `components/chat/*`: sidebar, ventana y dialogos.
- `contexts/auth-context.tsx`: estado de sesion.
- `lib/api.ts`: cliente HTTP, tipos y acceso a endpoints.

## Base de datos

El proyecto persiste en MongoDB con un modelo documental. Las colecciones mas importantes son:

- `users`: usuarios, rol, hospital, salario base y eventos.
- `hospitals`: centros hospitalarios y anuncios.
- `leave_requests`: solicitudes de ausencia.
- `hospital_settings`: reglas operativas y economicas.
- `shift_types`: catalogo de turnos.
- `shift_requirements`: demanda diaria por departamento y turno.
- `shift_assignments`: asignaciones manuales y automaticas.
- `worker_contracts`: contrato activo por trabajador.
- `payrolls`: resumen de nomina por periodo.
- `payroll_items`: lineas de calculo de la nomina.
- `payroll_adjustments`: ajustes manuales de nomina.
- `chats` y `chat_messages`: mensajeria interna.
- `work_groups`: grupos de trabajo.
- `notifications`: avisos del sistema.
- `audit_logs`: trazabilidad de operaciones.

Relaciones logicas principales:

- un `hospital` agrupa trabajadores, configuracion, chats y operaciones;
- un `user` puede tener ausencias, turnos, contrato, nominas y notificaciones;
- una `shift_requirement` genera `shift_assignments`;
- una `payroll` se apoya en `payroll_items`, `payroll_adjustments`, contrato, turnos y ausencias.

## Modulos funcionales

### 1. Autenticacion

- login por email y password
- refresh token
- endpoint `/api/auth/me`
- sesion mantenida desde el frontend con `Authorization: Bearer`

Importante: la sesion actual vive en memoria del backend, asi que se pierde al reiniciar.

### 2. Hospitales

- alta, edicion, cambio de estado y eliminacion
- anuncios internos
- estadisticas globales para `ROOT`

### 3. Trabajadores

- alta y edicion de perfiles
- departamento, puesto, salario y estado
- calendario individual
- contratos laborales

### 4. Ausencias

- solicitud desde `WORKER`
- revision desde `HOSPITAL_ADMIN`
- soporte para ausencias pagadas y no pagadas

### 5. Operaciones y turnos

- configuracion de reglas del hospital
- tipos de turno
- demanda por fecha y departamento
- asignacion manual
- autoasignacion con restricciones basicas

La autoasignacion evita solapes, revisa descansos, intenta no superar horas semanales y prioriza trabajadores del mismo departamento.

### 6. Nomina avanzada

La nomina ya no es solo un total fijo. El calculo usa:

- contrato activo
- turnos trabajados o planificados
- nocturnidad
- fines de semana o festivos
- horas extra
- vacaciones o dias pagados
- ausencias no remuneradas
- ajustes manuales

El detalle se guarda en `payroll_items` y se puede descargar en PDF.

### 7. Chat, grupos, notificaciones y auditoria

- chats privados, de hospital, de grupo y de soporte
- grupos de trabajo con chat asociado
- notificaciones funcionales
- logs de auditoria para acciones sensibles

## Datos semilla

`DataSeeder` carga datos de demostracion cuando las colecciones estan vacias. El seed actual deja preparado un escenario util para probar:

- 1 hospital principal
- 1 usuario `ROOT`
- 1 usuario `HOSPITAL_ADMIN`
- 3 trabajadores
- contratos activos
- ausencias aprobadas y pendientes
- demandas de turno proximas
- asignaciones mensuales para probar autoasignacion y nomina
- ajustes manuales de nomina
- chats, mensajes y grupo de urgencias

Credenciales base del seed:

- `superadmin@trassierra.com` / `admin123`
- `admin@hospital-reina-sofia.com` / `admin123`
- `trabajador1@hospital-reina-sofia.com` / `worker123`
- `trabajador2@hospital-reina-sofia.com` / `worker123`
- `trabajador3@hospital-reina-sofia.com` / `worker123`

Importante:

- el seed solo se ejecuta sobre colecciones vacias;
- si quieres ver el escenario completo actualizado, arranca con base de datos limpia.

## Ejecucion local

### Backend

Desde la raiz:

```powershell
.\gradlew bootRun
```

API por defecto:

- `http://localhost:8080`

### Frontend

Desde `front-end`:

```powershell
npm install
npm run dev
```

Frontend por defecto:

- `http://localhost:3000`

### Conexion frontend-backend

Next reescribe `/api/*` hacia el backend, por lo que la app trabaja como si consumiera la misma origin desde el navegador.

## Configuracion actual

El archivo [application.properties](C:/Users/Josel/Documents/GitHub/TFG-Hospital/src/main/resources/application.properties) define:

- nombre de aplicacion
- URI de MongoDB
- nombre de base de datos
- puerto del backend
- URL base del frontend

Recomendacion:

- mover credenciales de MongoDB a secretos o variables de entorno antes de cualquier despliegue real.

## Endpoints principales

Rutas base del backend:

- `/api/auth`
- `/api/admin`
- `/api/hospitals`
- `/api/users`
- `/api/leave-requests`
- `/api/payrolls`
- `/api/advanced-payroll`
- `/api/hospital-settings`
- `/api/shift-types`
- `/api/scheduling`
- `/api/worker-contracts`
- `/api/chats`
- `/api/work-groups`
- `/api/notifications`
- `/api/audit-logs`

## Documentacion ampliada

Para una explicacion mas completa del proyecto, revisa:

- [documento.md](C:/Users/Josel/Documents/GitHub/TFG-Hospital/documento.md)
- [src/README.md](C:/Users/Josel/Documents/GitHub/TFG-Hospital/src/README.md)
- [docs/memoria_tfg_hospital.md](C:/Users/Josel/Documents/GitHub/TFG-Hospital/docs/memoria_tfg_hospital.md)

## Limitaciones actuales

- autenticacion basada en tokens en memoria
- seguridad de servidor mejorable
- no he podido verificar compilacion completa aqui por restricciones de red del entorno
- el frontend depende de recursos externos de fuentes en build
- el PDF de nomina es funcional pero todavia simple a nivel visual

## Licencia

Proyecto bajo licencia MIT.
