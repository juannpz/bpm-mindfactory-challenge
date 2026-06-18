# BPM de Trámites de Oficina

Plataforma BPM para gestionar trámites entre áreas internas y usuarios externos. Soporta tres circuitos: Interno→Interno, Interno→Externo y Externo→Interno.

## Stack Tecnológico

| Capa     | Tecnología                                                          |
| -------- | ------------------------------------------------------------------- |
| Frontend | React 19, Next.js 15+, TypeScript, Material UI, Formik, Yup         |
| Backend  | Node.js 24, NestJS 11, Fastify, Prisma 7, PostgreSQL                |
| Auth     | Azure Entra ID / Mock OIDC (internos) + JWT + Magic Link (externos) |
| Tooling  | ESLint, Prettier, Husky, lint-staged, commitlint                    |
| Infra    | Docker Compose, AWS documentado                                     |

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

### Autenticación Azure Entra ID (producción)

Para usar autenticación real con Azure Entra ID en lugar del mock:

```env
# Backend .env
MOCK_AUTH=false
AZURE_TENANT_ID=<tenant-id>
AZURE_CLIENT_ID=<client-id>

# Frontend
NEXT_PUBLIC_MOCK_AUTH=false
NEXT_PUBLIC_AZURE_CLIENT_ID=<client-id>
NEXT_PUBLIC_AZURE_TENANT_ID=<tenant-id>
```

La validación de tokens se hace contra los JWKS de Azure (`login.microsoftonline.com/{tenantId}/discovery/v2.0/keys`), verificando firma RS256/RS384, issuer, audience y expiración. El claim `oid` se mapea a `UsuarioInterno.azureObjectId`.

### Magic Link (externos)

Los usuarios externos pueden iniciar sesión sin contraseña mediante magic link:

- `POST /api/auth/external/magic-link/request` — Solicitar enlace (recibe `{ email }`)
- `POST /api/auth/external/magic-link/verify` — Verificar token e iniciar sesión

**Modo desarrollo (sin SMTP):** el enlace mágico se devuelve en la respuesta del endpoint y se muestra en el frontend para testing.

**Modo producción con email real:** configurar SMTP en `.env`:

```env
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=<api-key>
SMTP_FROM=bpm@tudominio.com
```

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
- `POST /api/auth/external/login` — Login con email + contraseña (devuelve JWT)
- `POST /api/auth/external/magic-link/request` — Solicitar magic link sin contraseña
- `POST /api/auth/external/magic-link/verify` — Verificar token de magic link (devuelve JWT)
- `POST /api/auth/internal/login` — Login interno (mock OIDC o Azure Entra ID)
- `GET /api/auth/me` — Datos del usuario autenticado
- `GET /api/auth/internal/me` — Datos del usuario interno

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

- La autenticación interna funciona en dos modos: mock local (OIDC con RS256, default) y Azure Entra ID (producción, configurable con `MOCK_AUTH=false`).
- El magic link para externos es funcional: en modo dev muestra el link en pantalla; con SMTP configurado envía email real.
- El almacenamiento de documentos es local (`uploads/`). Para producción se recomienda S3 o MinIO.
- Las contraseñas de usuarios externos se hashean con bcrypt (10 rounds).
- El optimistic locking usa un campo `version` en la tabla Tramite.
- Las reglas de negocio y transiciones de estado están implementadas en el dominio, no en los controllers.
