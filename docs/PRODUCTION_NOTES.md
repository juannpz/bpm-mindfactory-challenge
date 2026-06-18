# Production Notes — BPM de Trámites de Oficina

Guía operativa para validación, monitoreo y gestión en producción.

> **Deploy actual:** `https://bpm-challenge.kaijuplatform.com`  
> **Plataforma:** Coolify v4 (Docker Compose)  
> **Infra:** PostgreSQL 16, NestJS + Fastify, Next.js 16

---

## 1. Cómo validar en producción

### Healthcheck

```
GET https://bpm-challenge.kaijuplatform.com/api/health
```

Devuelve `{ status: "ok", timestamp, uptime }`. Debe responder 200.

### Smoke test manual

1. Login externo: `POST /api/auth/external/login` con `{ email: "externo1@test.com", password: "Password123!" }` → debe devolver JWT.
2. `GET /api/auth/me` con el token → debe devolver datos del usuario externo.
3. `GET /api/tramites` con token externo → solo trámites donde participa ese usuario.
4. Login interno mock: `POST /api/auth/internal/login` con `{ azureObjectId: "mock-admin-001" }` → debe devolver JWT.
5. `GET /api/auth/internal/me` con token interno → datos del usuario ADMIN.
6. Magic link: `POST /api/auth/external/magic-link/request` con `{ email: "externo1@test.com" }` → devuelve `devLink` (sin SMTP configurado).
7. `POST /api/auth/external/magic-link/verify` con el token del devLink → devuelve JWT.
8. Endpoint protegido sin auth → 401.
9. Usuario externo intentando `POST /api/tramites/:id/aprobar` → 403.
10. Usuario OPERADOR viendo trámites de otra área → no aparecen en listado.

### Validación de permisos

- Usuario externo → solo ve trámites propios.
- Usuario OPERADOR/MESA_ENTRADA → solo ve trámites de su área.
- Usuario ADMIN/AUDITOR → ve todos los trámites.
- Solo ADMIN/SUPERVISOR puede reasignar.
- Usuario externo no puede ejecutar acciones de workflow internas.

---

## 2. Métricas relevantes

| Métrica                       | Fuente                                           | Threshold                           |
| ----------------------------- | ------------------------------------------------ | ----------------------------------- |
| Tiempo de respuesta API       | P95 < 500ms                                      | Alerta si > 1s                      |
| Trámites vencidos por SLA     | `GET /api/dashboard` → `tramitesVencidos`        | Alerta si > 20% del total           |
| Tasa de error 5xx             | Logs del API                                     | Alerta si > 1% de requests          |
| Conexiones activas DB         | PostgreSQL `pg_stat_activity`                    | Alerta si > 80% del max_connections |
| Uso de disco                  | Docker volume `pgdata`                           | Alerta si > 80%                     |
| Tiempo promedio de resolución | `GET /api/dashboard` → `promedioResolucionHoras` | Revisar si supera el SLA promedio   |

---

## 3. Logs relevantes

### Backend (NestJS)

- **Errores de autenticación**: buscar `UnauthorizedException` en stdout.
- **Errores de dominio**: buscar mensajes como "No se puede ejecutar la acción", "El trámite ya fue tomado", "Solo trámites en BORRADOR".
- **Transiciones de workflow**: cada acción de workflow genera logs en el movimiento de trámite (BD, tabla `MovimientoTramite`).
- **Errores de concurrencia**: buscar `PrismaClientKnownRequestError` con código P2025 (registro no encontrado por version mismatch).

### Base de datos (PostgreSQL)

- Activar `log_statement = 'mod'` para registrar INSERT/UPDATE/DELETE.
- Monitorear deadlocks: `log_lock_waits = on`.

### Frontend (Next.js)

- Errores 401/403: el interceptor de axios redirige al login. Verificar que no haya loops.
- Errores de red: buscar en consola del navegador.

---

## 4. Alertas mínimas

| Alerta              | Condición                                  | Canal           |
| ------------------- | ------------------------------------------ | --------------- |
| API caída           | Healthcheck falla 3 veces consecutivas     | Email/PagerDuty |
| SLA vencidos > 20%  | Dashboard `tramitesVencidos / total > 0.2` | Email           |
| Error rate > 5%     | 5xx > 5% en ventana de 5 min               | PagerDuty       |
| Disco > 85%         | `df -h`                                    | Email           |
| DB conexiones > 80% | `pg_stat_activity` count                   | Email           |
| Contenedor detenido | `docker ps` no muestra api/web/db          | PagerDuty       |

---

## 5. Riesgos conocidos

1. **Seed data en cada deploy**: el Dockerfile ejecuta `prisma db seed` en cada inicio del contenedor. En producción con datos reales, modificar el CMD para solo ejecutar `prisma migrate deploy` (sin seed), o usar un flag `SEED_ON_START=false`.

2. **Almacenamiento local de documentos**: los archivos se guardan en el volumen Docker `uploads/`. Si el volumen se elimina, los archivos se pierden. Para producción real, migrar a S3 o MinIO.

3. **Optimistic locking con alta contención**: si dos usuarios toman el mismo trámite simultáneamente, uno recibe error de versión. Para alta concurrencia, implementar reintento automático.

4. **JWT sin refresh**: los tokens expiran en 24h sin endpoint de refresh. Para producción, agregar refresh tokens con rotación.

5. **Sin rate limiting**: no hay throttling en endpoints. Para producción, agregar `@fastify/rate-limit` o a nivel de reverse proxy (Traefik/Coolify).

6. **Magic link sin email en dev**: sin SMTP configurado, el magic link se muestra en el frontend (campo `devLink` en la respuesta). En producción con SMTP se envía por email real y `devLink` no se retorna.

7. **Claves OIDC mock por instancia**: el `OidcService` genera claves RSA en memoria al iniciar. Con múltiples réplicas del backend, cada una tiene su propio keypair y los tokens de una no son válidos en otra. En producción multi-réplica usar Azure Entra ID o Keycloak.

---

## 6. Rollback

### Rollback de aplicación (Coolify)

Desde el dashboard de Coolify, ir al recurso Docker Compose y hacer "Rollback to previous deployment". Coolify mantiene el histórico de deploys y re-ejecuta el compose con la revisión anterior.

### Rollback manual vía Docker

```bash
docker compose down
docker tag bpm-api:previous bpm-api:latest
docker compose up -d
```

### Rollback de base de datos

```bash
# Backup antes de cualquier migración
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Las migraciones de Prisma son forward-only. Para rollback, restaurar snapshot.
psql $DATABASE_URL < backup.sql
```

### Estrategia recomendada

- Usar migraciones expand-contract: agregar columnas/tablas nuevas sin eliminar las viejas, deployar, y solo después limpiar.
- Para datos críticos, hacer backup antes de cada deploy.

---

## 7. Monitoreo

### Stack recomendado

- **Métricas**: Prometheus + Grafana (exponer métricas via `@nestjs/prometheus` o OpenTelemetry).
- **Logs**: Fluentd/Logstash → Elasticsearch → Kibana, o CloudWatch en AWS.
- **Traces**: OpenTelemetry con exportador a Jaeger o AWS X-Ray.
- **Uptime**: Healthcheck endpoint monitoreado por Route 53 Health Checks o Pingdom.

### Health endpoints

- `/api/health`: estado general del servicio.
- Conexión a DB: verificar que `prisma.$queryRaw\`SELECT 1\`` funciona.

---

## 8. Seguridad

### Checklist de hardening

- [ ] CORS configurado con orígenes específicos (no `*`).
- [ ] HTTPS en producción (TLS terminado en ALB o reverse proxy).
- [ ] Secrets en variables de entorno o Secrets Manager (no hardcodeados).
- [ ] JWT_SECRET rotado periódicamente.
- [ ] Contraseñas hasheadas con bcrypt (10 rounds, ya implementado).
- [ ] Headers de seguridad: `Helmet` habilitado en NestJS.
- [ ] Rate limiting en endpoints de auth (evitar brute force).
- [ ] Validación de entrada con class-validator (ya implementado).
- [ ] SQL injection mitigado por Prisma ORM (consultas parametrizadas).
- [ ] XSS mitigado por React (escapado automático).
- [ ] CSRF: evaluar necesidad según arquitectura (SPA con JWT en header no es vulnerable a CSRF tradicional).

### Hardening pendiente

- Agregar `@fastify/helmet` para headers de seguridad HTTP.
- Agregar `@fastify/rate-limit` para endpoints sensibles.
- Implementar refresh token rotation.
- Sanitizar nombres de archivo en uploads.

---

_Última actualización: 2026-06-18_
