# Documento Tecnico Completo - TFG-Hospital

## 1. Resumen Ejecutivo

`TFG-Hospital` es una aplicacion full stack para gestion hospitalaria compuesta por:

- Backend `Spring Boot 4.0.2` con `Java 17`
- Frontend `Next.js 16` con `React 19`
- Base de datos `MongoDB`

El sistema implementa tres perfiles:

- `ROOT`: administracion central
- `HOSPITAL_ADMIN`: administracion de un hospital
- `WORKER`: trabajador del hospital

Funciones principales:

- autenticacion y sesion
- gestion de hospitales
- gestion de trabajadores
- anuncios internos
- solicitudes de ausencia
- nominas
- chat interno
- grupos de trabajo
- notificaciones
- estadisticas globales

## 2. Estado Actual Verificado

Verificaciones realizadas sobre este repositorio:

- `gradlew test`: correcto
- `npm run lint`: correcto
- `npm run build`: correcto
- MongoDB en `localhost:27017`: accesible

## 3. Arquitectura del Proyecto

### 3.1 Backend

Ruta principal:

- `src/main/java/com/joseluu/hospital`

Capas:

- `controller`: expone endpoints REST
- `service`: logica de negocio
- `repository`: acceso a MongoDB
- `entity`: documentos persistidos
- `dto`: contratos de entrada/salida

Tecnologias:

- `spring-boot-starter-webmvc`
- `spring-boot-starter-data-mongodb`
- `lombok`

### 3.2 Frontend

Ruta principal:

- `front-end`

Tecnologias:

- `Next.js 16.1.6`
- `React 19.2.4`
- `TypeScript`
- `Axios`
- `Tailwind CSS 4`
- `Radix UI`
- `Sonner`

Estructura relevante:

- `app/`: paginas y rutas
- `components/`: UI y componentes de negocio
- `contexts/auth-context.tsx`: estado de autenticacion
- `lib/api.ts`: cliente HTTP y tipos

### 3.3 Base de Datos

Motor:

- `MongoDB`

Configuracion actual:

- URI: `mongodb://localhost:27017/hospital`
- Base de datos: `hospital`

Archivo:

- `src/main/resources/application.properties`

## 4. Arranque del Sistema

### 4.1 Backend

Desde la raiz:

```powershell
.\gradlew bootRun
```

Expone la API en:

- `http://localhost:8080`

### 4.2 Frontend

Desde `front-end`:

```powershell
npm install
npm run dev
```

Expone la interfaz en:

- `http://localhost:3000`

### 4.3 Integracion front-back

El frontend usa rewrite de Next:

- `/api/*` -> `http://localhost:8080/api/*`

Archivo:

- `front-end/next.config.mjs`

## 5. Autenticacion

### 5.1 Como funciona

La autenticacion actual no usa JWT real. Usa tokens aleatorios en memoria:

- `accessToken`
- `refreshToken`

Importante:

- las sesiones se pierden al reiniciar el backend
- las contrasenas se comparan en texto plano
- no existe Spring Security con filtros reales

Servicio:

- `AuthService`

### 5.2 Endpoints de autenticacion

Base:

- `/api/auth`

Endpoints:

1. `POST /login`
   - Body:
   ```json
   {
     "email": "admin@hospital-reina-sofia.com",
     "password": "admin123"
   }
   ```
   - Respuesta:
   ```json
   {
     "accessToken": "string",
     "refreshToken": "string",
     "user": {}
   }
   ```

2. `POST /refresh`
   - Body:
   ```json
   {
     "refreshToken": "string"
   }
   ```

3. `POST /logout`
   - Header: `Authorization: Bearer <token>`

4. `GET /me`
   - Header: `Authorization: Bearer <token>`

## 6. Roles y Permisos Funcionales

### 6.1 ROOT

Puede:

- ver estadisticas globales
- listar, crear, editar, suspender y eliminar hospitales
- usar chat de soporte

### 6.2 HOSPITAL_ADMIN

Puede:

- gestionar trabajadores
- gestionar anuncios del hospital
- revisar solicitudes de ausencia
- emitir nominas
- crear chats privados
- crear grupos de trabajo

### 6.3 WORKER

Puede:

- ver su calendario
- ver y crear sus solicitudes de ausencia
- ver sus nominas
- participar en chats
- editar su perfil

## 7. Endpoints REST Completos

## 7.1 Admin global

Base:

- `/api/admin`

Endpoints:

- `GET /stats`
  - devuelve `GlobalStatsDto`

## 7.2 Hospitales

Base:

- `/api/hospitals`

Endpoints:

1. `GET /`
   - lista hospitales

2. `GET /{id}`
   - detalle de hospital

3. `POST /`
   - crea hospital
   - body:
   ```json
   {
     "name": "Hospital Norte",
     "address": "Calle X",
     "city": "Cordoba",
     "province": "Cordoba",
     "taxId": "B12345678",
     "adminEmail": "admin@hospitalnorte.com"
   }
   ```
   - comportamiento actual:
     - crea hospital en estado `PENDING_REVIEW`
     - crea usuario `HOSPITAL_ADMIN` si el email no existe
     - password temporal por defecto: `admin123`

4. `PUT /{id}`
   - actualiza datos del hospital

5. `PATCH /{id}/status`
   - body:
   ```json
   {
     "status": "ACTIVE"
   }
   ```

6. `DELETE /{id}`
   - elimina el hospital
   - ademas elimina usuarios, nominas, solicitudes, grupos y chats asociados

### 7.2.1 Anuncios de hospital

1. `POST /{id}/announcements`
   - requiere `Authorization`

2. `PUT /{id}/announcements/{announcementId}`

3. `DELETE /{id}/announcements/{announcementId}`

DTO de anuncio:

```json
{
  "id": "string",
  "title": "string",
  "content": "string",
  "priority": "LOW | MEDIUM | HIGH",
  "authorId": "string",
  "publishedAt": "string",
  "expiresAt": "string",
  "active": true
}
```

## 7.3 Usuarios

Base:

- `/api/users`

Endpoints:

1. `GET /`
   - lista todos los usuarios

2. `GET /{id}`
   - obtiene un usuario concreto

3. `POST /`
   - crea trabajador

4. `PUT /{id}`
   - actualiza usuario concreto
   - soporta:
     - `firstName`
     - `lastName`
     - `email`
     - `phone`
     - `dni`
     - `imageURL`
     - `department`
     - `jobTitle`
     - `baseSalary`
     - `enabled`
     - `accountNonLocked`
     - `password`

### 7.3.1 Autoservicio

1. `GET /me/calendar?month=YYYY-MM`
   - calendario del usuario autenticado

2. `GET /me/leave-requests`
   - solicitudes del usuario autenticado

3. `POST /me/leave-requests`
   - body:
   ```json
   {
     "startDate": "2026-04-15",
     "endDate": "2026-04-20",
     "reason": "Vacaciones"
   }
   ```

4. `PUT /me`
   - actualiza perfil propio

## 7.4 Solicitudes de ausencia

Base:

- `/api/leave-requests`

Endpoints:

1. `GET /?status=PENDING`
   - lista por estado
   - si no se indica, usa `PENDING`

2. `PATCH /{userId}/{requestId}`
   - body:
   ```json
   {
     "status": "APPROVED",
     "reviewComment": "Aprobado"
   }
   ```

Estados:

- `PENDING`
- `APPROVED`
- `REJECTED`

## 7.5 Nominas

Base:

- `/api/payrolls`

Endpoints:

1. `GET /`
   - lista nominas
   - admite `workerId`
   - `workerId=me` usa el usuario autenticado

2. `GET /{id}`

3. `POST /`
   - crea nomina

4. `PATCH /{id}/status`
   - body:
   ```json
   {
     "status": "ISSUED"
   }
   ```

5. `GET /{id}/pdf`
   - devuelve bytes con `application/pdf`
   - actualmente genera contenido simple, no PDF avanzado real

Estados:

- `DRAFT`
- `ISSUED`
- `ACKNOWLEDGED`

## 7.6 Chats

Base:

- `/api/chats`

Endpoints:

1. `GET /`
   - chats del usuario autenticado

2. `GET /{chatId}/messages`
   - mensajes del chat

3. `POST /{chatId}/messages`
   - body:
   ```json
   {
     "content": "Hola"
   }
   ```

4. `POST /private`
   - body:
   ```json
   {
     "userId": "otro-usuario"
   }
   ```

5. `PATCH /{chatId}/read`
   - marca mensajes como leidos

Tipos de chat:

- `PRIVATE`
- `GROUP`
- `HOSPITAL`
- `SUPPORT`

## 7.7 Grupos de trabajo

Base:

- `/api/work-groups`

Endpoints:

1. `GET /`
   - grupos del hospital del usuario autenticado

2. `GET /{id}`

3. `POST /`
   - crea grupo y chat asociado
   - body:
   ```json
   {
     "name": "Equipo de Urgencias",
     "description": "Coordinacion",
     "members": ["id1", "id2"]
   }
   ```

4. `PUT /{id}`
   - actualiza grupo y sincroniza participantes del chat

5. `DELETE /{id}`

6. `POST /{id}/members`
   - body:
   ```json
   {
     "userId": "id-usuario"
   }
   ```

7. `DELETE /{id}/members/{userId}`

## 7.8 Notificaciones

Base:

- `/api/notifications`

Endpoints:

1. `GET /me`
   - notificaciones del usuario autenticado

2. `POST /{notificationId}/read`
   - marca una notificacion como leida

## 8. Modelo de Datos MongoDB

## 8.1 Coleccion `users`

Campos:

- `id`
- `firstName`
- `lastName`
- `imageURL`
- `email`
- `password`
- `phone`
- `dateOfBirth`
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
- `leaveRequestIds[]`
- `createdAt`
- `updatedAt`

## 8.2 Coleccion `hospitals`

Campos:

- `id`
- `name`
- `address`
- `city`
- `province`
- `taxId`
- `status`
- `superAdminId`
- `announcements[]`
- `createdAt`
- `updatedAt`

## 8.3 Coleccion `leave_requests`

Campos:

- `id`
- `userId`
- `startDate`
- `endDate`
- `reason`
- `status`
- `requestedAt`
- `reviewedAt`
- `reviewComment`

## 8.4 Coleccion `payrolls`

Campos:

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

## 8.5 Coleccion `chats`

Campos:

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

## 8.6 Coleccion `chat_messages`

Campos:

- `id`
- `chatId`
- `senderId`
- `senderImageURL`
- `senderName`
- `content`
- `timestamp`
- `read`

## 8.7 Coleccion `work_groups`

Campos:

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

## 8.8 Coleccion `notifications`

Campos:

- `id`
- `userId`
- `type`
- `message`
- `link`
- `read`
- `createdAt`

## 9. Datos Semilla

El backend carga datos automaticamente si las colecciones estan vacias mediante `DataSeeder`.

Se crean:

- 1 hospital
- 1 usuario `ROOT`
- 1 usuario `HOSPITAL_ADMIN`
- 1 usuario `WORKER`
- 1 solicitud de ausencia
- 1 nomina
- chats iniciales
- 1 grupo de trabajo

Credenciales iniciales:

- `superadmin@trassierra.com` / `admin123`
- `admin@hospital-reina-sofia.com` / `admin123`
- `trabajador@hospital-reina-sofia.com` / `worker123`

## 10. Frontend: Pantallas y Flujos

### 10.1 Rutas principales

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
- `/dashboard/admin/chat`
- `/dashboard/worker`
- `/dashboard/worker/calendar`
- `/dashboard/worker/leave-requests`
- `/dashboard/worker/payrolls`
- `/dashboard/worker/chat`
- `/dashboard/settings`

### 10.2 Cliente API

Archivo:

- `front-end/lib/api.ts`

Funciones:

- añade `Authorization: Bearer <token>`
- intenta refresh automatico ante `401`
- redirige a `/login` si el refresh falla

## 11. Cambios Aplicados en Esta Actualizacion

### 11.1 Backend

- se anadieron `GET /api/users/{id}` y `PUT /api/users/{id}`
- se amplio `UpdateUserRequestDto` para soportar campos realmente usados por el frontend
- se hizo actualizacion parcial de usuarios desde servicio
- crear hospital ahora crea su admin asociado si se informa `adminEmail`
- eliminar hospital ahora limpia datos relacionados

### 11.2 Frontend

- se reparo el JSX roto en `dashboard/root/hospitals`
- se refactorizo `new-chat-dialog` para evitar componentes creados durante render
- se configuro correctamente `turbopack.root`
- se sustituyeron imagenes conflictivas para dejar `eslint` limpio

## 12. Riesgos y Limitaciones Tecnicas

Puntos importantes del estado actual:

- autenticacion en memoria, no persistente
- contrasenas sin hash real
- no hay autorizacion fuerte por rol en controladores
- el generador de PDF de nominas es basico
- hay validaciones de negocio minimas en varias operaciones

## 13. Mejoras Recomendadas

Prioridad alta:

- migrar autenticacion a JWT real con expiracion persistente
- hashear contrasenas con `BCrypt`
- aplicar autorizacion por rol
- quitar `ignoreBuildErrors`
- anadir tests de integracion de endpoints

Prioridad media:

- generar PDF real de nominas
- validaciones DTO con Bean Validation
- manejo global de excepciones
- logs estructurados

## 14. Ficheros Clave del Proyecto

Backend:

- `src/main/java/com/joseluu/hospital/RunApp.java`
- `src/main/java/com/joseluu/hospital/controller/*`
- `src/main/java/com/joseluu/hospital/service/*`
- `src/main/java/com/joseluu/hospital/entity/*`
- `src/main/resources/application.properties`

Frontend:

- `front-end/app/*`
- `front-end/components/*`
- `front-end/contexts/auth-context.tsx`
- `front-end/lib/api.ts`
- `front-end/next.config.mjs`

## 15. Conclusion

El proyecto queda documentado sobre su implementacion real actual y con los desajustes principales entre frontend y backend corregidos. A dia de esta revision:

- backend compila y pasa tests
- frontend linta y construye correctamente
- MongoDB local responde
- los flujos principales del panel ya consumen endpoints existentes

Si quieres, el siguiente paso razonable es que te deje tambien un `README.md` principal reescrito y coherente con este `documento.md`, o una coleccion `Postman`/`Bruno` con todos los endpoints listos para probar.
