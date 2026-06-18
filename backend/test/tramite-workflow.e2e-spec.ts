/// <reference types="jest" />

import * as bcrypt from 'bcrypt';
import { Test, TestingModule } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '@infrastructure/prisma/prisma.service';
import { HttpExceptionFilter } from '@presentation/filters';
import {
  TRAMITE_REPOSITORY,
  MOVIMIENTO_REPOSITORY,
  TIPO_TRAMITE_REPOSITORY,
  USUARIO_EXTERNO_REPOSITORY,
  USUARIO_INTERNO_REPOSITORY,
  COMENTARIO_REPOSITORY,
  DOCUMENTO_REPOSITORY,
  AREA_REPOSITORY,
} from '@application/ports/tokens';
import { Tramite } from '@domain/aggregates';
import {
  TipoTramite,
  UsuarioInterno,
  UsuarioExterno,
  Area,
  MovimientoTramite,
  ComentarioTramite,
  DocumentoTramite,
} from '@domain/entities';
import {
  EstadoTramite,
  OrigenTramite,
  Prioridad,
  AccionMovimiento,
  TipoUsuario,
  RolInterno,
  EstadoUsuarioExterno,
} from '@domain/enums';

// ── In-memory data stores ──
const tramitesStore = new Map<string, Tramite>();
const movimientosStore: MovimientoTramite[] = [];
const tiposStore = new Map<string, TipoTramite>();
const usuariosExternosStore = new Map<string, UsuarioExterno>();
const usuariosInternosStore = new Map<string, UsuarioInterno>();
const areasStore = new Map<string, Area>();
const comentariosStore: ComentarioTramite[] = [];
const documentosStore: DocumentoTramite[] = [];

// ── Seed data IDs ──
const EXT_ID = 'e0000001-0000-4000-8000-000000000001';
const EXT_ID_2 = 'e0000002-0000-4000-8000-000000000002';
const INT_ADMIN_ID = 'u0000001-0000-4000-8000-000000000001';
const INT_MESA_ID = 'u0000002-0000-4000-8000-000000000002';
const TIPO_SA_ID = 't0000004-0000-4000-8000-000000000004';
const AREA_ME_ID = 'a0000001-0000-4000-8000-000000000001';

// Helper to create mock PrismaService with $transaction
const mockPrismaService = {
  $transaction: jest.fn(async <T>(fn: (() => Promise<T>) | T[]): Promise<T> => {
    if (typeof fn === 'function') return fn();
    return fn as unknown as T;
  }),
};

// ── Mock Repositories ──
const mockTramiteRepo = {
  findById: jest.fn(async (id: string) => tramitesStore.get(id) ?? null),
  findAll: jest.fn(
    async (filters?: { estado?: string; usuarioExternoId?: string }) => {
      let data = Array.from(tramitesStore.values());
      if (filters?.estado)
        data = data.filter((t) => t.estado === filters.estado);
      if (filters?.usuarioExternoId)
        data = data.filter(
          (t) => t.usuarioExternoId === filters.usuarioExternoId,
        );
      return { data, total: data.length };
    },
  ),
  create: jest.fn(async (t: Tramite) => {
    // Store the actual Tramite instance so domain methods work
    tramitesStore.set(t.id, t);
    return t;
  }),
  update: jest.fn(async (t: Tramite) => {
    tramitesStore.set(t.id, t);
    return t;
  }),
  delete: jest.fn(async (id: string) => {
    tramitesStore.delete(id);
  }),
};

const mockMovimientoRepo = {
  create: jest.fn(async (m: MovimientoTramite) => {
    movimientosStore.push(m);
    return m;
  }),
  findByTramiteId: jest.fn(async (tramiteId: string) =>
    movimientosStore.filter((m) => m.tramiteId === tramiteId),
  ),
};

const mockTipoTramiteRepo = {
  findById: jest.fn(async (id: string) => tiposStore.get(id) || null),
  findAll: jest.fn(async () => Array.from(tiposStore.values())),
  create: jest.fn(),
  update: jest.fn(),
};

const mockUsuarioExternoRepo = {
  findById: jest.fn(
    async (id: string) => usuariosExternosStore.get(id) || null,
  ),
  findByEmail: jest.fn(async (email: string) => {
    for (const u of usuariosExternosStore.values()) {
      if (u.email === email) return u;
    }
    return null;
  }),
  findAll: jest.fn(async () => Array.from(usuariosExternosStore.values())),
  create: jest.fn(async (u: UsuarioExterno) => {
    usuariosExternosStore.set(u.id, u);
    return u;
  }),
};

const mockUsuarioInternoRepo = {
  findById: jest.fn(
    async (id: string) => usuariosInternosStore.get(id) || null,
  ),
  findByAzureObjectId: jest.fn(async (azureId: string) => {
    for (const u of usuariosInternosStore.values()) {
      if (u.azureObjectId === azureId) return u;
    }
    return null;
  }),
  findAll: jest.fn(),
  create: jest.fn(),
};

const mockComentarioRepo = {
  create: jest.fn(async (c: ComentarioTramite) => {
    comentariosStore.push(c);
    return c;
  }),
  findByTramiteId: jest.fn(async (tramiteId: string) =>
    comentariosStore.filter((c) => c.tramiteId === tramiteId),
  ),
  findById: jest.fn(),
  delete: jest.fn(),
};

const mockDocumentoRepo = {
  create: jest.fn(async (d: DocumentoTramite) => {
    documentosStore.push(d);
    return d;
  }),
  findByTramiteId: jest.fn(async (tramiteId: string) =>
    documentosStore.filter((d) => d.tramiteId === tramiteId),
  ),
  findById: jest.fn(),
  delete: jest.fn(),
};

const mockAreaRepo = {
  findById: jest.fn(async (id: string) => areasStore.get(id) || null),
  findAll: jest.fn(async () => Array.from(areasStore.values())),
  create: jest.fn(),
  update: jest.fn(),
};

describe('BPM Integration Tests (e2e)', () => {
  let app: NestFastifyApplication;
  let jwtService: JwtService;
  let externalToken: string;

  beforeAll(async () => {
    // Seed in-memory data
    areasStore.set(
      AREA_ME_ID,
      Area.create({
        id: AREA_ME_ID,
        nombre: 'Mesa de Entrada',
        codigo: 'ME',
        activa: true,
      }),
    );

    usuariosInternosStore.set(
      INT_ADMIN_ID,
      UsuarioInterno.create({
        id: INT_ADMIN_ID,
        nombre: 'Admin',
        email: 'admin@test.com',
        areaId: AREA_ME_ID,
        rol: RolInterno.ADMIN,
        azureObjectId: 'mock-admin-001',
        activo: true,
      }),
    );

    usuariosInternosStore.set(
      INT_MESA_ID,
      UsuarioInterno.create({
        id: INT_MESA_ID,
        nombre: 'Mesa',
        email: 'mesa@test.com',
        areaId: AREA_ME_ID,
        rol: RolInterno.MESA_ENTRADA,
        azureObjectId: 'mock-mesa-001',
        activo: true,
      }),
    );

    // Generate a real bcrypt hash for the test user
    const passwordHash = await bcrypt.hash('TestPass1!', 10);

    const usuario1 = UsuarioExterno.create({
      id: EXT_ID,
      nombre: 'Juan',
      email: 'externo1@test.com',
      documento: '20123456',
      organizacion: 'ABC',
      estado: EstadoUsuarioExterno.ACTIVO,
      fechaAlta: new Date(),
      passwordHash,
    });
    usuariosExternosStore.set(EXT_ID, usuario1);

    const usuario2 = UsuarioExterno.create({
      id: EXT_ID_2,
      nombre: 'Maria',
      email: 'externo2@test.com',
      documento: '27876543',
      organizacion: 'XYZ',
      estado: EstadoUsuarioExterno.ACTIVO,
      fechaAlta: new Date(),
      passwordHash,
    });
    usuariosExternosStore.set(EXT_ID_2, usuario2);

    tiposStore.set(
      TIPO_SA_ID,
      TipoTramite.create({
        id: TIPO_SA_ID,
        codigo: 'SOLICITUD_ACCESO',
        nombre: 'Solicitud de Acceso',
        descripcion: 'Acceso a sistemas',
        activo: true,
        requiereExterno: false,
        permiteInicioExterno: true,
        slaHoras: 24,
        areaInicialId: AREA_ME_ID,
      }),
    );

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .overrideProvider(TRAMITE_REPOSITORY)
      .useValue(mockTramiteRepo)
      .overrideProvider(MOVIMIENTO_REPOSITORY)
      .useValue(mockMovimientoRepo)
      .overrideProvider(TIPO_TRAMITE_REPOSITORY)
      .useValue(mockTipoTramiteRepo)
      .overrideProvider(USUARIO_EXTERNO_REPOSITORY)
      .useValue(mockUsuarioExternoRepo)
      .overrideProvider(USUARIO_INTERNO_REPOSITORY)
      .useValue(mockUsuarioInternoRepo)
      .overrideProvider(COMENTARIO_REPOSITORY)
      .useValue(mockComentarioRepo)
      .overrideProvider(DOCUMENTO_REPOSITORY)
      .useValue(mockDocumentoRepo)
      .overrideProvider(AREA_REPOSITORY)
      .useValue(mockAreaRepo)
      .overrideProvider('JWT_MODULE_OPTIONS')
      .useValue({
        secret: 'test-secret-key',
        signOptions: { expiresIn: '24h' },
      })
      .compile();

    jwtService = moduleFixture.get<JwtService>(JwtService);

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    app.useGlobalFilters(new HttpExceptionFilter());
    app.setGlobalPrefix('api');
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    // Generate external JWT token
    externalToken = jwtService.sign({
      sub: EXT_ID,
      email: 'externo1@test.com',
    });

    // Clear movement store between suites
    movimientosStore.length = 0;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    // Clear stores before each test
    tramitesStore.clear();
    movimientosStore.length = 0;
    comentariosStore.length = 0;
    documentosStore.length = 0;
    jest.clearAllMocks();
  });

  // ── 1. Login externo ──
  describe('1. Login externo', () => {
    it('POST /api/auth/external/login — retorna JWT con credenciales válidas', async () => {
      // Override the external auth provider to accept test password
      const res = await request(app.getHttpServer())
        .post('/api/auth/external/login')
        .send({ email: 'externo1@test.com', password: 'TestPass1!' })
        .expect(200);

      expect(res.body).toHaveProperty('token');
      expect(res.body.usuario).toBeDefined();
      expect(res.body.usuario.email).toBe('externo1@test.com');
    });

    it('POST /api/auth/external/login — retorna 401 con credenciales inválidas', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/external/login')
        .send({ email: 'noexiste@test.com', password: 'wrong' })
        .expect(401);
    });
  });

  // ── 2. Crear trámite externo ──
  describe('2. Crear trámite externo (EXTERNO_INTERNO)', () => {
    it('POST /api/tramites — externo crea trámite con tipo que permite inicio externo', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/tramites')
        .set('Authorization', `Bearer ${externalToken}`)
        .send({
          tipoTramiteId: TIPO_SA_ID,
          titulo: 'Test Externo',
          descripcion: 'Creado por externo',
          prioridad: Prioridad.ALTA,
          origen: OrigenTramite.EXTERNO_INTERNO,
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.origen).toBe(OrigenTramite.EXTERNO_INTERNO);
      expect(res.body.estado).toBe(EstadoTramite.BORRADOR);
    });

    it('POST /api/tramites — externo no puede crear sin token', async () => {
      await request(app.getHttpServer())
        .post('/api/tramites')
        .send({
          tipoTramiteId: TIPO_SA_ID,
          titulo: 'Test',
          descripcion: 'Test',
          prioridad: Prioridad.MEDIA,
          origen: OrigenTramite.EXTERNO_INTERNO,
        })
        .expect(401);
    });
  });

  // ── 3. Tomar trámite (interno) ──
  describe('3. Tomar trámite', () => {
    let tramiteId: string;

    beforeEach(async () => {
      // Crear trámite en INGRESADO
      const now = new Date();
      const id = 'tram-tomar-' + Date.now();
      tramitesStore.set(
        id,
        Tramite.fromProps({
          id,
          numero: 'TRAM-2026-99999',
          tipoTramiteId: TIPO_SA_ID,
          titulo: 'Test Tomar',
          descripcion: '',
          origen: OrigenTramite.EXTERNO_INTERNO,
          estado: EstadoTramite.INGRESADO,
          prioridad: Prioridad.MEDIA,
          areaActualId: AREA_ME_ID,
          usuarioAsignadoId: null,
          usuarioExternoId: EXT_ID,
          creadoPorTipo: TipoUsuario.EXTERNO,
          creadoPorId: EXT_ID,
          fechaCreacion: now,
          fechaActualizacion: now,
          fechaCierre: null,
          version: 1,
        }),
      );
      tramiteId = id;
    });

    it('POST /api/tramites/:id/tomar — interno toma trámite en INGRESADO', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/tramites/${tramiteId}/tomar`)
        .set('X-Mock-User-Id', 'mock-mesa-001')
        .expect(201);

      expect(res.body.estado).toBe(EstadoTramite.EN_REVISION);

      // Verificar que se creó movimiento
      const movs = movimientosStore.filter((m) => m.tramiteId === tramiteId);
      expect(movs.length).toBeGreaterThan(0);
      expect(movs[movs.length - 1].accion).toBe(AccionMovimiento.TOMAR);
    });

    it('POST /api/tramites/:id/tomar — externo no puede tomar (403)', async () => {
      await request(app.getHttpServer())
        .post(`/api/tramites/${tramiteId}/tomar`)
        .set('Authorization', `Bearer ${externalToken}`)
        .expect(403);
    });
  });

  // ── 4. Observar trámite ──
  describe('4. Observar trámite', () => {
    let tramiteId: string;

    beforeEach(async () => {
      const now = new Date();
      const id = 'tram-obs-' + Date.now();
      tramitesStore.set(
        id,
        Tramite.fromProps({
          id,
          numero: 'TRAM-2026-88888',
          tipoTramiteId: TIPO_SA_ID,
          titulo: 'Test Observar',
          descripcion: '',
          origen: OrigenTramite.EXTERNO_INTERNO,
          estado: EstadoTramite.EN_REVISION,
          prioridad: Prioridad.MEDIA,
          areaActualId: AREA_ME_ID,
          usuarioAsignadoId: INT_MESA_ID,
          usuarioExternoId: EXT_ID,
          creadoPorTipo: TipoUsuario.EXTERNO,
          creadoPorId: EXT_ID,
          fechaCreacion: now,
          fechaActualizacion: now,
          fechaCierre: null,
          version: 1,
        }),
      );
      tramiteId = id;
    });

    it('POST /api/tramites/:id/observar — interno observa trámite', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/tramites/${tramiteId}/observar`)
        .set('X-Mock-User-Id', 'mock-mesa-001')
        .send({ comentario: 'Falta documentación' })
        .expect(201);

      expect(res.body.estado).toBe(EstadoTramite.OBSERVADO);
    });
  });

  // ── 5. Responder observación como externo ──
  describe('5. Responder observación como externo', () => {
    let tramiteId: string;

    beforeEach(async () => {
      const now = new Date();
      const id = 'tram-resp-' + Date.now();
      tramitesStore.set(
        id,
        Tramite.fromProps({
          id,
          numero: 'TRAM-2026-77777',
          tipoTramiteId: TIPO_SA_ID,
          titulo: 'Test Responder',
          descripcion: '',
          origen: OrigenTramite.EXTERNO_INTERNO,
          estado: EstadoTramite.OBSERVADO,
          prioridad: Prioridad.MEDIA,
          areaActualId: AREA_ME_ID,
          usuarioAsignadoId: INT_MESA_ID,
          usuarioExternoId: EXT_ID,
          creadoPorTipo: TipoUsuario.EXTERNO,
          creadoPorId: EXT_ID,
          fechaCreacion: now,
          fechaActualizacion: now,
          fechaCierre: null,
          version: 1,
        }),
      );
      tramiteId = id;
    });

    it('POST /api/tramites/:id/responder-observacion — externo responde', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/tramites/${tramiteId}/responder-observacion`)
        .set('Authorization', `Bearer ${externalToken}`)
        .send({ comentario: 'Adjunto el comprobante solicitado' })
        .expect(201);

      expect(res.body.estado).toBe(EstadoTramite.INGRESADO);
    });

    it('POST /api/tramites/:id/responder-observacion — interno no puede (403)', async () => {
      await request(app.getHttpServer())
        .post(`/api/tramites/${tramiteId}/responder-observacion`)
        .set('X-Mock-User-Id', 'mock-mesa-001')
        .send({ comentario: 'Intento interno' })
        .expect(403);
    });
  });

  // ── 6. Aprobar trámite ──
  describe('6. Aprobar trámite', () => {
    let tramiteId: string;

    beforeEach(async () => {
      const now = new Date();
      const id = 'tram-apr-' + Date.now();
      tramitesStore.set(
        id,
        Tramite.fromProps({
          id,
          numero: 'TRAM-2026-66666',
          tipoTramiteId: TIPO_SA_ID,
          titulo: 'Test Aprobar',
          descripcion: '',
          origen: OrigenTramite.EXTERNO_INTERNO,
          estado: EstadoTramite.EN_REVISION,
          prioridad: Prioridad.MEDIA,
          areaActualId: AREA_ME_ID,
          usuarioAsignadoId: INT_MESA_ID,
          usuarioExternoId: EXT_ID,
          creadoPorTipo: TipoUsuario.EXTERNO,
          creadoPorId: EXT_ID,
          fechaCreacion: now,
          fechaActualizacion: now,
          fechaCierre: null,
          version: 1,
        }),
      );
      tramiteId = id;
    });

    it('POST /api/tramites/:id/aprobar — interno aprueba trámite', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/tramites/${tramiteId}/aprobar`)
        .set('X-Mock-User-Id', 'mock-mesa-001')
        .send({ comentario: 'Todo correcto' })
        .expect(201);

      expect(res.body.estado).toBe(EstadoTramite.APROBADO);
    });
  });

  // ── 7. Consultar historial ──
  describe('7. Consultar historial', () => {
    it('GET /api/tramites/:id/historial — retorna movimientos del trámite', async () => {
      const now = new Date();
      const tramiteId = 'tram-hist-' + Date.now();
      tramitesStore.set(
        tramiteId,
        Tramite.fromProps({
          id: tramiteId,
          numero: 'TRAM-2026-55555',
          tipoTramiteId: TIPO_SA_ID,
          titulo: 'Historial',
          descripcion: '',
          origen: OrigenTramite.EXTERNO_INTERNO,
          estado: EstadoTramite.BORRADOR,
          prioridad: Prioridad.BAJA,
          areaActualId: AREA_ME_ID,
          usuarioAsignadoId: null,
          usuarioExternoId: EXT_ID,
          creadoPorTipo: TipoUsuario.EXTERNO,
          creadoPorId: EXT_ID,
          fechaCreacion: now,
          fechaActualizacion: now,
          fechaCierre: null,
          version: 1,
        }),
      );

      // Add some movements to the store
      const fecha = now;
      movimientosStore.push(
        MovimientoTramite.create({
          id: 'm1',
          tramiteId,
          estadoAnterior: null,
          estadoNuevo: EstadoTramite.BORRADOR,
          accion: AccionMovimiento.CREAR,
          fecha,
          usuarioTipo: TipoUsuario.EXTERNO,
          usuarioId: EXT_ID,
          areaAnteriorId: null,
          areaNuevaId: AREA_ME_ID,
          comentario: null,
        }),
        MovimientoTramite.create({
          id: 'm2',
          tramiteId,
          estadoAnterior: EstadoTramite.BORRADOR,
          estadoNuevo: EstadoTramite.INGRESADO,
          accion: AccionMovimiento.INGRESAR,
          fecha,
          usuarioTipo: TipoUsuario.INTERNO,
          usuarioId: INT_MESA_ID,
          areaAnteriorId: AREA_ME_ID,
          areaNuevaId: AREA_ME_ID,
          comentario: null,
        }),
      );

      const res = await request(app.getHttpServer())
        .get(`/api/tramites/${tramiteId}/historial`)
        .set('X-Mock-User-Id', 'mock-admin-001')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ── 8. Validar que externo no vea trámites ajenos ──
  describe('8. Externo no ve trámites ajenos', () => {
    it('GET /api/tramites — externo solo ve sus propios trámites', async () => {
      const now = new Date();

      // Trámite del externo 1
      tramitesStore.set(
        't1',
        Tramite.fromProps({
          id: 't1',
          numero: 'TRAM-2026-11111',
          tipoTramiteId: TIPO_SA_ID,
          titulo: 'Mio',
          descripcion: '',
          origen: OrigenTramite.EXTERNO_INTERNO,
          estado: EstadoTramite.BORRADOR,
          prioridad: Prioridad.BAJA,
          areaActualId: AREA_ME_ID,
          usuarioAsignadoId: null,
          usuarioExternoId: EXT_ID,
          creadoPorTipo: TipoUsuario.EXTERNO,
          creadoPorId: EXT_ID,
          fechaCreacion: now,
          fechaActualizacion: now,
          fechaCierre: null,
          version: 1,
        }),
      );

      // Trámite de otro externo
      tramitesStore.set(
        't2',
        Tramite.fromProps({
          id: 't2',
          numero: 'TRAM-2026-22222',
          tipoTramiteId: TIPO_SA_ID,
          titulo: 'Ajeno',
          descripcion: '',
          origen: OrigenTramite.EXTERNO_INTERNO,
          estado: EstadoTramite.BORRADOR,
          prioridad: Prioridad.BAJA,
          areaActualId: AREA_ME_ID,
          usuarioAsignadoId: null,
          usuarioExternoId: EXT_ID_2,
          creadoPorTipo: TipoUsuario.EXTERNO,
          creadoPorId: EXT_ID_2,
          fechaCreacion: now,
          fechaActualizacion: now,
          fechaCierre: null,
          version: 1,
        }),
      );

      const tokenExt1 = jwtService.sign({
        sub: EXT_ID,
        email: 'externo1@test.com',
      });

      const res = await request(app.getHttpServer())
        .get('/api/tramites')
        .set('Authorization', `Bearer ${tokenExt1}`)
        .expect(200);

      expect(
        res.body.data.every(
          (t: Record<string, string>) =>
            t.usuarioExternoId === EXT_ID || t.creadoPorId === EXT_ID,
        ),
      ).toBe(true);
    });
  });

  // ── 9. Validar 403 en acciones no permitidas ──
  describe('9. Validar 403 en acciones no permitidas', () => {
    let tramiteId: string;

    beforeEach(async () => {
      const now = new Date();
      const id = 'tram-403-' + Date.now();
      tramitesStore.set(
        id,
        Tramite.fromProps({
          id,
          numero: 'TRAM-2026-33333',
          tipoTramiteId: TIPO_SA_ID,
          titulo: 'Test 403',
          descripcion: '',
          origen: OrigenTramite.EXTERNO_INTERNO,
          estado: EstadoTramite.EN_REVISION,
          prioridad: Prioridad.MEDIA,
          areaActualId: AREA_ME_ID,
          usuarioAsignadoId: INT_MESA_ID,
          usuarioExternoId: EXT_ID,
          creadoPorTipo: TipoUsuario.EXTERNO,
          creadoPorId: EXT_ID,
          fechaCreacion: now,
          fechaActualizacion: now,
          fechaCierre: null,
          version: 1,
        }),
      );
      tramiteId = id;
    });

    it('Externo obtiene 403 al intentar aprobar', async () => {
      await request(app.getHttpServer())
        .post(`/api/tramites/${tramiteId}/aprobar`)
        .set('Authorization', `Bearer ${externalToken}`)
        .send({ comentario: 'Intento' })
        .expect(403);
    });

    it('Externo obtiene 403 al intentar ingresar', async () => {
      await request(app.getHttpServer())
        .post(`/api/tramites/${tramiteId}/ingresar`)
        .set('Authorization', `Bearer ${externalToken}`)
        .expect(403);
    });
  });

  // ── 10. Validar concurrencia al tomar trámite ──
  describe('10. Validar concurrencia al tomar trámite', () => {
    it('El dominio rechaza tomar un trámite ya asignado a otro usuario', async () => {
      const now = new Date();
      const tramiteId = 'tram-conc-' + Date.now();

      // Crear un Tramite en INGRESADO pero YA ASIGNADO a otro usuario
      // (simula que otro usuario lo tomó primero en una transacción concurrente)
      const tramite = Tramite.fromProps({
        id: tramiteId,
        numero: 'TRAM-2026-44444',
        tipoTramiteId: TIPO_SA_ID,
        titulo: 'Concurrencia',
        descripcion: '',
        origen: OrigenTramite.EXTERNO_INTERNO,
        estado: EstadoTramite.INGRESADO,
        prioridad: Prioridad.MEDIA,
        areaActualId: AREA_ME_ID,
        usuarioAsignadoId: 'otro-usuario-ya-tomo', // ← Ya tomado por otro
        usuarioExternoId: EXT_ID,
        creadoPorTipo: TipoUsuario.EXTERNO,
        creadoPorId: EXT_ID,
        fechaCreacion: now,
        fechaActualizacion: now,
        fechaCierre: null,
        version: 1,
      });

      // El dominio debe rechazar que un usuario diferente lo tome
      expect(() => tramite.tomar(INT_MESA_ID, AREA_ME_ID)).toThrow(
        'El trámite ya fue tomado por otro usuario',
      );
    });
  });
});
