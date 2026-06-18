# AWS Deployment — BPM de Trámites de Oficina

Propuesta de despliegue en AWS para entorno productivo.

---

## Arquitectura propuesta

```
                          ┌──────────────────────────────────────────┐
                          │              AWS Cloud                   │
                          │                                          │
  Usuarios ──► Route 53 ──► CloudFront ──► WAF ──► ALB              │
                          │                       │                  │
                          │           ┌───────────┴───────────┐      │
                          │           ▼                       ▼      │
                          │     ECS Fargate (api)    ECS Fargate (web)│
                          │     puerto 3001          puerto 3000      │
                          │           │                  │            │
                          │           ▼                  │            │
                          │     RDS PostgreSQL           │            │
                          │           │                  │            │
                          │           ▼                  │            │
                          │     Secrets Manager          │            │
                          │           │                  │            │
                          │           ▼                  ▼            │
                          │     CloudWatch Logs                       │
                          └──────────────────────────────────────────┘
```

---

## 1. Servicios AWS

### ECS Fargate — Backend API

- **Servicio**: `bpm-api`
- **Task definition**: 1 vCPU, 2 GB RAM
- **Imagen**: construida desde `backend/Dockerfile` (multi-stage, Node.js 24 Alpine), publicada en ECR
- **Puerto**: 3001
- **Auto-scaling**: min 1, max 3 tareas. Escalar por CPU > 70%.
- **Variables de entorno** (vía Secrets Manager):
  - `DATABASE_URL`: connection string de RDS
  - `JWT_SECRET_EXTERNAL`: firma de tokens JWT para usuarios externos (HS256)
  - `JWT_SECRET_INTERNAL`: firma de tokens JWT para usuarios internos (RS256 mock o Azure)
  - `MOCK_AUTH=false`: desactiva mock OIDC y activa Azure Entra ID
  - `AZURE_TENANT_ID`: tenant de Azure Entra ID
  - `AZURE_CLIENT_ID`: client ID de la app registrada en Azure
  - `FRONTEND_URL`: URL del frontend (para magic links)
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`: email para magic link
- **Health check**: `GET /api/health`, puerto 3001

### ECS Fargate — Frontend Web

- **Servicio**: `bpm-web`
- **Task definition**: 1 vCPU, 2 GB RAM
- **Imagen**: construida desde `frontend/Dockerfile` (multi-stage, Node.js 24 Alpine), publicada en ECR
- **Puerto**: 3000
- **Auto-scaling**: min 1, max 2 tareas.
- **Variables de entorno** (build-time):
  - `NEXT_PUBLIC_API_URL`: URL pública de la API (ej: `https://bpm.empresa.com/api`)
  - `NEXT_PUBLIC_MOCK_AUTH`: `false` en producción
  - `API_INTERNAL_URL`: URL interna del backend (`http://bpm-api:3001`)
- **Rewrite**: Next.js proxyea `/api/*` → `API_INTERNAL_URL/api/*` internamente.
- **Health check**: `GET /`, puerto 3000

### S3 + CloudFront — Frontend (Next.js)

- **Build**: `npm run build` con el Dockerfile del frontend (multi-stage, Node.js 24).
- **Runtime**: Next.js requiere servidor Node.js para SSR y API rewrites. Ejecutar en ECS Fargate (mismo cluster que el backend) o usar AWS Amplify Hosting para Next.js.
- **Alternativa ECS**: la imagen Docker del frontend corre `npm start` en puerto 3000, con rewrites de `/api/*` al backend via `API_INTERNAL_URL`.
- **Alternativa Amplify**: build automático desde el repositorio, soporte nativo para Next.js SSR.
- **CloudFront**: distribución con origen en el ECS/Amplify del frontend.
  - Comportamiento `/*`: sirve desde el frontend (incluye SSR y `/api/*` proxy).
  - Alternativa con dominio separado: `api.bpm.empresa.com` → ALB → backend ECS.
- **Cache**: archivos estáticos (`/_next/static/*`) con TTL 1 año. Rutas dinámicas con TTL 0.
- **WAF**: asociado a CloudFront para protección contra OWASP Top 10 y rate limiting.

### RDS PostgreSQL

- **Instancia**: `db.t3.medium` (2 vCPU, 4 GB RAM) — ajustable según volumen.
- **Storage**: 100 GB GP3, auto-scaling habilitado.
- **Multi-AZ**: sí (producción), para alta disponibilidad.
- **Backup**: retención 7 días, snapshots diarios.
- **Security group**: solo permite tráfico desde el security group de ECS en puerto 5432.
- **Parámetros**:
  - `max_connections`: 200
  - `log_statement`: `mod` (registra INSERT/UPDATE/DELETE)

### Secrets Manager

- Secreto `bpm/prod/database`: `DATABASE_URL` completo.
- Secreto `bpm/prod/jwt-external`: `JWT_SECRET_EXTERNAL`.
- Secreto `bpm/prod/jwt-internal`: `JWT_SECRET_INTERNAL`.
- Secreto `bpm/prod/smtp`: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`.
- Rotación automática de RDS password (opcional, cada 30 días).

### ALB (Application Load Balancer)

- **Listener**: HTTPS (puerto 443) con certificado ACM.
- **Target group**: ECS Fargate tasks, puerto 3001.
- **Health check**: `/api/health`, intervalo 30s, threshold 3.
- **Security group**: permite tráfico 443 desde CloudFront/WAF.

### CloudWatch Logs

- **Log groups**:
  - `/ecs/bpm-api`: logs de la aplicación NestJS.
  - `/rds/bpm-db`: logs de PostgreSQL.
- **Retención**: 30 días.
- **Métricas**: CPU, memoria, conexiones DB, errores 5xx.
- **Alarmas**:
  - CPU > 80% por 5 min → notificar.
  - Memoria > 80% por 5 min → notificar.
  - 5xx > 5% de requests → notificar.
  - Tarea ECS detenida → notificar.

---

## 2. Estrategia de migraciones

### Pipeline CI/CD (GitHub Actions)

El proyecto ya tiene `.github/workflows/ci.yml` con lint, tests unitarios, e2e y build. Para deploy en AWS se agrega un workflow adicional `.github/workflows/deploy.yml`:

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build and push Docker image
        run: |
          docker build -t $ECR_REPO:latest -f backend/Dockerfile .
          docker push $ECR_REPO:latest
      - name: Run migrations
        run: |
          # Ejecutar migraciones antes del deploy
          npx prisma migrate deploy
        working-directory: backend
      - name: Deploy to ECS
        run: |
          aws ecs update-service --cluster bpm-cluster --service bpm-api --force-new-deployment
  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build and push Docker image
        run: |
          docker build -t $ECR_FRONTEND_REPO:latest -f frontend/Dockerfile \
            --build-arg NEXT_PUBLIC_API_URL=https://bpm.empresa.com/api \
            --build-arg NEXT_PUBLIC_MOCK_AUTH=false \
            --build-arg API_INTERNAL_URL=http://localhost:3001 .
          docker push $ECR_FRONTEND_REPO:latest
      - name: Deploy to ECS
        run: |
          aws ecs update-service --cluster bpm-cluster --service bpm-web --force-new-deployment
```

### Estrategia de migración

1. **Pre-deploy**: ejecutar `prisma migrate deploy` (forward-only).
2. **Deploy**: actualizar ECS service (nuevas tareas toman migraciones ya aplicadas).
3. **Rollback**: si falla, las migraciones ya aplicadas no se revierten automáticamente. Usar migraciones expand-contract para evitar breaking changes.

---

## 3. Estrategia de rollback

### Rollback de aplicación

```bash
# Rollback del backend
aws ecs update-service \
  --cluster bpm-cluster \
  --service bpm-api \
  --task-definition bpm-api:previous-revision \
  --force-new-deployment

# Rollback del frontend
aws ecs update-service \
  --cluster bpm-cluster \
  --service bpm-web \
  --task-definition bpm-web:previous-revision \
  --force-new-deployment
```

### Rollback de frontend (alternativa S3/Amplify)

```bash
# Restaurar versión anterior desde S3 (si se mantienen versiones)
aws s3 sync s3://bpm-frontend-prod-versions/v1.2.3/ s3://bpm-frontend-prod/
aws cloudfront create-invalidation --distribution-id $CF_DIST_ID --paths "/*"
```

### Rollback de base de datos

- Las migraciones son forward-only. Para rollback:
  1. Restaurar snapshot de RDS al punto anterior a la migración.
  2. Apuntar la aplicación a la nueva instancia.
  3. O usar migraciones expand-contract (agregar columnas nuevas, no eliminar viejas, deployar, luego limpiar).

---

## 4. Configuración de entorno

### .env.production

```env
DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@${RDS_HOST}:5432/bpm_db
JWT_SECRET_EXTERNAL=${JWT_SECRET_EXTERNAL}
JWT_SECRET_INTERNAL=${JWT_SECRET_INTERNAL}
MOCK_AUTH=false
AZURE_TENANT_ID=${AZURE_TENANT_ID}
AZURE_CLIENT_ID=${AZURE_CLIENT_ID}
FRONTEND_URL=https://bpm.empresa.com
SMTP_HOST=${SMTP_HOST}
SMTP_PORT=${SMTP_PORT}
SMTP_USER=${SMTP_USER}
SMTP_PASS=${SMTP_PASS}
SMTP_FROM=no-reply@bpm.empresa.com
NODE_ENV=production
```

(Todas las credenciales se obtienen de Secrets Manager en tiempo de ejecución.)

### IAM Roles

- **ECS Task Role**: acceso a Secrets Manager (leer `bpm/prod/*`), CloudWatch Logs (escribir), ECR (pull imágenes).
- **ECS Execution Role**: igual que Task Role.
- **GitHub Actions Role**: OIDC federado con permisos para ECS deploy, ECR push, S3 sync, CloudFront invalidation.

---

## 5. Costos estimados (mensual, USD)

| Servicio           | Configuración                       | Costo aprox.  |
| ------------------ | ----------------------------------- | ------------- |
| ECS Fargate        | 2 tareas × 1 vCPU, 2 GB (api + web) | ~$70          |
| RDS PostgreSQL     | db.t3.medium, 100 GB, Multi-AZ      | ~$120         |
| ALB                | 1 LB + tráfico                      | ~$25          |
| CloudFront         | 50 GB transferencia                 | ~$5           |
| CloudWatch         | Logs + métricas                     | ~$15          |
| Secrets Manager    | 3 secretos                          | ~$1.50        |
| WAF                | 1 WebACL                            | ~$8           |
| **Total estimado** |                                     | **~$245/mes** |

> Nota: costos estimados a junio 2026. Ajustar según región (us-east-1 como referencia). Para entornos de desarrollo, reducir a single-AZ, instancias más pequeñas, y desactivar WAF.

---

## 6. Dominio y DNS

- **Dominio**: `bpm.empresa.com` (ejemplo)
- **Route 53**: hosted zone con:
  - `A` record → CloudFront distribution (frontend)
  - `api.bpm.empresa.com` → ALB (backend, opcional si se unifica con CloudFront)
- **Certificado SSL**: ACM en us-east-1 (requerido por CloudFront).

---

## 7. Seguridad adicional

- **WAF rules**:
  - AWS Managed Rules: Core Rule Set (protege contra SQL injection, XSS, etc.)
  - Rate limit: 100 requests/minuto por IP en endpoints de auth.
- **Security groups**:
  - ECS → RDS: solo puerto 5432
  - ALB → ECS: solo puerto 3001
  - ALB ← CloudFront/WAF: solo 443
- **Secrets Manager**: rotación automática de credenciales RDS.
- **CloudTrail**: habilitado para auditoría de cambios en infraestructura.

---

_Última actualización: 2026-06-18_
