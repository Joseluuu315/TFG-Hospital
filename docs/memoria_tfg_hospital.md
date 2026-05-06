Title: TFG-Hospital
Subtitle: Plataforma web para la gestion integral de hospitales y la coordinacion operativa del personal
Document: Memoria tecnica resumida
Author: Jose Luis Fuentes Parra
Tutor: Por completar
AcademicYear: 2025/2026
LocationDate: Cordoba, mayo de 2026
Center: CFGS Desarrollo de Aplicaciones Multiplataforma

# 1. Introduccion

TFG-Hospital es una aplicacion web full stack orientada a centralizar la gestion de hospitales desde una sola plataforma. El proyecto cubre administracion de centros, gestion de trabajadores, ausencias, configuracion de turnos, autoasignacion, nomina avanzada, chat interno, notificaciones y auditoria.

La solucion se compone de:

- backend REST con Spring Boot y MongoDB
- frontend con Next.js, React y TypeScript

# 2. Objetivo del proyecto

El objetivo principal es unificar procesos administrativos y operativos que normalmente aparecen dispersos entre hojas de calculo, mensajes y herramientas separadas. La plataforma busca:

- simplificar la gestion del personal
- mejorar la trazabilidad
- automatizar parte de la planificacion
- dejar una base escalable para ampliaciones futuras

# 3. Arquitectura del sistema

## 3.1 Backend

El backend se organiza por capas:

- `controller`
- `service`
- `repository`
- `entity`
- `dto`

Servicios especialmente relevantes:

- `AuthService`
- `HospitalService`
- `SchedulingService`
- `AdvancedPayrollService`
- `PayrollService`
- `NotificationService`
- `AuditLogService`

## 3.2 Frontend

El frontend usa rutas separadas por rol:

- `ROOT`
- `HOSPITAL_ADMIN`
- `WORKER`

Se apoya en:

- `app/` para rutas
- `components/` para UI y componentes de dominio
- `contexts/` para sesion y estado compartido
- `lib/api.ts` para integracion con la API

# 4. Tecnologias utilizadas

- Java 17
- Spring Boot 4
- Spring Data MongoDB
- Spring Web MVC
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Radix UI
- MongoDB

# 5. Modulos funcionales

## 5.1 Autenticacion

Login, refresh y sesion funcional mediante tokens en memoria. Es valida para un entorno academico o demo, aunque no equivale a una solucion de produccion completa.

## 5.2 Gestion de hospitales

Permite:

- alta
- edicion
- cambio de estado
- baja
- anuncios internos

## 5.3 Gestion de trabajadores

Incluye:

- alta y edicion de perfiles
- asociacion a hospital
- departamento y puesto
- calendario
- salario base
- contrato activo

## 5.4 Ausencias

Los trabajadores pueden solicitar dias libres y la administracion puede aprobar o rechazar. El sistema contempla ausencias pagadas y no pagadas.

## 5.5 Operaciones y turnos

El proyecto incorpora:

- reglas operativas por hospital
- tipos de turno
- demandas por fecha y departamento
- autoasignacion
- asignacion manual

La autoasignacion evita solapes, revisa descansos, intenta no superar horas semanales y prioriza candidatos del mismo departamento.

## 5.6 Nomina avanzada

La nomina se calcula desde:

- contrato activo
- turnos del periodo
- nocturnidad
- fin de semana o festivo
- horas extra
- ausencias aprobadas
- ajustes manuales

El resultado queda guardado como resumen y como lineas detalladas para poder explicar el calculo.

## 5.7 Comunicacion y trazabilidad

El sistema dispone de:

- chats privados
- chats de hospital
- grupos de trabajo
- chat de soporte
- notificaciones
- auditoria

# 6. Modelo de datos

MongoDB se usa con un modelo documental. Las colecciones principales son:

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

Relaciones logicas:

- un hospital agrupa trabajadores, configuracion y actividad
- un trabajador puede tener contrato, ausencias, turnos y nominas
- las demandas de turno generan asignaciones
- la nomina se apoya en lineas y ajustes

# 7. Datos semilla

El proyecto incluye `DataSeeder`, que crea datos demo cuando las colecciones estan vacias. El escenario actual deja preparado:

- 1 hospital
- 1 root
- 1 admin hospitalario
- 3 trabajadores
- contratos activos
- ausencias
- demandas para autoasignacion
- turnos del mes
- ajustes de nomina
- chats y grupo de urgencias

Esto permite probar tanto la autoasignacion como la generacion de nomina y su PDF.

# 8. Ejecucion local

Backend:

```powershell
.\gradlew bootRun
```

Frontend:

```powershell
cd front-end
npm install
npm run dev
```

Puertos por defecto:

- backend: `http://localhost:8080`
- frontend: `http://localhost:3000`

# 9. Limitaciones actuales

- sesion en memoria
- seguridad de servidor mejorable
- necesidad de mover secretos fuera de ficheros versionados
- build local condicionado por dependencias externas y red

# 10. Conclusion

TFG-Hospital ya funciona como una plataforma de gestion hospitalaria con bastante mas profundidad que un CRUD basico. El valor diferencial del proyecto esta en unir administracion, turnos, nomina y comunicacion dentro del mismo sistema, con una estructura tecnica suficientemente clara para evolucionar a futuro.

Para el detalle tecnico completo y la explicacion extendida del modelo de datos, consultar:

- [README.md](C:/Users/Josel/Documents/GitHub/TFG-Hospital/README.md)
- [documento.md](C:/Users/Josel/Documents/GitHub/TFG-Hospital/documento.md)
