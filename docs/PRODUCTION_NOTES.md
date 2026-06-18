# Production Notes — BPM de Trámites de Oficina

Guía operativa para validación, monitoreo y gestión en producción.

---

## 1. Cómo validar en producción

### Healthcheck

```
GET http://localhost:3001/api/health
```

Devuelve `{ status: "ok", timestamp, uptime }`. Debe responder 200 en < 500ms.

### Smoke test manual

1. Login como usuario externo: `POST /api/auth/external/login` con `externo1@test.com / Password123!`
2. Verificar que devuelve token JWT y datos del usuario.
3. `GET /api/auth/me` con el token → debe devolver datos del usuario externo.
4. `GET /api/tramites` con token externo → solo debe devolver trámites donde participa ese usuario.
5. Login como usuario interno: usar header `X-Mock-User-Id: mock-admin-001`
6. `GET /api/auth/internal/me` → debe devolver datos del usuario ADMIN.
7. Verificar que un endpoint protegido sin auth devuelva 401.

### Validación de permisos

- Usuario externo intentando `POST /api/tramites/:id/aprobar` → debe devolver 403.
- Usuario externo intentando ver trámite de otro externo → debe devolver 403.
- Usuario OPERADOR viendo trámites de otra área → no deben aparecer en listado.

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

1. **Mock auth en producción**: el modo mock (`MOCK_AUTH=true`) es solo para desarrollo. En producción debe configurarse Azure Entra ID (o Keycloak) para internos y desactivar el header `X-Mock-User-Id`.

2. **Almacenamiento local de documentos**: los archivos se guardan en `uploads/` dentro del contenedor. Si el contenedor se reinicia, los archivos se pierden. Para producción, migrar a S3 o MinIO con volumen persistente.

3. **Optimistic locking con alta contención**: si dos usuarios intentan tomar el mismo trámite simultáneamente, uno recibirá error de versión. El frontend actual recarga la página, lo cual es aceptable para volúmenes bajos. Para alta concurrencia, implementar reintento automático.

4. **Seed data en producción**: el Dockerfile ejecuta `prisma db seed` en cada inicio. Para producción, solo ejecutar migraciones con `prisma migrate deploy` (ya incluido en el CMD del Dockerfile). El seed debe ejecutarse manualmente o solo en entornos de desarrollo.

5. **JWT sin refresh**: los tokens JWT expiran en 24h. No hay endpoint de refresh. Para producción, implementar refresh tokens o reducir el tiempo de expiración con rotación.

6. **Sin rate limiting**: no hay throttling en los endpoints. Para producción, agregar rate limiting con `@nestjs/throttler` o a nivel de ALB/API Gateway.

---

## 6. Rollback

### Rollback de aplicación

```bash
# Volver a una versión anterior de la imagen
docker tag bpm-api:previous bpm-api:latest
docker compose up -d api
```

### Rollback de base de datos

```bash
# Las migraciones de Prisma son forward-only estándar.
# Para rollback manual:
cd backend
npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-schema-datasource prisma/schema.prisma --script > rollback.sql
# Revisar y ejecutar manualmente
```

### Estrategia recomendada

- Usar migraciones expand-contract: primero agregar columnas/tablas nuevas (sin eliminar las viejas), deployar, y solo después limpiar.
- Para datos críticos, hacer backup antes de cada migración:
  ```bash
  pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
  ```

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

_Última actualización: 2026-06-16_
