# Decision Log — BPM de Trámites de Oficina

Registro de decisiones técnicas relevantes, qué problema resuelven y sus trade-offs.

---

## 1. Diseño del dominio

### 1.1. Tramite como aggregate root

**Decisión**: `Tramite` es el aggregate root central del dominio. Controla todas las transiciones de estado y garantiza la consistencia de `MovimientoTramite`, `ComentarioTramite` y `DocumentoTramite`.

**Por qué**: es la entidad con más invariantes de negocio. Cada transición modifica el trámite y genera un movimiento de auditoría, que deben mantenerse consistentes. Agruparlos bajo un aggregate root evita inconsistencias por accesos concurrentes.

**Trade-off**: perdemos la capacidad de modificar movimientos o comentarios de forma independiente sin pasar por el trámite. Para este dominio, eso es deseable — cada cambio debe quedar registrado.

### 1.2. Entidades separadas por concepto

**Decisión**: `UsuarioInterno` y `UsuarioExterno` son entidades separadas (no una entidad genérica `Usuario` con discriminador).

**Por qué**: tienen comportamientos y permisos radicalmente distintos. Fuerzan a que el sistema distinga explícitamente entre ambos tipos de identidad, como pide el challenge.

### 1.3. Value objects para validación temprana

**Decisión**: `NumeroTramite`, `Email`, `DocumentoIdentidad` y `SlaHoras` son value objects que fallan en construcción si el valor es inválido.

**Por qué**: DDD clásico — las invariantes se validan en el momento de creación, no en un validator externo. Hace imposible tener un email inválido circulando por el dominio.

---

## 2. Agregados

### 2.1. Tramite como único aggregate

El aggregate `Tramite` contiene:

- `Tramite` (root)
- `MovimientoTramite` (generado en cada transición)
- `ComentarioTramite` (asociado al trámite, no independiente)
- `DocumentoTramite` (asociado al trámite)

**Regla**: toda modificación a cualquiera de estas entidades pasa por el aggregate root. No se puede crear un `MovimientoTramite` sin ejecutar una transición en `Tramite`.

### 2.2. Optimistic locking

**Decisión**: `Tramite` incluye un campo `version` que se incrementa en cada transición. Al persistir, se verifica que la versión en base de datos coincida con la leída.

**Por qué**: previene que dos usuarios tomen el mismo trámite simultáneamente, uno de los requisitos explícitos del challenge. Es más simple y performante que un lock pesimista.

**Trade-off**: si hay mucha contención, el segundo usuario recibe un error y debe reintentar. Para trámites administrativos, la contención real es baja, así que el optimistic locking es adecuado.

---

## 3. Casos de uso

### 3.1. Organización por grupo funcional

**Decisión**: los casos de uso se organizan en 7 grupos funcionales, cada uno con responsabilidad única:

| Grupo         | Clase                   | Responsabilidad                                                                                                                                                                                                                                          |
| ------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Trámites      | `TramiteUseCases`       | Crear, obtener, listar, actualizar y eliminar trámites. Aplica filtros por rol y origen.                                                                                                                                                                 |
| Workflow      | `WorkflowUseCases`      | Ejecutar las 12 acciones de workflow: ingresar, tomar, asignar, derivar, observar, responder-observacion, solicitar-intervencion-externa, responder-intervencion-externa, aprobar, rechazar, cancelar, cerrar. También obtener historial de movimientos. |
| Comentarios   | `ComentarioUseCases`    | Crear y listar comentarios con filtro automático de visibilidad: INTERNA solo para internos, EXTERNA solo para externos, TODOS para ambos.                                                                                                               |
| Documentos    | `DocumentoUseCases`     | Subir archivos al storage, listar con filtro por visibilidad, obtener metadatos y eliminar documentos.                                                                                                                                                   |
| Dashboard     | `DashboardUseCases`     | Calcular métricas agregadas: trámites por estado, por origen, vencidos por SLA, promedio de resolución, cantidad por área, últimos movimientos.                                                                                                          |
| Configuración | `ConfiguracionUseCases` | CRUD de tipos de trámite y áreas administrativas.                                                                                                                                                                                                        |
| Auth          | `AuthUseCases`          | Registro de usuario externo (bcrypt), login externo (JWT HS256), login interno mock (RS256 OIDC), y obtención del perfil actual (`/auth/me`).                                                                                                            |

**Por qué**: cada grupo representa un bounded context dentro del dominio de trámites. Separarlos evita que un caso de uso acumule demasiadas responsabilidades y facilita el testing unitario — cada caso de uso solo depende de los puertos que necesita.

### 3.2. Casos de uso de workflow con transacción atómica

**Decisión**: los casos de uso del grupo `WorkflowUseCases` usan `IUnitOfWork` para ejecutar la operación dentro de una transacción Prisma (`prisma.$transaction`). El flujo es: cargar el aggregate `Tramite`, invocar el método de transición correspondiente (que devuelve un nuevo `Tramite` inmutable + un `MovimientoTramite`), y persistir ambos en una sola unidad atómica.

**Por qué**: garantiza que nunca exista un cambio de estado sin su correspondiente registro de auditoría. Si falla la creación del movimiento, el trámite no cambia de estado. Es un invariante del dominio.

### 3.3. DTOs de entrada y respuesta separados del dominio

**Decisión**: los casos de uso reciben DTOs de entrada validados con `class-validator` y devuelven interfaces de respuesta planas. Nunca exponen entidades del dominio directamente.

**Por qué**: separa el contrato de API del modelo de dominio. Las entidades pueden evolucionar sin romper la API pública. Además, permite filtrar campos sensibles (ej. `passwordHash` nunca viaja en respuestas).

### 3.4. Autorización a nivel de caso de uso

**Decisión**: la autorización se aplica en los casos de uso, no solo en guards HTTP. Por ejemplo, `TramiteUseCases.obtener()` verifica que el usuario tenga permiso para ver el trámite solicitado (externos solo ven sus propios trámites, operadores solo los de su área).

**Por qué**: defensa en profundidad. Si un guard se configura mal, el caso de uso sigue protegiendo los datos. Además, permite reutilizar los casos de uso desde otros entry points (GraphQL, workers, CLI) sin depender de guards HTTP.

---

## 4. Separación Clean Architecture / DDD

```
domain/          → entidades, value objects, enums, aggregate, servicios puros
application/     → casos de uso, puertos (interfaces), DTOs
infrastructure/  → repositorios Prisma, auth providers, file storage
presentation/    → controllers, guards, pipes, exception filters
```

**Regla de dependencia**: las capas externas dependen de las internas. `domain` no importa nada de `application`, `infrastructure` ni `presentation`. `application` solo depende de `domain`. `infrastructure` implementa puertos definidos en `application`.

---

## 5. Validaciones

### 5.1. Reglas de negocio en el dominio, no en controllers

**Decisión**: todas las validaciones de reglas de negocio viven en el aggregate `Tramite` y en el `TransicionValidatorService`. Los controllers solo validan formato (class-validator en DTOs).

**Por qué**: Clean Architecture — la lógica de negocio no depende de la capa de presentación. Si cambiamos de REST a GraphQL o gRPC, las reglas siguen siendo las mismas.

### 5.2. Matriz de transiciones por origen

**Decisión**: `TransicionValidatorService` define una matriz `Origen x Estado → Acciones permitidas` para cada uno de los tres circuitos (INTERNO_INTERNO, INTERNO_EXTERNO, EXTERNO_INTERNO).

**Por qué**: los tres circuitos tienen flujos distintos. La matriz hace explícito qué está permitido en cada momento y es fácil de testear.

---

## 6. Estrategia de autenticación

### 6.1. Separación total de sesiones

**Decisión**: internos y externos usan estrategias de autenticación completamente separadas. Internos vía mock OIDC con header `X-Mock-User-Id` (preparado para Azure Entra ID), externos vía JWT con `passport-jwt` + bcrypt.

**Por qué**: distinguir ambos tipos de identidad es requisito explícito del dominio. Separar las estrategias evita que un token externo sea aceptado en un endpoint interno (y viceversa).

### 6.2. Mock auth configurable

**Decisión**: `MOCK_AUTH=true` activa el header `X-Mock-User-Id` para desarrollo local. Cuando es `false`, se espera un token real de Azure Entra ID.

**Por qué**: permite desarrollar sin depender de Azure. El mock está documentado y preparado para ser reemplazado por el provider real.

### 6.3. OIDC mock con JWKS

**Decisión**: el backend expone un endpoint `/.well-known/openid-configuration` y `/.well-known/jwks.json` que emula un Identity Provider OIDC. El `POST /auth/internal/login` actúa como token endpoint.

**Por qué**: permite que el frontend use un flujo de autenticación estándar (RS256 JWT) incluso en modo mock. Cuando se active Azure Entra ID, el frontend solo cambia el issuer.

**Trade-off**: la clave RSA se genera en memoria al iniciar el servicio. Si hay múltiples instancias del backend, cada una tiene su propio keypair y los tokens de una no son válidos en otra. Para producción con múltiples réplicas, se debe usar un issuer externo (Azure Entra ID o Keycloak).

---

## 7. Estrategia de autorización

### 7.1. Guards separados por tipo de usuario

**Decisión**: se implementan tres guards especializados:

- `AuthGuard`: guard unificado que acepta tanto tokens internos como externos. Usado en endpoints que sirven a ambos tipos de usuario (trámites, comentarios, documentos).
- `InternalAuthGuard`: solo valida tokens internos. Rechaza tokens externos con 403. Usado en `/dashboard` y `/auth/internal/me`.
- `ExternalAuthGuard`: solo valida tokens JWT externos (HS256). Usado para endpoints que requieren identidad externa verificada.

**Por qué**: un externo nunca debe poder llamar un endpoint interno. La separación de guards hace imposible el bypass accidental.

### 7.2. Roles y permisos

**Decisión**: se implementa `RolesGuard` junto con el decorador `@Roles()` para restringir endpoints por rol interno:

| Rol          | Permisos                                                                                                                                             |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| ADMIN        | Acceso total: crear/editar tipos de trámite y áreas, ver todos los trámites, ejecutar cualquier acción de workflow.                                  |
| MESA_ENTRADA | Ver trámites de su área, ingresar trámites desde BORRADOR, tomar trámites.                                                                           |
| OPERADOR     | Ver trámites de su área, tomar, observar, aprobar, rechazar.                                                                                         |
| SUPERVISOR   | Igual que OPERADOR, más reasignar (`asignar`) y derivar trámites de su área.                                                                         |
| AUDITOR      | Ver todos los trámites y movimientos. No puede ejecutar ninguna acción de workflow.                                                                  |
| EXTERNO      | Solo ver trámites donde participa (creados por él o asignados a él). Solo puede ejecutar `responder-observacion` y `responder-intervencion-externa`. |

**Por qué**: cada rol tiene responsabilidades claras. El guard de roles aplica before de que el request llegue al controller, y el caso de uso también valida los permisos como defensa en profundidad.

### 7.3. Reglas de autorización clave

- Un usuario externo solo ve trámites donde `usuarioExternoId` o `creadoPorExternoId` coincide con su ID.
- Un operador/supervisor solo ve trámites de su `areaId`.
- Un admin/auditor ve todos los trámites.
- Un externo no puede ejecutar acciones de workflow internas (`aprobar`, `rechazar`, `ingresar`, `tomar`, `derivar`, `observar`).
- Un interno no puede ejecutar acciones de workflow externas (`responder-observacion`, `responder-intervencion-externa`).
- Solo supervisor/admin puede `asignar`.

---

## 8. Transacciones y concurrencia

### 8.1. Optimistic locking via campo version

**Decisión**: el aggregate `Tramite` incrementa `version` en cada transición. El repositorio verifica que la versión en DB coincida antes de actualizar.

**Por qué**: resuelve el requisito "no puede haber dos usuarios tomando el mismo trámite simultáneamente" sin locks pesimistas que bloqueen la base de datos.

### 8.2. Transiciones atómicas

**Decisión**: crear el `MovimientoTramite` y actualizar el `Tramite` en una única transacción de base de datos (`prisma.$transaction`).

**Por qué**: si falla la creación del movimiento, el trámite no debe cambiar de estado. La atomicidad garantiza que nunca haya un cambio de estado sin su correspondiente registro de auditoría.

---

## 9. Puertos y adaptadores

### 9.1. Interfaces como contratos

**Decisión**: cada repositorio, provider de auth y storage implementa una interfaz definida en la capa de aplicación (puertos). La capa de infraestructura contiene las implementaciones concretas (adaptadores).

**Por qué**: Clean Architecture — la capa de aplicación no conoce detalles de infraestructura. Cambiar de PostgreSQL a MongoDB o de JWT a OAuth solo requiere un nuevo adaptador.

### 9.2. Inyección con Symbol tokens

**Decisión**: se usan `Symbol` tokens (`TRAMITE_REPOSITORY`, `MOVIMIENTO_REPOSITORY`, etc.) para la inyección de dependencias en NestJS, ya que las interfaces TypeScript no existen en runtime.

**Por qué**: permite que NestJS resuelva las dependencias correctamente. El `InfrastructureModule` registra las implementaciones concretas contra estos tokens.

---

## 10. Prisma y base de datos

### 10.1. Prisma 7 con adapter de PostgreSQL

**Decisión**: se usa Prisma 7 con `@prisma/adapter-pg` para conexión directa a PostgreSQL.

**Trade-off**: Prisma 7 requiere configurar el `output` del generador y el adapter explícitamente. Cambió la API respecto a versiones anteriores (`$connect` ya no existe, el ciclo de vida lo maneja el adapter).

### 10.2. Schema con discriminador polimórfico

**Decisión**: `Tramite` usa `creadoPorTipo` como discriminador con dos columnas separadas (`creadoPorInternoId`, `creadoPorExternoId`), siempre una nula.

**Por qué**: Prisma no soporta foreign keys polimórficas. Dos columnas separadas con una nula es el patrón estándar para modelar relaciones opcionales con múltiples tablas.

---

## 11. Capa de presentación

### 11.1. Auth guard combinado

**Decisión**: un único `AuthGuard` que primero intenta validar un JWT Bearer token (usuario externo) y, si no hay, busca el header `X-Mock-User-Id` (usuario interno). Para internos, resuelve rol y areaId desde el repositorio.

**Por qué**: simplifica la protección de endpoints que aceptan ambos tipos de usuario (ej. trámites, comentarios). Evita tener que anidar guards con lógica OR. Los endpoints que requieren un tipo específico (ej. `/auth/internal/me`) validan el tipo en el controller.

**Trade-off**: el guard hace una query extra a la DB para resolver el usuario interno en cada request. Como los volúmenes esperados son bajos, el impacto es mínimo.

### 11.2. `@Public()` decorator

**Decisión**: endpoints de registro, login y health usan `@Public()` para saltar la autenticación. El `AuthGuard` consulta el metadata `IS_PUBLIC_KEY` vía `Reflector` antes de validar.

**Por qué**: sigue el patrón estándar de NestJS para rutas públicas, documentado en la guía oficial de autenticación.

### 11.3. Exception filter con mapeo por mensaje

**Decisión**: `HttpExceptionFilter` mapea errores de dominio a HTTP analizando el mensaje de la excepción (404, 403, 422, 401, 500).

**Por qué**: evita crear una jerarquía de excepciones de dominio con anotaciones HTTP. Los casos de uso lanzan `Error` con mensajes descriptivos, y el filter los clasifica. Es más simple y directo para el alcance del challenge.

**Trade-off**: si dos reglas de negocio distintas producen mensajes similares, podrían mapearse al mismo código HTTP incorrectamente. Para este dominio, los mensajes son lo suficientemente distintos como para no colisionar.

### 11.4. File upload con Fastify nativo

**Decisión**: se usa `@fastify/multipart` con `req.file()` en lugar de `@nestjs/platform-express` + `multer`.

**Por qué**: el proyecto usa Fastify como adapter HTTP. Usar middleware de Express para uploads requeriría `@nestjs/platform-express` y `multer` como dependencias adicionales, rompiendo la consistencia del stack.

---

## 12. Azure Entra ID real

### 12.1. Validación de tokens Azure vía JWKS

**Decisión**: implementar la validación de tokens de Azure Entra ID usando `jwks-rsa` + `jsonwebtoken` en lugar de depender exclusivamente del middleware `passport-azure-ad`.

**Por qué**: `passport-azure-ad` requiere que el token esté en el header `Authorization: Bearer` y utiliza Passport como middleware. El `AuthGuard` unificado ya maneja tokens de ambos tipos (interno y externo); agregar un segundo guard Passport para Azure hubiera requerido modificar la cadena de guards en todos los controllers. Implementar la validación JWKS dentro del `AzureInternalTokenValidator` (en el mismo patrón que `MockInternalTokenValidator`) permite que el guard existente maneje Azure de forma transparente, reutilizando la misma lógica de lookup de usuario por `azureObjectId`.

**Trade-off**: no se aprovecha el caching de JWKS que `passport-azure-ad` ofrece a través de `jwks-rsa` internamente. Para compensarlo, configuramos `jwks-rsa` con `cache: true`, `cacheMaxAge: 600000` (10 min) y `rateLimit: true`.

### 12.2. Mapeo de identidad Azure → usuario interno

**Decisión**: el claim `oid` (Object ID) del token Azure se usa para buscar al usuario interno por `UsuarioInterno.azureObjectId`.

**Por qué**: es el identificador inmutable en Azure Entra ID. No cambia si el usuario cambia de nombre o email.

---

## 13. Magic Link

### 13.1. Tokens single-use con TTL

**Decisión**: `MagicTokenService` genera tokens de 32 bytes aleatorios con timestamp, almacenados en un `Map` en memoria con TTL de 15 minutos. Cada token se consume una sola vez y se elimina tras su uso.

**Por qué**: implementación simple y segura para el alcance del challenge. En producción con múltiples réplicas, se reemplazaría por una tabla en base de datos o Redis.

**Trade-off**: los tokens no sobreviven a un reinicio del servidor. Para el volumen esperado (trámites administrativos, baja frecuencia de login), esto es aceptable.

### 13.2. Email simulado en desarrollo

**Decisión**: en ausencia de configuración SMTP, el endpoint `POST /auth/external/magic-link/request` devuelve el magic link en la respuesta JSON (campo `devLink`), y el frontend lo muestra en pantalla para testing.

**Por qué**: permite probar el flujo completo sin depender de un servicio de email externo. En producción, con SMTP configurado (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`), el enlace se envía por email real vía `nodemailer` y el campo `devLink` no se retorna.

### 13.3. Respuesta genérica en solicitud de magic link

**Decisión**: el endpoint siempre retorna el mismo mensaje — "Si el email está registrado, recibirás un enlace de acceso" — independientemente de si el email existe o no.

**Por qué**: previene enumeración de usuarios (user enumeration attack). Un atacante no puede determinar qué emails están registrados en el sistema.

---

_Última actualización: 2026-06-18_
