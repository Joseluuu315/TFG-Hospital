# Back-end REST de TFG-Hospital

## Objetivo

Este backend expone la API REST del sistema y concentra la logica de negocio del hospital: autenticacion, hospitales, trabajadores, ausencias, turnos, nomina, chat, notificaciones y auditoria.

## Estructura

- `controller`: endpoints HTTP
- `service`: logica de negocio y procesos
- `repository`: acceso a MongoDB
- `entity`: documentos persistidos
- `dto`: contratos de entrada y salida
- `exception` y `error`: manejo de errores

## Modulos principales

- `AuthController` / `AuthService`
- `HospitalsController` / `HospitalService`
- `UsersController`
- `LeaveRequestsController`
- `HospitalSettingsController`
- `ShiftTypesController`
- `SchedulingController`
- `WorkerContractsController`
- `PayrollsController`
- `AdvancedPayrollController` / `AdvancedPayrollService`
- `ChatController`
- `WorkGroupsController`
- `NotificationsController`
- `AuditLogsController`

## Modelo de persistencia

Colecciones principales:

- `users`
- `hospitals`
- `leave_requests`
- `hospital_settings`
- `shift_types`
- `shift_requirements`
- `shift_assignments`
- `worker_contracts`
- `payrolls`
- `payroll_items`
- `payroll_adjustments`
- `chats`
- `chat_messages`
- `work_groups`
- `notifications`
- `audit_logs`

## Flujos destacados

### Turnos

`SchedulingService` permite:

- crear demandas por fecha y departamento
- registrar asignaciones manuales
- ejecutar autoasignacion
- cancelar asignaciones

La autoasignacion tiene en cuenta solapes, descansos y reparto basico de carga.

### Nomina

`AdvancedPayrollService` genera nominas usando:

- contrato activo
- turnos del periodo
- ausencias aprobadas
- ajustes manuales

El detalle se guarda en `payroll_items` y puede descargarse en PDF.

### Seed

`DataSeeder` crea un escenario demo completo si las colecciones estan vacias:

- usuarios de los tres roles
- tres trabajadores
- contratos
- ausencias
- demandas y asignaciones
- ajustes y nominas
- chats y grupo de trabajo

## Como leer el codigo

1. Empieza por un controlador.
2. Sigue el servicio invocado.
3. Revisa el repositorio y la entidad.
4. Comprueba el DTO para entender el contrato HTTP.

## Ejecucion

Desde la raiz:

```powershell
.\gradlew bootRun
```

API por defecto:

- `http://localhost:8080`

## Notas tecnicas

- la autenticacion actual usa tokens en memoria
- la configuracion vive en `src/main/resources/application.properties`
- antes de un despliegue real conviene mover secretos y endurecer seguridad

## Documentacion relacionada

- [README.md](C:/Users/Josel/Documents/GitHub/TFG-Hospital/README.md)
- [documento.md](C:/Users/Josel/Documents/GitHub/TFG-Hospital/documento.md)
