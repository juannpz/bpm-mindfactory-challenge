# BPM de Trámites de Oficina

## Challenge Técnico - BPM de Trámites de Oficina

## Objetivo

Construir una plataforma BPM interna/externa para gestionar trámites entre áreas, empleados internos y usuarios externos.

El sistema debe soportar tres tipos de circuitos:

## 1. Interno → Interno

Un área interna inicia un trámite para otra área interna.

## 2. Interno → Externo

Un usuario interno inicia un trámite que requiere intervención de un usuario externo.

## 3. Externo → Interno

Un usuario externo inicia un trámite que debe ser procesado por áreas internas.

## Stack obligatorio

## Frontend

- React 19
- Next.js
- TypeScript
- Material UI
- Formik
- Yup
- React Context
- Vitest

## Backend

- Node.js
- NestJS
- Fastify
- Prisma ORM
- PostgreSQL
- Jest

## Arquitectura

- Clean Architecture
- DDD
- Casos de uso explícitos
- Repositorios desacoplados de Prisma
- Separación dominio / aplicación / infraestructura / presentación

## Auth

- Internos: Azure MSAL / Azure Entra ID (puede utilizar Auth2.0, OICD y/o Keycloak para emularlo)
- Externos: autenticación propia con email + password o magic link.
- Backend debe distinguir claramente ambos tipos de identidad.

## Infra / Tooling

- Docker Compose
- AWS documentado
- ESLint
- Prettier
- Husky
- Lint-Staged
- Conventional Commits

## Dominio

La plataforma debe permitir crear, asignar, procesar y auditar trámites de oficina.

## Tipos de trámite

Cada trámite pertenece a un tipo configurable.

Ejemplos:

- Solicitud de alta de proveedor.
- Solicitud de documentación.
- Pedido de autorización.
- Reclamo administrativo.
- Revisión legal.
- Solicitud de acceso.
- Aprobación de compra.

## 20 Usuarios

## Usuario interno

Representa empleados de la organización.

Campos mínimos:

- id
- nombre
- email
- área
- rol
- azureObjectId
- activo

Roles internos:

- ADMIN
- MESA_ENTRADA
- OPERADOR
- SUPERVISOR
- AUDITOR

## Usuario externo

Representa personas externas a la organización.

Campos mínimos:

- id
- nombre
- email
- documento
- organización
- estado
- fechaAlta

Estados:

- PENDIENTE_VERIFICACION
- ACTIVO
- BLOQUEADO

## Autenticación y autorización

## Internos

Los usuarios internos deben autenticarse usando Azure Entra ID / MSAL.

Se espera:

- login interno separado;
- validación de token en backend;
- mapeo de identidad Azure con usuario interno;
- protección de rutas internas;
- roles internos.

## Externos

Los usuarios externos deben autenticarse con un mecanismo separado.

Puede ser:

- email + password;
- magic link;
- OTP por email simulado.

Se espera:

- login externo separado;
- sesiones/JWT separados;
- protección de rutas externas;
- permisos limitados al propio usuario externo;
- imposibilidad de acceder a endpoints internos.

## Reglas de autorización

- Un usuario externo solo puede ver trámites donde participe.
- Un operador interno solo puede ver trámites asignados a su área.
- Un supervisor puede reasignar trámites de su área.
- Un admin puede ver y configurar todo.
- Un auditor puede ver todo, pero no modificar.

## Entidades principales

## Tramite

Campos:

- id
- numero
- tipoTramiteId
- titulo
- descripcion
- origen
- estado
- prioridad
- areaActualId
- usuarioAsignadoId
- usuarioExternoId
- creadoPorTipo
- creadoPorId
- fechaCreacion
- fechaActualizacion
- fechaCierre

Origen:

- INTERNO_INTERNO
- INTERNO_EXTERNO
- EXTERNO_INTERNO

Estados:

- BORRADOR
- INGRESADO
- EN_REVISION
- OBSERVADO
- ESPERANDO_EXTERNO
- ESPERANDO_INTERNO
- APROBADO
- RECHAZADO
- CANCELADO
- CERRADO

Prioridad:

- BAJA
- MEDIA
- ALTA
- URGENTE

## TipoTramite

Campos:

- id
- codigo
- nombre
- descripcion
- activo
- requiereExterno
- permiteInicioExterno
- slaHoras
- areaInicialId

## Area

Campos:

- id
- nombre
- codigo
- activa

## MovimientoTramite

Auditoría del workflow.

Campos:

- id
- tramiteId
- estadoAnterior
- estadoNuevo
- areaAnteriorId
- areaNuevaId
- usuarioTipo
- usuarioId
- accion
- comentario
- fecha

Acciones:

- CREAR
- INGRESAR
- TOMAR
- ASIGNAR
- DERIVAR
- OBSERVAR
- RESPONDER_OBSERVACION
- SOLICITAR_INTERVENCION_EXTERNA
- RESPONDER_INTERVENCION_EXTERNA
- APROBAR
- RECHAZAR
- CANCELAR
- CERRAR

## DocumentoTramite

## Campos:

- id
- tramiteId
- nombreArchivo
- mimeType
- size
- storageKey
- subidoPorTipo
- subidoPorId
- fechaCarga

## ComentarioTramite

## Campos:

- id
- tramiteId
- mensaje
- visibilidad
- autorTipo
- autorId
- fecha

Visibilidad:

- INTERNA
- EXTERNA
- TODOS

## Workflow mínimo obligatorio

## 1. Externo → Interno

## BORRADOR

→ INGRESADO
→ EN_REVISION
→ OBSERVADO
→ INGRESADO
→ EN_REVISION
→ APROBADO / RECHAZADO
→ CERRADO

## Reglas:

- Lo inicia un usuario externo.
- Solo puede usar tipos de trámite que permitan inicio externo.
- Mesa de entrada revisa el ingreso.
- Un operador interno puede observarlo.
- El externo puede responder observaciones.
- El interno puede aprobar o rechazar.
- Todo cambio debe quedar auditado.

## 2. Interno → Interno

## BORRADOR

→ INGRESADO
→ EN_REVISION
→ DERIVADO
→ EN_REVISION
→ APROBADO / RECHAZADO
→ CERRADO

## Reglas:

- Lo inicia un usuario interno.
- Debe tener área destino.
- Puede derivarse entre áreas.
- Solo usuarios internos pueden operar.
- El historial debe mostrar todas las áreas intervinientes.

## 3. Interno → Externo

## BORRADOR

→ INGRESADO
→ ESPERANDO_EXTERNO
→ ESPERANDO_INTERNO
→ EN_REVISION
→ APROBADO / RECHAZADO
→ CERRADO

## Reglas:

- Lo inicia un usuario interno.
- Debe estar vinculado a un usuario externo.
- El externo recibe una tarea o requerimiento.
- El externo responde o adjunta documentación.
- El interno continúa el trámite.

## Backend

Base path:

```
/api
```

Auth

```
POST /auth/external/register
POST /auth/external/login
POST /auth/external/logout
GET /auth/me
```

Para internos:
□
GET /auth/internal/me

La autenticación interna debe validar token Azure Entra ID o quedar implementada con mock seguro y documentación clara si se usa modo local.

## Trámites

```
GET /tramites
GET /tramites/:id
POST /tramites
PUT /tramites/:id
DELETE /tramites/:id
```

## Workflow

```
POST /tramites/:id/ingresar
POST /tramites/:id/tomar
POST /tramites/:id/asignar
POST /tramites/:id/derivar
POST /tramites/:id/observar
POST /tramites/:id/responder-observacion
POST /tramites/:id/solicitar-intervencion-externa
POST /tramites/:id/responder-intervencion-externa
POST /tramites/:id/aprobar
POST /tramites/:id/rechazar
```

POST /tramites/:id/cerrar
POST /tramites/:id/cancelar

## Documentos

```
POST /tramites/:id/documentos
GET /tramites/:id/documentos
GET /tramites/:id/documentos/:documentoId
DELETE /tramites/:id/documentos/:documentoId
```

## Comentarios

POST /tramites/:id/comentarios
GET /tramites/:id/comentarios

## Configuración

```
GET /tipos-tramite
POST /tipos-tramite
PUT /tipos-tramite/:id
GET /areas
POST /areas
PUT /areas/:id
```

## Dashboard

□
GET /dashboard

Debe devolver:

- trámites por estado;
- trámites por origen;
- trámites vencidos por SLA;
- promedio de resolución;
- cantidad por área;
- últimos movimientos.

## Backend - Reglas técnicas

Se espera:

1- Prisma ORM.

- PostgreSQL.
- Migraciones Prisma.
- Transacciones en cambios de workflow.
- Validaciones de dominio fuera de controllers.
- Casos de uso por acción de workflow.
- Guards separados para internos y externos.
- Decoradores para usuario autenticado.
- Manejo centralizado de excepciones.
- 422 para violaciones de negocio.
- 401 para no autenticado.
- 403 para no autorizado.
- 404 para recurso inexistente.
- Swagger/OpenAPI.
- Healthcheck.

## Reglas de negocio clave

- No se puede aprobar un trámite en BORRADOR .
- No se puede cerrar un trámite no aprobado/rechazado/cancelado.
- Un externo no puede ver trámites de otro externo.
- Un externo no puede ejecutar acciones internas.
- Un interno no puede responder como externo.
- Solo supervisor/admin puede reasignar.
- Toda transición debe generar MovimientoTramite.
- Toda transición debe ser atómica.
- No puede haber dos usuarios tomando el mismo trámite simultáneamente.
- Los comentarios internos no deben ser visibles para externos.
- Los documentos deben respetar visibilidad y permisos.
- Los trámites con SLA vencido deben marcarse en listados.

## Frontend

## Portales

La app debe tener dos experiencias separadas:

```
/interno
/externo
```

## Portal interno

Pantallas:

1. Login interno.
2. Dashboard operativo.
3. Bandeja de trámites.
4. Detalle de trámite.
5. Crear trámite interno.
6. Derivar/asignar trámite.
7. Aprobar/rechazar.
8. Solicitar intervención externa.
9. Configuración de tipos de trámite.
10. Configuración de áreas.

## Portal externo

Pantallas:

1. Registro externo.
2. Login externo.
3. Mis trámites.
4. Crear trámite externo.
5. Detalle del trámite.
6. Responder observación.
7. Adjuntar documentación.
8. Comentarios visibles.

## UX obligatoria

- Layout diferenciado para internos y externos.
- Material UI.
- Tablas paginadas.
- Filtros por estado, área, prioridad y fecha.
- Estados loading/empty/error.
- Feedback con snackbar/toast.
- Confirmaciones para acciones críticas.
- Timeline visual de movimientos.
- Badges de estado y prioridad.
- Formularios con Formik + Yup.
- Validación client-side y server-side.
- Manejo de errores 401 , 403 , 404 , 422 .

## Testing

## Backend - Jest

Unit tests obligatorios:

- reglas de transición de estados;
- permisos internos;
- permisos externos;
- creación de trámite externo;
- creación de trámite interno;
- observación;
- respuesta de observación;
- aprobación;
- rechazo;
- cierre;
- visibilidad de comentarios;
- cálculo de SLA.

Integration tests obligatorios:

- login externo;
- crear trámite externo;
- tomar trámite interno;
- observar trámite;
- responder observación como externo;
- aprobar trámite;
- consultar historial;
- validar que externo no vea trámites ajenos;
- validar 403 en acciones no permitidas;
- validar concurrencia al tomar trámite.

## Frontend - Vitest

Tests mínimos:

- formulario de login externo;
- formulario de creación de trámite;
- bandeja de trámites;
- filtros;
- timeline;
- acciones de workflow;
- render de errores;
- guards de rutas internas/externas.

## Docker

Debe incluir:

- docker-compose.yml
- servicio db
- servicio api
- servicio web
- healthchecks
- volumen persistente para PostgreSQL
- .env.example
- Dockerfile backend multi-stage
- Dockerfile frontend multi-stage

Debe levantar con:

```
docker compose up -d --build
```

URLs esperadas:

```
Frontend: http://localhost:3000
Backend: http://localhost:3001/api
Swagger: http://localhost:3001/api/docs
```

## Seeds

Debe incluir:

- 3 áreas internas.
- 5 usuarios internos.
- 3 usuarios externos.
- 4 tipos de trámite.
- 10 trámites con distintos estados.
- historial de movimientos.
- comentarios internos y externos.
- documentos simulados.

## © Documentación obligatoria

## README

Debe incluir:

- cómo levantar con Docker;
- cómo correr migraciones Prisma;
- cómo correr seeds;
- cómo correr tests;
- cómo acceder al portal interno;
- cómo acceder al portal externo;
- credenciales seed;
- endpoints principales;
- supuestos funcionales.

## docs/DECISION_LOG.md

Debe explicar:

- diseño del dominio;
- agregados;
- casos de uso;
- separación Clean Architecture / DDD;
- estrategia de autenticación interna/externa;
- estrategia de autorización;
- validaciones;
- transacciones;
- concurrencia;
- trade-offs.

## docs/PRODUCTION_NOTES.md

Debe explicar:

- cómo validar en producción;
- métricas relevantes;
- logs relevantes;
- alertas mínimas;
- riesgos conocidos;
- rollback;
- monitoreo;
- seguridad.

## docs/AWS_DEPLOYMENT.md

Debe proponer despliegue en AWS usando, por ejemplo:

- ECS Fargate;
- RDS PostgreSQL;
- ALB;
- Secrets Manager;
- CloudWatch Logs;
- S3/CloudFront;
- WAF;
- estrategia de migraciones;
- estrategia de rollback.

## Git Workflow

Se espera:

- ramas separadas por feature;
- commits en Conventional Commits;
- mínimo 4 PRs reales o simuladas:
- feat/auth-internal-external
- feat/backend-workflow-domain
- feat/frontend-portals
- feat/docker-tests-docs

Cada PR debe incluir:

- qué se hizo;
- por qué;
- cómo se probó;
- trade-offs.

## Checklist de aceptación

- [ ] docker compose up -d –build levanta db, api y web.
- [ ] Portal interno disponible.
- [ ] Portal externo disponible.
- [ ] Login externo funcional.
- [ ] Auth interna implementada o mock documentado.
- [ ] Usuarios internos y externos tienen permisos separados.
- [ ] Se puede crear trámite externo → interno.
- [ ] Se puede crear trámite interno → interno.
- [ ] Se puede crear trámite interno → externo.
- [ ] Se puede tomar, derivar, observar, responder, aprobar, rechazar y cerrar.
- [ ] Todo cambio genera movimiento de auditoría.
- [ ] Timeline visible en frontend.
- [ ] Comentarios internos no son visibles para externos.
- [ ] Externo no puede ver trámites ajenos.
- [ ] 401, 403, 404, 422 correctamente manejados.
- [ ] Tests backend pasan.
- [ ] Tests frontend pasan.
- [ ] Prisma migrations disponibles.
- [ ] Seeds disponibles.
- [ ] README completo.
- [ ] Decision log completo.
- [ ] Production notes completo.
- [ ] AWS deployment doc completo.

## Criterios de evaluación

| Criterio                                                      | Puntos |
| ------------------------------------------------------------- | ------ |
| Modelado BPM, workflow y reglas de negocio                    | 15     |
| Auth interna/externa y autorización                           | 15     |
| Clean Architecture / DDD backend                              | 15     |
| Prisma, PostgreSQL, migraciones, transacciones y concurrencia | 10     |
| Frontend Next.js, React, Material UI y UX operacional         | 15     |
| Formularios, validaciones y manejo de errores                 | 8      |
| Testing unitario e integración                                | 10     |
| Docker, tooling y DX                                          | 5      |
| Git workflow profesional                                      | 4      |
| Documentación técnica y producción                            | 3      |

Total: 100 pts.

## Bonus

Hasta 10 puntos extra:

- Azure MSAL / Entra ID real para internos.
- Magic link real para externos.
- Notificaciones por email.
- Auditoría avanzada.
- CI con GitHub Actions.
- Deploy público.
- OpenTelemetry.
- Playwright/Cypress.
- Storybook.
- Búsqueda full-text.
- Adjuntos reales en S3 o MinIO.

## Entrega

A partir de la recepcion del mismo, posee 7 dias corridos para la entrega.
Enviar mail a: **challenge@mindfactory.ar**

Con:

- link al repositorio público;
- link al deploy, si existe;
- breve explicación de decisiones relevantes;
- bonus implementados;
- credenciales de prueba.
- NestJS sobre Fastify.

**Dudas:** podés escribirnos a **alex.boulchouk@mindfactory.ar**

---
