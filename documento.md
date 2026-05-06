# Documento tecnico del proyecto TFG-Hospital

## 1. Resumen del proyecto

`TFG-Hospital` es una aplicacion web full stack para la gestion de hospitales con enfoque operativo. No se limita a usuarios o fichas administrativas: incluye tambien reglas de turnicidad, demandas por departamento, autoasignacion, control de ausencias, calculo de nomina y trazabilidad.

La solucion esta separada en dos aplicaciones:

- backend REST con Spring Boot y MongoDB
- frontend web con Next.js, React y TypeScript

El sistema trabaja con tres roles:

- `ROOT`
- `HOSPITAL_ADMIN`
- `WORKER`

## 2. Objetivo funcional

El objetivo del proyecto es centralizar en una sola plataforma varios procesos internos del hospital:

- administracion de hospitales
- gestion de personal
- calendario y ausencias
- operaciones de turnos
- nomina avanzada
- comunicacion interna
- notificaciones
- auditoria

## 3. Arquitectura general

## 3.1 Backend

Ruta principal:

- `src/main/java/com/joseluu/hospital`

Estructura:

- `controller`: endpoints HTTP
- `service`: reglas de negocio y procesos
- `repository`: acceso a MongoDB
- `entity`: documentos persistidos
- `dto`: contratos de entrada y salida
- `exception` y `error`: manejo de errores

Controladores principales:

- `AuthController`
- `HospitalsController`
- `UsersController`
- `LeaveRequestsController`
- `PayrollsController`
- `AdvancedPayrollController`
- `HospitalSettingsController`
- `ShiftTypesController`
- `SchedulingController`
- `WorkerContractsController`
- `ChatController`
- `WorkGroupsController`
- `NotificationsController`
- `AuditLogsController`
- `AdminStatsController`

Servicios clave:

- `AuthService`
- `HospitalService`
- `UserService`
- `SchedulingService`
- `AdvancedPayrollService`
- `PayrollService`
- `NotificationService`
- `AuditLogService`
- `ChatService`
- `WorkGroupService`
- `DataSeeder`

## 3.2 Frontend

Ruta principal:

- `front-end`

Estructura relevante:

- `app/`: rutas del frontend
- `components/`: componentes reutilizables y UI
- `contexts/`: estado compartido
- `lib/`: cliente API, tipos, utilidades

Paneles:

- `dashboard/root`
- `dashboard/admin`
- `dashboard/worker`
- `dashboard/settings`

## 3.3 Flujo de integracion

El frontend consume el backend a traves de `/api/*`. Next aplica un rewrite hacia el backend, por lo que desde la UI se trabaja de forma transparente con la API REST.

## 4. Tecnologias utilizadas

### Backend

- Java 17
- Spring Boot 4.0.2
- Spring Web MVC
- Spring Data MongoDB
- Spring Validation
- Spring Security Crypto
- Actuator
- Lombok
- Gradle

### Frontend

- Next.js 16.1.6
- React 19.2.4
- TypeScript 5.7.3
- Tailwind CSS 4
- Radix UI
- Axios
- SWR
- React Hook Form
- Zod
- Sonner
- Lucide React

### Base de datos

- MongoDB

## 5. Roles y permisos

## 5.1 ROOT

Puede:

- consultar metricas globales
- gestionar hospitales
- acceder al chat de soporte

## 5.2 HOSPITAL_ADMIN

Puede:

- gestionar trabajadores
- gestionar contratos
- configurar reglas del hospital
- crear tipos de turno
- registrar demandas
- ejecutar autoasignacion
- revisar ausencias
- generar nominas
- gestionar chats y grupos
- consultar auditoria

## 5.3 WORKER

Puede:

- ver su calendario
- solicitar ausencias
- ver sus nominas
- descargar PDF
- participar en chats
- editar su perfil

## 6. Modulos funcionales

## 6.1 Autenticacion y sesion

La autenticacion actual no usa JWT persistido. El backend valida credenciales contra MongoDB y genera:

- `accessToken`
- `refreshToken`

Ambos se mantienen en memoria del backend. Esto implica:

- las sesiones se pierden al reiniciar el servidor
- no hay una capa completa de Spring Security con filtros y autorizacion fuerte

En el frontend, `auth-context.tsx` y `lib/api.ts`:

- guardan el token
- reenvian `Authorization: Bearer ...`
- intentan refresh automatico ante `401`

## 6.2 Gestion de hospitales

Este modulo cubre:

- listado
- detalle
- creacion
- actualizacion
- cambio de estado
- eliminacion
- anuncios internos

La eliminacion del hospital arrastra limpieza de informacion asociada segun la logica del servicio.

## 6.3 Gestion de trabajadores

Permite:

- crear trabajadores
- editar datos operativos
- activar o desactivar cuentas
- consultar calendario
- asociar contrato laboral

Campos habituales:

- nombre y apellidos
- email
- DNI
- telefono
- departamento
- puesto
- salario base
- hospital asociado

## 6.4 Calendario y ausencias

Cada trabajador puede tener eventos de calendario y solicitudes de ausencia.

Las ausencias soportan:

- fecha inicio y fin
- motivo
- tipo de ausencia
- estado
- comentario de revision
- indicador de ausencia pagada o no pagada

Estados principales:

- `PENDING`
- `APPROVED`
- `REJECTED`

## 6.5 Operaciones y planificacion de turnos

Es uno de los modulos mas potentes del proyecto. Incluye:

- configuracion hospitalaria
- tipos de turno
- demandas por fecha y departamento
- asignacion manual
- autoasignacion

### Reglas de configuracion hospitalaria

La configuracion por hospital incluye, entre otros:

- horas maximas semanales
- descanso minimo entre turnos
- dias consecutivos maximos
- noches consecutivas maximas
- peso de fairness
- plus nocturno
- plus festivo
- multiplicador de horas extra
- recalcule automatico

### Tipos de turno

Cada tipo define:

- codigo
- nombre
- hora de inicio
- hora de fin
- cruce de medianoche

Ejemplos sembrados:

- `MORNING`
- `AFTERNOON`
- `NIGHT`
- `MIXED`

### Demandas de turno

Una demanda representa la necesidad de cobertura para:

- una fecha
- un departamento
- un tipo de turno
- un numero de trabajadores requeridos

### Autoasignacion

`SchedulingService` sigue una estrategia por fases:

1. obtiene trabajadores del hospital
2. descarta solapes
3. intenta respetar descansos minimos
4. intenta respetar horas semanales
5. prioriza el mismo departamento
6. reparte carga con una puntuacion simple basada en horas, fines de semana y noches

Si no se cubre una demanda, el sistema notifica al administrador.

## 6.6 Contratos laborales

Cada trabajador puede tener un contrato activo con:

- tarifa por hora
- horas semanales
- plus de nocturnidad
- plus festivo
- multiplicador de horas extra
- fecha de vigencia
- estado activo

El contrato alimenta el calculo de nomina avanzada.

## 6.7 Nomina avanzada

La nomina se calcula a partir de:

- contrato activo
- turnos asignados o trabajados en el periodo
- ausencias aprobadas
- ajustes manuales

Conceptos soportados en el desglose:

- horas base
- dias remunerados
- nocturnidad
- plus de fin de semana o festivo
- horas extra
- ausencias no remuneradas
- bonus manuales
- penalizaciones manuales

La generacion deja:

- un documento en `payrolls`
- lineas de detalle en `payroll_items`
- posibilidad de descarga PDF

## 6.8 Chat, grupos y soporte

El sistema permite:

- chat privado
- chat de hospital
- chat de grupo
- chat de soporte

Los grupos de trabajo mantienen:

- lista de miembros
- nombres de miembros
- chat vinculado

## 6.9 Notificaciones y auditoria

Se generan notificaciones funcionales cuando ocurre, por ejemplo:

- asignacion de turno
- nomina generada
- demanda no cubierta

Tambien se registran acciones sensibles en `audit_logs`, lo que ayuda a trazabilidad y depuracion.

## 7. Modelo de datos MongoDB

El proyecto usa MongoDB con colecciones separadas por dominio. No hay claves foraneas estrictas, pero si relaciones logicas por identificadores.

## 7.1 Coleccion `users`

Responsabilidad:

- identidad del usuario y pertenencia al hospital

Campos habituales:

- `id`
- `firstName`
- `lastName`
- `imageURL`
- `email`
- `password`
- `phone`
- `dni`
- `role`
- `enabled`
- `accountNonLocked`
- `hospitalId`
- `hospitalName`
- `department`
- `jobTitle`
- `hireDate`
- `baseSalary`
- `calendarEvents[]`
- `createdAt`
- `updatedAt`

## 7.2 Coleccion `hospitals`

Responsabilidad:

- datos del centro y anuncios

Campos habituales:

- `id`
- `name`
- `address`
- `city`
- `province`
- `taxId`
- `status`
- `announcements[]`
- `createdAt`
- `updatedAt`

## 7.3 Coleccion `leave_requests`

Responsabilidad:

- ausencias de trabajadores

Campos habituales:

- `id`
- `userId`
- `hospitalId`
- `startDate`
- `endDate`
- `reason`
- `leaveType`
- `paid`
- `status`
- `requestedAt`
- `reviewedAt`
- `reviewComment`

## 7.4 Coleccion `hospital_settings`

Responsabilidad:

- reglas operativas y economicas por hospital

Campos habituales:

- `id`
- `hospitalId`
- `maxWeeklyHours`
- `minRestHours`
- `maxConsecutiveDays`
- `maxConsecutiveNights`
- `fairnessWeight`
- `autoRecalculate`
- `nightBonusPct`
- `holidayBonusPct`
- `overtimeMultiplier`

## 7.5 Coleccion `shift_types`

Responsabilidad:

- catalogo de turnos configurables

Campos habituales:

- `id`
- `hospitalId`
- `code`
- `name`
- `startTime`
- `endTime`
- `crossesMidnight`

## 7.6 Coleccion `shift_requirements`

Responsabilidad:

- necesidades de cobertura por fecha

Campos habituales:

- `id`
- `hospitalId`
- `department`
- `date`
- `shiftTypeCode`
- `requiredWorkers`

## 7.7 Coleccion `shift_assignments`

Responsabilidad:

- turnos asignados a trabajadores

Campos habituales:

- `id`
- `hospitalId`
- `workerId`
- `workerFullName`
- `department`
- `shiftTypeCode`
- `startAt`
- `endAt`
- `status`
- `source`
- `version`
- `createdAt`
- `updatedAt`

## 7.8 Coleccion `worker_contracts`

Responsabilidad:

- contrato activo por trabajador

Campos habituales:

- `id`
- `hospitalId`
- `workerId`
- `hourlyRate`
- `weeklyHours`
- `nightBonusPct`
- `holidayBonusPct`
- `overtimeMultiplier`
- `effectiveFrom`
- `active`
- `createdAt`
- `updatedAt`

## 7.9 Coleccion `payrolls`

Responsabilidad:

- resumen de nomina por periodo

Campos habituales:

- `id`
- `workerId`
- `workerFullName`
- `hospitalId`
- `period`
- `grossSalary`
- `socialSecurityWorker`
- `incomeTaxWithholding`
- `otherDeductions`
- `netSalary`
- `overtimeAmount`
- `bonusAmount`
- `pdfPath`
- `status`
- `acknowledgedAt`
- `issuedAt`

## 7.10 Coleccion `payroll_items`

Responsabilidad:

- lineas de calculo de la nomina

Campos habituales:

- `id`
- `payrollId`
- `workerId`
- `hospitalId`
- `type`
- `description`
- `quantity`
- `unitAmount`
- `totalAmount`

## 7.11 Coleccion `payroll_adjustments`

Responsabilidad:

- ajustes manuales positivos o negativos

Campos habituales:

- `id`
- `hospitalId`
- `workerId`
- `period`
- `type`
- `description`
- `amount`
- `createdBy`
- `createdAt`

## 7.12 Colecciones de comunicacion

### `chats`

- `id`
- `type`
- `name`
- `description`
- `participants[]`
- `participantNames[]`
- `createdBy`
- `hospitalId`
- `lastMessage`
- `lastMessageTime`
- `unreadCounts`
- `createdAt`
- `updatedAt`

### `chat_messages`

- `id`
- `chatId`
- `senderId`
- `senderImageURL`
- `senderName`
- `content`
- `timestamp`
- `read`

### `work_groups`

- `id`
- `name`
- `description`
- `hospitalId`
- `members[]`
- `memberNames[]`
- `createdBy`
- `chatId`
- `createdAt`
- `updatedAt`

## 7.13 Colecciones de soporte funcional

### `notifications`

- `id`
- `userId`
- `type`
- `message`
- `link`
- `read`
- `createdAt`

### `audit_logs`

- `id`
- `hospitalId`
- `actorUserId`
- `action`
- `entityType`
- `entityId`
- `details`
- `createdAt`

## 8. Relaciones logicas del dominio

- un hospital tiene muchos usuarios
- un usuario trabajador puede tener un contrato activo
- un usuario trabajador puede tener muchas ausencias
- un usuario trabajador puede tener muchas asignaciones de turno
- una nomina pertenece a un trabajador y a un hospital
- una nomina puede tener muchas lineas y muchos ajustes
- un grupo de trabajo enlaza con un chat
- una accion del sistema puede producir notificaciones y logs de auditoria

## 9. Datos semilla y entorno demo

`DataSeeder` se ejecuta al arrancar si detecta colecciones vacias.

El seed actual prepara:

- hospital principal `Hospital Reina Sofia`
- usuario `ROOT`
- usuario `HOSPITAL_ADMIN`
- tres trabajadores de urgencias
- contratos activos
- ausencias pagadas y no pagadas
- demandas de turno para los proximos dias
- asignaciones mensuales para probar nomina
- ajustes manuales
- chats y grupo de urgencias

Credenciales base:

- `superadmin@trassierra.com` / `admin123`
- `admin@hospital-reina-sofia.com` / `admin123`
- `trabajador1@hospital-reina-sofia.com` / `worker123`
- `trabajador2@hospital-reina-sofia.com` / `worker123`
- `trabajador3@hospital-reina-sofia.com` / `worker123`

Importante:

- si la base de datos ya tiene datos, el seed no recrea el escenario completo;
- para una demo limpia conviene vaciar colecciones antes de arrancar.

## 10. Rutas principales del frontend

- `/login`
- `/dashboard/root`
- `/dashboard/root/hospitals`
- `/dashboard/root/stats`
- `/dashboard/root/support`
- `/dashboard/admin`
- `/dashboard/admin/workers`
- `/dashboard/admin/workers/[id]/calendar`
- `/dashboard/admin/announcements`
- `/dashboard/admin/leave-requests`
- `/dashboard/admin/payrolls`
- `/dashboard/admin/operations`
- `/dashboard/admin/chat`
- `/dashboard/admin/audit`
- `/dashboard/worker`
- `/dashboard/worker/calendar`
- `/dashboard/worker/leave-requests`
- `/dashboard/worker/payrolls`
- `/dashboard/worker/chat`
- `/dashboard/settings`

## 11. Endpoints principales del backend

Rutas base:

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

## 12. Configuracion y despliegue local

## 12.1 Backend

Desde la raiz:

```powershell
.\gradlew bootRun
```

La API escucha por defecto en:

- `http://localhost:8080`

## 12.2 Frontend

Desde `front-end`:

```powershell
npm install
npm run dev
```

La UI se sirve por defecto en:

- `http://localhost:3000`

## 12.3 Configuracion actual conocida

En [application.properties](C:/Users/Josel/Documents/GitHub/TFG-Hospital/src/main/resources/application.properties) aparecen:

- nombre de aplicacion
- URI de MongoDB
- nombre de base de datos
- puerto del backend
- URL base del frontend

Recomendaciones:

- sacar credenciales sensibles fuera del repositorio
- usar variables de entorno o un fichero de secretos local

## 13. Estado tecnico y limitaciones

Puntos importantes del estado actual:

- autenticacion basada en sesiones en memoria
- contrasenas sin endurecimiento de produccion equivalente a una solucion completa con seguridad integrada
- autorizacion de servidor mejorable
- parte del valor del sistema depende del seed para demos
- el PDF de nomina ya es funcional, pero visualmente es sencillo

Limitacion de verificacion en este entorno:

- no he podido validar compilacion completa del backend ni build final del frontend aqui cuando requieren descargas externas, porque el entorno actual tiene restricciones de red

## 14. Recomendaciones de mejora

Prioridad alta:

- migrar autenticacion a JWT o Spring Security completo
- externalizar secretos
- reforzar autorizacion por rol en servidor
- anadir tests unitarios y de integracion

Prioridad media:

- enriquecer el PDF de nomina
- reforzar validaciones declarativas en DTOs
- mejorar observabilidad y logs
- ampliar criterios de fairness en autoasignacion

Prioridad funcional:

- mas analitica y reportes
- configuracion avanzada de festivos
- historico de versiones de configuracion operativa

## 15. Archivos clave para entender el sistema

Backend:

- [RunApp.java](C:/Users/Josel/Documents/GitHub/TFG-Hospital/src/main/java/com/joseluu/hospital/RunApp.java)
- [DataSeeder.java](C:/Users/Josel/Documents/GitHub/TFG-Hospital/src/main/java/com/joseluu/hospital/service/DataSeeder.java)
- [SchedulingService.java](C:/Users/Josel/Documents/GitHub/TFG-Hospital/src/main/java/com/joseluu/hospital/service/SchedulingService.java)
- [AdvancedPayrollService.java](C:/Users/Josel/Documents/GitHub/TFG-Hospital/src/main/java/com/joseluu/hospital/service/AdvancedPayrollService.java)
- [PayrollService.java](C:/Users/Josel/Documents/GitHub/TFG-Hospital/src/main/java/com/joseluu/hospital/service/PayrollService.java)

Frontend:

- [front-end/lib/api.ts](C:/Users/Josel/Documents/GitHub/TFG-Hospital/front-end/lib/api.ts)
- [auth-context.tsx](C:/Users/Josel/Documents/GitHub/TFG-Hospital/front-end/contexts/auth-context.tsx)
- [dashboard-shell.tsx](C:/Users/Josel/Documents/GitHub/TFG-Hospital/front-end/components/dashboard/dashboard-shell.tsx)
- [admin operations](C:/Users/Josel/Documents/GitHub/TFG-Hospital/front-end/app/dashboard/admin/operations/page.tsx)
- [admin payrolls](C:/Users/Josel/Documents/GitHub/TFG-Hospital/front-end/app/dashboard/admin/payrolls/page.tsx)
- [worker payrolls](C:/Users/Josel/Documents/GitHub/TFG-Hospital/front-end/app/dashboard/worker/payrolls/page.tsx)

## 16. Conclusion

`TFG-Hospital` ya cubre bastante mas que una simple demo CRUD. Su valor diferencial esta en unir administracion, planificacion, nomina y comunicacion en una sola base de codigo. La arquitectura es comprensible y extensible, y el modelo documental encaja bien con la flexibilidad del dominio. El siguiente salto de calidad pasa por reforzar seguridad, validacion y pruebas automatizadas sin perder la amplitud funcional ya conseguida.
