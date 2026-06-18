# BPM de Trámites de Oficina

Plataforma BPM para gestionar trámites entre áreas internas y usuarios externos. Soporta tres circuitos: Interno→Interno, Interno→Externo y Externo→Interno.

## Stack Tecnológico

| Capa     | Tecnología                                                  |
| -------- | ----------------------------------------------------------- |
| Frontend | React 19, Next.js 15+, TypeScript, Material UI, Formik, Yup |
| Backend  | Node.js 24, NestJS 11, Fastify, Prisma 7, PostgreSQL        |
| Auth     | Mock Azure (header `X-Mock-User-Id`) + JWT externo (bcrypt) |
| Tooling  | ESLint, Prettier, Husky, lint-staged, commitlint            |
| Infra    | Docker Compose, AWS documentado                             |

## Requisitos previos

- Node.js 20+
- Docker y Docker Compose (recomendado)
- PostgreSQL 16 (opcional si se usa Docker)

## Cómo levantar con Docker

```bash
git clone <repo>
cd bpm-mindfactory-challenge
cp .env.example .env
docker compose up -d --build
```

## URLs

| Servicio       | URL                                   |
| -------------- | ------------------------------------- |
| Frontend       | `http://localhost:3000`               |
| Backend API    | `http://localhost:3001/api`           |
| Swagger        | `http://localhost:3001/api/docs`      |
| Portal interno | `http://localhost:3000/interno/login` |
| Portal externo | `http://localhost:3000/externo/login` |

## Cómo correr migraciones (sin Docker)

Requiere PostgreSQL corriendo en `localhost:5432` con usuario `bpm`, password `bpm` y base `bpm_db`.

```bash
cd backend
cp ../.env.example .env
npx prisma migrate dev
```

> `DATABASE_URL` en `.env.example` apunta a `localhost`. Docker Compose sobreescribe esta variable con `@db:5432` automáticamente, por lo que el mismo archivo funciona en ambos entornos.

## Cómo correr seeds

```bash
cd backend
npx prisma db seed
```

## Cómo correr tests

```bash
cd backend && npm test
cd frontend && npm test
```

## Credenciales Seed

### Usuarios Internos (Mock Auth via header `X-Mock-User-Id`)

| Nombre                    | Rol          | Área            | Azure Object ID  |
| ------------------------- | ------------ | --------------- | ---------------- |
| Admin General             | ADMIN        | Mesa de Entrada | `mock-admin-001` |
| Operador Mesa de Entrada  | MESA_ENTRADA | Mesa de Entrada | `mock-mesa-001`  |
| Supervisor Administración | SUPERVISOR   | Administración  | `mock-sup-001`   |
| Operador Legal            | OPERADOR     | Legales         | `mock-legal-001` |
| Auditor                   | AUDITOR      | Administración  | `mock-audit-001` |

### Usuarios Externos

| Nombre       | Email               | Password       | Estado                 |
| ------------ | ------------------- | -------------- | ---------------------- |
| Juan Pérez   | `externo1@test.com` | `Password123!` | ACTIVO                 |
| María García | `externo2@test.com` | `Password123!` | ACTIVO                 |
| Carlos López | `externo3@test.com` | `Password123!` | PENDIENTE_VERIFICACION |

### Áreas

| Nombre          | Código |
| --------------- | ------ |
| Mesa de Entrada | ME     |
| Administración  | ADM    |
| Legales         | LEG    |

### Tipos de Trámite

| Código                   | Nombre                 | SLA | Permite inicio externo |
| ------------------------ | ---------------------- | --- | ---------------------- |
| SOLICITUD_ALTA_PROVEEDOR | Alta de Proveedor      | 48h | No                     |
| RECLAMO_ADMINISTRATIVO   | Reclamo Administrativo | 72h | Sí                     |
| REVISION_LEGAL           | Revisión Legal         | 96h | No                     |
| SOLICITUD_ACCESO         | Solicitud de Acceso    | 24h | Sí                     |

## Endpoints Principales

### Auth

- `POST /api/auth/external/register` — Registro de usuario externo
- `POST /api/auth/external/login` — Login de usuario externo (devuelve JWT)
- `GET /api/auth/me` — Datos del usuario autenticado

### Trámites

- `GET /api/tramites` — Listar trámites (con filtros)
- `GET /api/tramites/:id` — Obtener trámite
- `POST /api/tramites` — Crear trámite
- `PUT /api/tramites/:id` — Actualizar trámite (solo en BORRADOR)

### Workflow

- `POST /api/tramites/:id/ingresar`
- `POST /api/tramites/:id/tomar`
- `POST /api/tramites/:id/asignar`
- `POST /api/tramites/:id/derivar`
- `POST /api/tramites/:id/observar`
- `POST /api/tramites/:id/responder-observacion`
- `POST /api/tramites/:id/solicitar-intervencion-externa`
- `POST /api/tramites/:id/responder-intervencion-externa`
- `POST /api/tramites/:id/aprobar`
- `POST /api/tramites/:id/rechazar`
- `POST /api/tramites/:id/cerrar`
- `POST /api/tramites/:id/cancelar`

### Otros

- `GET /api/dashboard` — Dashboard con métricas
- `GET /api/health` — Healthcheck
- `GET /api/tipos-tramite` — Configuración de tipos de trámite
- `GET /api/areas` — Configuración de áreas

## Supuestos funcionales

- La autenticación interna usa modo mock con header `X-Mock-User-Id`. En producción debe configurarse Azure Entra ID.
- El almacenamiento de documentos es local (`uploads/`). Para producción se recomienda S3 o MinIO.
- Las contraseñas de usuarios externos se hashean con bcrypt (10 rounds).
- El optimistic locking usa un campo `version` en la tabla Tramite.
- Las reglas de negocio y transiciones de estado están implementadas en el dominio, no en los controllers.
