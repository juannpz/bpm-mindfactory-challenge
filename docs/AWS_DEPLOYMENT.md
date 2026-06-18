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
                          │     ECS Fargate (api)     S3 (frontend)  │
                          │           │                              │
                          │           ▼                              │
                          │     RDS PostgreSQL                        │
                          │           │                              │
                          │           ▼                              │
                          │     Secrets Manager                       │
                          │           │                              │
                          │           ▼                              │
                          │     CloudWatch Logs                       │
                          └──────────────────────────────────────────┘
```

---

## 1. Servicios AWS

### ECS Fargate — Backend API

- **Servicio**: `bpm-api`
- **Task definition**: 1 vCPU, 2 GB RAM
- **Imagen**: construida desde el `Dockerfile` del backend, publicada en ECR
- **Auto-scaling**: min 1, max 3 tareas. Escalar por CPU > 70% o solicitudes por tarea > 500.
- **Variables de entorno** (vía Secrets Manager):
  - `DATABASE_URL`: connection string de RDS
  - `JWT_SECRET`: secreto para firma de tokens JWT
  - `MOCK_AUTH=false`: autenticación real (Azure Entra ID)
- **Health check**: `GET /api/health`, puerto 3001

### S3 + CloudFront — Frontend

- **Build**: `npm run build` en el Dockerfile frontend, output estático a S3.
- **Bucket**: `bpm-frontend-prod` con static website hosting.
- **CloudFront**: distribución con origen S3.
  - Comportamiento `/api/*`: redirige al ALB (origen adicional).
  - Comportamiento `/*`: sirve desde S3.
- **Cache**: archivos estáticos (JS, CSS, imágenes) con TTL 1 año (inmutable por hash de build). HTML con TTL 0.
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
- Secreto `bpm/prod/jwt`: `JWT_SECRET`.
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
      - name: Build
        run: npm run build
        working-directory: frontend
      - name: Deploy to S3
        run: |
          aws s3 sync .next/static s3://bpm-frontend-prod/_next/static --cache-control "max-age=31536000, immutable"
          aws s3 sync public s3://bpm-frontend-prod/
      - name: Invalidate CloudFront
        run: |
          aws cloudfront create-invalidation --distribution-id $CF_DIST_ID --paths "/*"
```

### Estrategia de migración

1. **Pre-deploy**: ejecutar `prisma migrate deploy` (forward-only).
2. **Deploy**: actualizar ECS service (nuevas tareas toman migraciones ya aplicadas).
3. **Rollback**: si falla, las migraciones ya aplicadas no se revierten automáticamente. Usar migraciones expand-contract para evitar breaking changes.

---

## 3. Estrategia de rollback

### Rollback de aplicación

```bash
# Desde la consola de AWS o CLI:
aws ecs update-service \
  --cluster bpm-cluster \
  --service bpm-api \
  --task-definition bpm-api:previous-revision \
  --force-new-deployment
```

### Rollback de frontend

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
JWT_SECRET=${JWT_SECRET}
MOCK_AUTH=false
NODE_ENV=production
PORT=3001
```

(Todas las credenciales se obtienen de Secrets Manager en tiempo de ejecución.)

### IAM Roles

- **ECS Task Role**: acceso a Secrets Manager (leer `bpm/prod/*`), CloudWatch Logs (escribir), ECR (pull imágenes).
- **ECS Execution Role**: igual que Task Role.
- **GitHub Actions Role**: OIDC federado con permisos para ECS deploy, ECR push, S3 sync, CloudFront invalidation.

---

## 5. Costos estimados (mensual, USD)

| Servicio           | Configuración                  | Costo aprox.  |
| ------------------ | ------------------------------ | ------------- |
| ECS Fargate        | 1 tarea × 1 vCPU, 2 GB         | ~$35          |
| RDS PostgreSQL     | db.t3.medium, 100 GB, Multi-AZ | ~$120         |
| ALB                | 1 LB + tráfico                 | ~$25          |
| S3                 | 10 GB + requests               | ~$5           |
| CloudFront         | 50 GB transferencia            | ~$5           |
| CloudWatch         | Logs + métricas                | ~$15          |
| Secrets Manager    | 2 secretos                     | ~$1           |
| WAF                | 1 WebACL                       | ~$8           |
| **Total estimado** |                                | **~$214/mes** |

> Nota: costos estimados a junio 2026. Ajustar según región (us-east-1 como referencia). Para entornos de desarrollo, reducir a single-AZ, instancias más pequeñas, y desactivar WAF.

---

## 6. Dominio y DNS

- **Dominio**: `bpm.empresa.com` (ejemplo)
- **Route 53**: hosted zone con:
  - `A` record → CloudFront distribution (frontend)
  - `api.bpm.empresa.com` → ALB (backend, opcional si unificas con CloudFront)
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

_Última actualización: 2026-06-16_
