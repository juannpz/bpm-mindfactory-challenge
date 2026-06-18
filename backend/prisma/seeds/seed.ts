import { PrismaClient } from '../../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';

const adapter = new PrismaPg({
  connectionString:
    process.env.DATABASE_URL ?? 'postgresql://bpm:bpm@localhost:5432/bpm_db',
});
const prisma = new PrismaClient({ adapter });

const AREA_ME = 'a0000001-0000-4000-8000-000000000001';
const AREA_ADM = 'a0000002-0000-4000-8000-000000000002';
const AREA_LEG = 'a0000003-0000-4000-8000-000000000003';

const USER_ADMIN = 'u0000001-0000-4000-8000-000000000001';
const USER_MESA = 'u0000002-0000-4000-8000-000000000002';
const USER_SUP = 'u0000003-0000-4000-8000-000000000003';
const USER_OP_LEG = 'u0000004-0000-4000-8000-000000000004';
const USER_AUDIT = 'u0000005-0000-4000-8000-000000000005';

const EXT_JUAN = 'e0000001-0000-4000-8000-000000000001';
const EXT_MARIA = 'e0000002-0000-4000-8000-000000000002';
const EXT_CARLOS = 'e0000003-0000-4000-8000-000000000003';

const TIPO_SAP = 't0000001-0000-4000-8000-000000000001';
const TIPO_RA = 't0000002-0000-4000-8000-000000000002';
const TIPO_RL = 't0000003-0000-4000-8000-000000000003';
const TIPO_SA = 't0000004-0000-4000-8000-000000000004';

const T1 = 'p0000001-0000-4000-8000-000000000001';
const T2 = 'p0000002-0000-4000-8000-000000000002';
const T3 = 'p0000003-0000-4000-8000-000000000003';
const T4 = 'p0000004-0000-4000-8000-000000000004';
const T5 = 'p0000005-0000-4000-8000-000000000005';
const T6 = 'p0000006-0000-4000-8000-000000000006';
const T7 = 'p0000007-0000-4000-8000-000000000007';
const T8 = 'p0000008-0000-4000-8000-000000000008';
const T9 = 'p0000009-0000-4000-8000-000000000009';
const T10 = 'p0000010-0000-4000-8000-000000000010';

async function main() {
  console.log('🌱 Iniciando seeds...');

  await prisma.$transaction([
    prisma.comentarioTramite.deleteMany(),
    prisma.documentoTramite.deleteMany(),
    prisma.movimientoTramite.deleteMany(),
    prisma.tramite.deleteMany(),
    prisma.tipoTramite.deleteMany(),
    prisma.usuarioExterno.deleteMany(),
    prisma.usuarioInterno.deleteMany(),
    prisma.area.deleteMany(),
  ]);
  console.log('🧹 Datos previos eliminados.');

  // ── Áreas ──
  await prisma.area.createMany({
    data: [
      { id: AREA_ME, nombre: 'Mesa de Entrada', codigo: 'ME', activa: true },
      { id: AREA_ADM, nombre: 'Administración', codigo: 'ADM', activa: true },
      { id: AREA_LEG, nombre: 'Legales', codigo: 'LEG', activa: true },
    ],
  });
  console.log('✅ 3 Áreas creadas.');

  // ── Usuarios internos ──
  await prisma.usuarioInterno.createMany({
    data: [
      {
        id: USER_ADMIN,
        nombre: 'Admin General',
        email: 'admin@oficina.local',
        areaId: AREA_ME,
        rol: 'ADMIN',
        azureObjectId: 'mock-admin-001',
        activo: true,
      },
      {
        id: USER_MESA,
        nombre: 'Operador Mesa de Entrada',
        email: 'mesa@oficina.local',
        areaId: AREA_ME,
        rol: 'MESA_ENTRADA',
        azureObjectId: 'mock-mesa-001',
        activo: true,
      },
      {
        id: USER_SUP,
        nombre: 'Supervisor Administración',
        email: 'sup@oficina.local',
        areaId: AREA_ADM,
        rol: 'SUPERVISOR',
        azureObjectId: 'mock-sup-001',
        activo: true,
      },
      {
        id: USER_OP_LEG,
        nombre: 'Operador Legal',
        email: 'legal@oficina.local',
        areaId: AREA_LEG,
        rol: 'OPERADOR',
        azureObjectId: 'mock-legal-001',
        activo: true,
      },
      {
        id: USER_AUDIT,
        nombre: 'Auditor',
        email: 'auditor@oficina.local',
        areaId: AREA_ADM,
        rol: 'AUDITOR',
        azureObjectId: 'mock-audit-001',
        activo: true,
      },
    ],
  });
  console.log('✅ 5 Usuarios internos creados.');

  // ── Usuarios externos ──
  const passwordHash = await bcrypt.hash('Password123!', 10);
  await prisma.usuarioExterno.createMany({
    data: [
      {
        id: EXT_JUAN,
        nombre: 'Juan Pérez',
        email: 'externo1@test.com',
        passwordHash,
        documento: '20123456789',
        organizacion: 'Empresa ABC',
        estado: 'ACTIVO',
      },
      {
        id: EXT_MARIA,
        nombre: 'María García',
        email: 'externo2@test.com',
        passwordHash,
        documento: '27987654321',
        organizacion: 'Consultora XYZ',
        estado: 'ACTIVO',
      },
      {
        id: EXT_CARLOS,
        nombre: 'Carlos López',
        email: 'externo3@test.com',
        passwordHash,
        documento: '23111222333',
        organizacion: 'Servicios Sur',
        estado: 'PENDIENTE_VERIFICACION',
      },
    ],
  });
  console.log('✅ 3 Usuarios externos creados.');

  // ── Tipos de trámite ──
  await prisma.tipoTramite.createMany({
    data: [
      {
        id: TIPO_SAP,
        codigo: 'SOLICITUD_ALTA_PROVEEDOR',
        nombre: 'Solicitud de Alta de Proveedor',
        descripcion:
          'Trámite para dar de alta un nuevo proveedor en el sistema.',
        activo: true,
        requiereExterno: false,
        permiteInicioExterno: false,
        slaHoras: 48,
        areaInicialId: AREA_ME,
      },
      {
        id: TIPO_RA,
        codigo: 'RECLAMO_ADMINISTRATIVO',
        nombre: 'Reclamo Administrativo',
        descripcion:
          'Reclamo formal iniciado por un ciudadano o entidad externa.',
        activo: true,
        requiereExterno: false,
        permiteInicioExterno: true,
        slaHoras: 72,
        areaInicialId: AREA_ME,
      },
      {
        id: TIPO_RL,
        codigo: 'REVISION_LEGAL',
        nombre: 'Revisión Legal',
        descripcion:
          'Revisión de documentación legal que requiere intervención de un abogado externo.',
        activo: true,
        requiereExterno: true,
        permiteInicioExterno: false,
        slaHoras: 96,
        areaInicialId: AREA_LEG,
      },
      {
        id: TIPO_SA,
        codigo: 'SOLICITUD_ACCESO',
        nombre: 'Solicitud de Acceso',
        descripcion: 'Solicitud de acceso a sistemas o instalaciones.',
        activo: true,
        requiereExterno: false,
        permiteInicioExterno: true,
        slaHoras: 24,
        areaInicialId: AREA_ADM,
      },
    ],
  });
  console.log('✅ 4 Tipos de trámite creados.');

  // ── Trámites ──
  const now = new Date();
  const d = (hoursAgo: number) => new Date(now.getTime() - hoursAgo * 3600000);

  // T1: INTERNO_INTERNO - BORRADOR
  await prisma.tramite.create({
    data: {
      id: T1,
      numero: 'TRAM-2026-00001',
      tipoTramiteId: TIPO_SAP,
      titulo: 'Alta de proveedor de insumos de oficina',
      descripcion: 'Se solicita el alta del proveedor OficinaMax S.A.',
      origen: 'INTERNO_INTERNO',
      estado: 'BORRADOR',
      prioridad: 'MEDIA',
      areaActualId: AREA_ME,
      creadoPorTipo: 'INTERNO',
      creadoPorInternoId: USER_ADMIN,
      version: 1,
    },
  });
  await prisma.movimientoTramite.create({
    data: {
      id: 'm0000001-0000-4000-8000-000000000001',
      tramiteId: T1,
      estadoAnterior: null,
      estadoNuevo: 'BORRADOR',
      areaNuevaId: AREA_ME,
      usuarioTipo: 'INTERNO',
      usuarioId: USER_ADMIN,
      accion: 'CREAR',
      fecha: d(120),
    },
  });

  // T2: INTERNO_INTERNO - INGRESADO
  await prisma.tramite.create({
    data: {
      id: T2,
      numero: 'TRAM-2026-00002',
      tipoTramiteId: TIPO_SAP,
      titulo: 'Alta de proveedor de servicios de limpieza',
      descripcion: 'Incorporación de CleanPro S.R.L. como proveedor.',
      origen: 'INTERNO_INTERNO',
      estado: 'INGRESADO',
      prioridad: 'ALTA',
      areaActualId: AREA_ME,
      creadoPorTipo: 'INTERNO',
      creadoPorInternoId: USER_ADMIN,
      version: 2,
      fechaCreacion: d(100),
      fechaActualizacion: d(96),
    },
  });
  await prisma.movimientoTramite.createMany({
    data: [
      {
        id: 'm0000002-0000-4000-8000-000000000002',
        tramiteId: T2,
        estadoAnterior: null,
        estadoNuevo: 'BORRADOR',
        areaNuevaId: AREA_ME,
        usuarioTipo: 'INTERNO',
        usuarioId: USER_ADMIN,
        accion: 'CREAR',
        fecha: d(100),
      },
      {
        id: 'm0000003-0000-4000-8000-000000000003',
        tramiteId: T2,
        estadoAnterior: 'BORRADOR',
        estadoNuevo: 'INGRESADO',
        areaAnteriorId: AREA_ME,
        areaNuevaId: AREA_ME,
        usuarioTipo: 'INTERNO',
        usuarioId: USER_MESA,
        accion: 'INGRESAR',
        comentario: 'Documentación recibida y verificada.',
        fecha: d(96),
      },
    ],
  });

  // T3: INTERNO_INTERNO - CERRADO (pasó por APROBADO)
  await prisma.tramite.create({
    data: {
      id: T3,
      numero: 'TRAM-2026-00003',
      tipoTramiteId: TIPO_SAP,
      titulo: 'Alta de proveedor de papelería',
      descripcion: 'Papeles del Sur S.A. — alta completada y cerrada.',
      origen: 'INTERNO_INTERNO',
      estado: 'CERRADO',
      prioridad: 'BAJA',
      areaActualId: AREA_ME,
      creadoPorTipo: 'INTERNO',
      creadoPorInternoId: USER_ADMIN,
      version: 4,
      fechaCreacion: d(240),
      fechaActualizacion: d(24),
      fechaCierre: d(24),
    },
  });
  await prisma.movimientoTramite.createMany({
    data: [
      {
        id: 'm0000004-0000-4000-8000-000000000004',
        tramiteId: T3,
        estadoAnterior: null,
        estadoNuevo: 'BORRADOR',
        areaNuevaId: AREA_ME,
        usuarioTipo: 'INTERNO',
        usuarioId: USER_ADMIN,
        accion: 'CREAR',
        fecha: d(240),
      },
      {
        id: 'm0000005-0000-4000-8000-000000000005',
        tramiteId: T3,
        estadoAnterior: 'BORRADOR',
        estadoNuevo: 'INGRESADO',
        areaAnteriorId: AREA_ME,
        areaNuevaId: AREA_ME,
        usuarioTipo: 'INTERNO',
        usuarioId: USER_MESA,
        accion: 'INGRESAR',
        fecha: d(200),
      },
      {
        id: 'm0000006-0000-4000-8000-000000000006',
        tramiteId: T3,
        estadoAnterior: 'INGRESADO',
        estadoNuevo: 'APROBADO',
        areaAnteriorId: AREA_ME,
        areaNuevaId: AREA_ME,
        usuarioTipo: 'INTERNO',
        usuarioId: USER_MESA,
        accion: 'APROBAR',
        comentario: 'Proveedor validado. Se aprueba el alta.',
        fecha: d(100),
      },
      {
        id: 'm0000007-0000-4000-8000-000000000007',
        tramiteId: T3,
        estadoAnterior: 'APROBADO',
        estadoNuevo: 'CERRADO',
        areaAnteriorId: AREA_ME,
        areaNuevaId: AREA_ME,
        usuarioTipo: 'INTERNO',
        usuarioId: USER_ADMIN,
        accion: 'CERRAR',
        comentario: 'Trámite archivado.',
        fecha: d(24),
      },
    ],
  });

  // T4: INTERNO_INTERNO - RECHAZADO
  await prisma.tramite.create({
    data: {
      id: T4,
      numero: 'TRAM-2026-00004',
      tipoTramiteId: TIPO_SAP,
      titulo: 'Alta de proveedor de transporte',
      descripcion: 'Transportes Rápidos S.A. no cumple requisitos.',
      origen: 'INTERNO_INTERNO',
      estado: 'RECHAZADO',
      prioridad: 'MEDIA',
      areaActualId: AREA_ME,
      creadoPorTipo: 'INTERNO',
      creadoPorInternoId: USER_SUP,
      version: 3,
      fechaCreacion: d(170),
      fechaActualizacion: d(48),
    },
  });
  await prisma.movimientoTramite.createMany({
    data: [
      {
        id: 'm0000008-0000-4000-8000-000000000008',
        tramiteId: T4,
        estadoAnterior: null,
        estadoNuevo: 'BORRADOR',
        areaNuevaId: AREA_ME,
        usuarioTipo: 'INTERNO',
        usuarioId: USER_SUP,
        accion: 'CREAR',
        fecha: d(170),
      },
      {
        id: 'm0000009-0000-4000-8000-000000000009',
        tramiteId: T4,
        estadoAnterior: 'BORRADOR',
        estadoNuevo: 'INGRESADO',
        areaAnteriorId: AREA_ME,
        areaNuevaId: AREA_ME,
        usuarioTipo: 'INTERNO',
        usuarioId: USER_MESA,
        accion: 'INGRESAR',
        fecha: d(120),
      },
      {
        id: 'm0000010-0000-4000-8000-000000000010',
        tramiteId: T4,
        estadoAnterior: 'INGRESADO',
        estadoNuevo: 'RECHAZADO',
        areaAnteriorId: AREA_ME,
        areaNuevaId: AREA_ME,
        usuarioTipo: 'INTERNO',
        usuarioId: USER_MESA,
        accion: 'RECHAZAR',
        comentario:
          'El proveedor no cuenta con la habilitación municipal requerida.',
        fecha: d(48),
      },
    ],
  });

  // T5: INTERNO_EXTERNO - ESPERANDO_EXTERNO
  await prisma.tramite.create({
    data: {
      id: T5,
      numero: 'TRAM-2026-00005',
      tipoTramiteId: TIPO_RL,
      titulo: 'Revisión de contrato de locación',
      descripcion:
        'Se requiere revisión legal del contrato de alquiler del depósito.',
      origen: 'INTERNO_EXTERNO',
      estado: 'ESPERANDO_EXTERNO',
      prioridad: 'ALTA',
      areaActualId: AREA_LEG,
      usuarioExternoId: EXT_JUAN,
      creadoPorTipo: 'INTERNO',
      creadoPorInternoId: USER_OP_LEG,
      version: 3,
      fechaCreacion: d(96),
      fechaActualizacion: d(30),
    },
  });
  await prisma.movimientoTramite.createMany({
    data: [
      {
        id: 'm0000011-0000-4000-8000-000000000011',
        tramiteId: T5,
        estadoAnterior: null,
        estadoNuevo: 'BORRADOR',
        areaNuevaId: AREA_LEG,
        usuarioTipo: 'INTERNO',
        usuarioId: USER_OP_LEG,
        accion: 'CREAR',
        fecha: d(96),
      },
      {
        id: 'm0000012-0000-4000-8000-000000000012',
        tramiteId: T5,
        estadoAnterior: 'BORRADOR',
        estadoNuevo: 'INGRESADO',
        areaAnteriorId: AREA_LEG,
        areaNuevaId: AREA_LEG,
        usuarioTipo: 'INTERNO',
        usuarioId: USER_OP_LEG,
        accion: 'INGRESAR',
        fecha: d(72),
      },
      {
        id: 'm0000013-0000-4000-8000-000000000013',
        tramiteId: T5,
        estadoAnterior: 'INGRESADO',
        estadoNuevo: 'ESPERANDO_EXTERNO',
        areaAnteriorId: AREA_LEG,
        areaNuevaId: AREA_LEG,
        usuarioTipo: 'INTERNO',
        usuarioId: USER_OP_LEG,
        accion: 'SOLICITAR_INTERVENCION_EXTERNA',
        comentario:
          'Se necesita que el abogado externo revise las cláusulas 4, 7 y 12.',
        fecha: d(30),
      },
    ],
  });

  // T6: INTERNO_EXTERNO - ESPERANDO_INTERNO
  await prisma.tramite.create({
    data: {
      id: T6,
      numero: 'TRAM-2026-00006',
      tipoTramiteId: TIPO_RL,
      titulo: 'Revisión de acuerdo de confidencialidad NDA',
      descripcion: 'Revisión del NDA con TechPartners Inc.',
      origen: 'INTERNO_EXTERNO',
      estado: 'ESPERANDO_INTERNO',
      prioridad: 'URGENTE',
      areaActualId: AREA_LEG,
      usuarioExternoId: EXT_MARIA,
      creadoPorTipo: 'INTERNO',
      creadoPorInternoId: USER_OP_LEG,
      version: 4,
      fechaCreacion: d(80),
      fechaActualizacion: d(5),
    },
  });
  await prisma.movimientoTramite.createMany({
    data: [
      {
        id: 'm0000014-0000-4000-8000-000000000014',
        tramiteId: T6,
        estadoAnterior: null,
        estadoNuevo: 'BORRADOR',
        areaNuevaId: AREA_LEG,
        usuarioTipo: 'INTERNO',
        usuarioId: USER_OP_LEG,
        accion: 'CREAR',
        fecha: d(80),
      },
      {
        id: 'm0000015-0000-4000-8000-000000000015',
        tramiteId: T6,
        estadoAnterior: 'BORRADOR',
        estadoNuevo: 'INGRESADO',
        areaAnteriorId: AREA_LEG,
        areaNuevaId: AREA_LEG,
        usuarioTipo: 'INTERNO',
        usuarioId: USER_OP_LEG,
        accion: 'INGRESAR',
        fecha: d(60),
      },
      {
        id: 'm0000016-0000-4000-8000-000000000016',
        tramiteId: T6,
        estadoAnterior: 'INGRESADO',
        estadoNuevo: 'ESPERANDO_EXTERNO',
        areaAnteriorId: AREA_LEG,
        areaNuevaId: AREA_LEG,
        usuarioTipo: 'INTERNO',
        usuarioId: USER_OP_LEG,
        accion: 'SOLICITAR_INTERVENCION_EXTERNA',
        comentario: 'Por favor revisar el NDA adjunto.',
        fecha: d(30),
      },
      {
        id: 'm0000017-0000-4000-8000-000000000017',
        tramiteId: T6,
        estadoAnterior: 'ESPERANDO_EXTERNO',
        estadoNuevo: 'ESPERANDO_INTERNO',
        areaAnteriorId: AREA_LEG,
        areaNuevaId: AREA_LEG,
        usuarioTipo: 'EXTERNO',
        usuarioId: EXT_MARIA,
        accion: 'RESPONDER_INTERVENCION_EXTERNA',
        comentario:
          'Revisé el NDA. En general está bien, pero sugiero modificar la cláusula de confidencialidad para extenderla a 5 años.',
        fecha: d(5),
      },
    ],
  });

  // T7: EXTERNO_INTERNO - OBSERVADO
  await prisma.tramite.create({
    data: {
      id: T7,
      numero: 'TRAM-2026-00007',
      tipoTramiteId: TIPO_RA,
      titulo: 'Reclamo por facturación incorrecta',
      descripcion:
        'El usuario reporta cargos indebidos en su última factura de servicios.',
      origen: 'EXTERNO_INTERNO',
      estado: 'OBSERVADO',
      prioridad: 'ALTA',
      areaActualId: AREA_ME,
      usuarioExternoId: EXT_JUAN,
      creadoPorTipo: 'EXTERNO',
      creadoPorExternoId: EXT_JUAN,
      version: 4,
      fechaCreacion: d(72),
      fechaActualizacion: d(8),
    },
  });
  await prisma.movimientoTramite.createMany({
    data: [
      {
        id: 'm0000018-0000-4000-8000-000000000018',
        tramiteId: T7,
        estadoAnterior: null,
        estadoNuevo: 'BORRADOR',
        areaNuevaId: AREA_ME,
        usuarioTipo: 'EXTERNO',
        usuarioId: EXT_JUAN,
        accion: 'CREAR',
        fecha: d(72),
      },
      {
        id: 'm0000019-0000-4000-8000-000000000019',
        tramiteId: T7,
        estadoAnterior: 'BORRADOR',
        estadoNuevo: 'INGRESADO',
        areaAnteriorId: AREA_ME,
        areaNuevaId: AREA_ME,
        usuarioTipo: 'INTERNO',
        usuarioId: USER_MESA,
        accion: 'INGRESAR',
        comentario: 'Reclamo ingresado por mesa de entrada.',
        fecha: d(48),
      },
      {
        id: 'm0000020-0000-4000-8000-000000000020',
        tramiteId: T7,
        estadoAnterior: 'INGRESADO',
        estadoNuevo: 'EN_REVISION',
        areaAnteriorId: AREA_ME,
        areaNuevaId: AREA_ME,
        usuarioTipo: 'INTERNO',
        usuarioId: USER_MESA,
        accion: 'TOMAR',
        fecha: d(24),
      },
      {
        id: 'm0000021-0000-4000-8000-000000000021',
        tramiteId: T7,
        estadoAnterior: 'EN_REVISION',
        estadoNuevo: 'OBSERVADO',
        areaAnteriorId: AREA_ME,
        areaNuevaId: AREA_ME,
        usuarioTipo: 'INTERNO',
        usuarioId: USER_MESA,
        accion: 'OBSERVAR',
        comentario:
          'Se necesita que el usuario adjunte el comprobante de pago para continuar.',
        fecha: d(8),
      },
    ],
  });

  // T8: EXTERNO_INTERNO - CANCELADO
  await prisma.tramite.create({
    data: {
      id: T8,
      numero: 'TRAM-2026-00008',
      tipoTramiteId: TIPO_SA,
      titulo: 'Solicitud de acceso al estacionamiento',
      descripcion:
        'Solicitud de tarjeta de acceso al estacionamiento del edificio.',
      origen: 'EXTERNO_INTERNO',
      estado: 'CANCELADO',
      prioridad: 'BAJA',
      areaActualId: AREA_ADM,
      usuarioExternoId: EXT_CARLOS,
      creadoPorTipo: 'EXTERNO',
      creadoPorExternoId: EXT_CARLOS,
      version: 3,
      fechaCreacion: d(200),
      fechaActualizacion: d(150),
    },
  });
  await prisma.movimientoTramite.createMany({
    data: [
      {
        id: 'm0000022-0000-4000-8000-000000000022',
        tramiteId: T8,
        estadoAnterior: null,
        estadoNuevo: 'BORRADOR',
        areaNuevaId: AREA_ADM,
        usuarioTipo: 'EXTERNO',
        usuarioId: EXT_CARLOS,
        accion: 'CREAR',
        fecha: d(200),
      },
      {
        id: 'm0000023-0000-4000-8000-000000000023',
        tramiteId: T8,
        estadoAnterior: 'BORRADOR',
        estadoNuevo: 'INGRESADO',
        areaAnteriorId: AREA_ADM,
        areaNuevaId: AREA_ADM,
        usuarioTipo: 'INTERNO',
        usuarioId: USER_SUP,
        accion: 'INGRESAR',
        fecha: d(180),
      },
      {
        id: 'm0000024-0000-4000-8000-000000000024',
        tramiteId: T8,
        estadoAnterior: 'INGRESADO',
        estadoNuevo: 'CANCELADO',
        areaAnteriorId: AREA_ADM,
        areaNuevaId: AREA_ADM,
        usuarioTipo: 'INTERNO',
        usuarioId: USER_SUP,
        accion: 'CANCELAR',
        comentario:
          'El usuario no completó la documentación requerida en el plazo estipulado.',
        fecha: d(150),
      },
    ],
  });

  // T9: EXTERNO_INTERNO - EN_REVISION
  await prisma.tramite.create({
    data: {
      id: T9,
      numero: 'TRAM-2026-00009',
      tipoTramiteId: TIPO_RA,
      titulo: 'Reclamo por demora en entrega de documentación',
      descripcion:
        'El ciudadano solicita que se acelere la entrega de un certificado solicitado hace 60 días.',
      origen: 'EXTERNO_INTERNO',
      estado: 'EN_REVISION',
      prioridad: 'MEDIA',
      areaActualId: AREA_ME,
      usuarioAsignadoId: USER_MESA,
      usuarioExternoId: EXT_MARIA,
      creadoPorTipo: 'EXTERNO',
      creadoPorExternoId: EXT_MARIA,
      version: 3,
      fechaCreacion: d(48),
      fechaActualizacion: d(6),
    },
  });
  await prisma.movimientoTramite.createMany({
    data: [
      {
        id: 'm0000025-0000-4000-8000-000000000025',
        tramiteId: T9,
        estadoAnterior: null,
        estadoNuevo: 'BORRADOR',
        areaNuevaId: AREA_ME,
        usuarioTipo: 'EXTERNO',
        usuarioId: EXT_MARIA,
        accion: 'CREAR',
        fecha: d(48),
      },
      {
        id: 'm0000026-0000-4000-8000-000000000026',
        tramiteId: T9,
        estadoAnterior: 'BORRADOR',
        estadoNuevo: 'INGRESADO',
        areaAnteriorId: AREA_ME,
        areaNuevaId: AREA_ME,
        usuarioTipo: 'INTERNO',
        usuarioId: USER_MESA,
        accion: 'INGRESAR',
        fecha: d(24),
      },
      {
        id: 'm0000031-0000-4000-8000-000000000031',
        tramiteId: T9,
        estadoAnterior: 'INGRESADO',
        estadoNuevo: 'EN_REVISION',
        areaAnteriorId: AREA_ME,
        areaNuevaId: AREA_ME,
        usuarioTipo: 'INTERNO',
        usuarioId: USER_MESA,
        accion: 'TOMAR',
        comentario: 'Se inicia la revisión del reclamo.',
        fecha: d(6),
      },
    ],
  });

  // T10: EXTERNO_INTERNO - APROBADO
  await prisma.tramite.create({
    data: {
      id: T10,
      numero: 'TRAM-2026-00010',
      tipoTramiteId: TIPO_SA,
      titulo: 'Solicitud de acceso a sistema de gestión documental',
      descripcion:
        'El usuario externo requiere acceso al sistema de gestión documental para consultar expedientes.',
      origen: 'EXTERNO_INTERNO',
      estado: 'APROBADO',
      prioridad: 'URGENTE',
      areaActualId: AREA_ADM,
      usuarioAsignadoId: USER_SUP,
      usuarioExternoId: EXT_JUAN,
      creadoPorTipo: 'EXTERNO',
      creadoPorExternoId: EXT_JUAN,
      version: 4,
      fechaCreacion: d(72),
      fechaActualizacion: d(2),
    },
  });
  await prisma.movimientoTramite.createMany({
    data: [
      {
        id: 'm0000027-0000-4000-8000-000000000027',
        tramiteId: T10,
        estadoAnterior: null,
        estadoNuevo: 'BORRADOR',
        areaNuevaId: AREA_ADM,
        usuarioTipo: 'EXTERNO',
        usuarioId: EXT_JUAN,
        accion: 'CREAR',
        fecha: d(72),
      },
      {
        id: 'm0000028-0000-4000-8000-000000000028',
        tramiteId: T10,
        estadoAnterior: 'BORRADOR',
        estadoNuevo: 'INGRESADO',
        areaAnteriorId: AREA_ADM,
        areaNuevaId: AREA_ADM,
        usuarioTipo: 'INTERNO',
        usuarioId: USER_SUP,
        accion: 'INGRESAR',
        fecha: d(48),
      },
      {
        id: 'm0000029-0000-4000-8000-000000000029',
        tramiteId: T10,
        estadoAnterior: 'INGRESADO',
        estadoNuevo: 'EN_REVISION',
        areaAnteriorId: AREA_ADM,
        areaNuevaId: AREA_ADM,
        usuarioTipo: 'INTERNO',
        usuarioId: USER_SUP,
        accion: 'TOMAR',
        fecha: d(24),
      },
      {
        id: 'm0000030-0000-4000-8000-000000000030',
        tramiteId: T10,
        estadoAnterior: 'EN_REVISION',
        estadoNuevo: 'APROBADO',
        areaAnteriorId: AREA_ADM,
        areaNuevaId: AREA_ADM,
        usuarioTipo: 'INTERNO',
        usuarioId: USER_SUP,
        accion: 'APROBAR',
        comentario:
          'Acceso concedido. Se habilita usuario de solo lectura en el sistema de gestión documental.',
        fecha: d(2),
      },
    ],
  });

  console.log('✅ 10 Trámites creados con 31 movimientos de historial.');

  // ── Comentarios ──
  await prisma.comentarioTramite.createMany({
    data: [
      {
        id: 'c0000001-0000-4000-8000-000000000001',
        tramiteId: T1,
        mensaje:
          'Falta adjuntar el formulario de datos fiscales del proveedor.',
        visibilidad: 'INTERNA',
        autorTipo: 'INTERNO',
        autorId: USER_ADMIN,
        fecha: d(100),
      },
      {
        id: 'c0000002-0000-4000-8000-000000000002',
        tramiteId: T2,
        mensaje: 'Verifiqué la documentación. Todo en orden para continuar.',
        visibilidad: 'INTERNA',
        autorTipo: 'INTERNO',
        autorId: USER_MESA,
        fecha: d(90),
      },
      {
        id: 'c0000003-0000-4000-8000-000000000003',
        tramiteId: T3,
        mensaje:
          'Proveedor aprobado. Notificar a compras para incluirlo en el catálogo.',
        visibilidad: 'INTERNA',
        autorTipo: 'INTERNO',
        autorId: USER_MESA,
        fecha: d(50),
      },
      {
        id: 'c0000004-0000-4000-8000-000000000004',
        tramiteId: T3,
        mensaje: 'Trámite finalizado correctamente. Gracias.',
        visibilidad: 'TODOS',
        autorTipo: 'INTERNO',
        autorId: USER_ADMIN,
        fecha: d(20),
      },
      {
        id: 'c0000005-0000-4000-8000-000000000005',
        tramiteId: T5,
        mensaje:
          'Estimado Juan, por favor revisar el contrato adjunto. Quedamos atentos a su respuesta.',
        visibilidad: 'TODOS',
        autorTipo: 'INTERNO',
        autorId: USER_OP_LEG,
        fecha: d(28),
      },
      {
        id: 'c0000006-0000-4000-8000-000000000006',
        tramiteId: T6,
        mensaje:
          'Adjunto el NDA con mis observaciones en rojo. Quedo a disposición.',
        visibilidad: 'EXTERNA',
        autorTipo: 'EXTERNO',
        autorId: EXT_MARIA,
        fecha: d(4),
      },
      {
        id: 'c0000007-0000-4000-8000-000000000007',
        tramiteId: T6,
        mensaje:
          'Recibida la respuesta de la abogada externa. Revisar las marcas en el documento.',
        visibilidad: 'INTERNA',
        autorTipo: 'INTERNO',
        autorId: USER_OP_LEG,
        fecha: d(3),
      },
      {
        id: 'c0000008-0000-4000-8000-000000000008',
        tramiteId: T7,
        mensaje:
          'Necesitamos que el usuario presente el comprobante de pago antes de continuar.',
        visibilidad: 'INTERNA',
        autorTipo: 'INTERNO',
        autorId: USER_MESA,
        fecha: d(7),
      },
      {
        id: 'c0000009-0000-4000-8000-000000000009',
        tramiteId: T7,
        mensaje:
          'Sr. Pérez: para continuar con su reclamo necesitamos que adjunte el comprobante de pago del último mes.',
        visibilidad: 'TODOS',
        autorTipo: 'INTERNO',
        autorId: USER_MESA,
        fecha: d(7),
      },
      {
        id: 'c0000010-0000-4000-8000-000000000010',
        tramiteId: T8,
        mensaje:
          'Usuario no responde a los requerimientos de documentación. Se procede a cancelar.',
        visibilidad: 'INTERNA',
        autorTipo: 'INTERNO',
        autorId: USER_SUP,
        fecha: d(149),
      },
      {
        id: 'c0000011-0000-4000-8000-000000000011',
        tramiteId: T9,
        mensaje:
          'Reclamo en revisión. Se está verificando el estado del certificado solicitado.',
        visibilidad: 'TODOS',
        autorTipo: 'INTERNO',
        autorId: USER_MESA,
        fecha: d(5),
      },
      {
        id: 'c0000012-0000-4000-8000-000000000012',
        tramiteId: T10,
        mensaje:
          'Revisando los permisos solicitados. El usuario pide acceso de solo lectura.',
        visibilidad: 'INTERNA',
        autorTipo: 'INTERNO',
        autorId: USER_SUP,
        fecha: d(20),
      },
      {
        id: 'c0000013-0000-4000-8000-000000000013',
        tramiteId: T10,
        mensaje:
          'Acceso aprobado. Se notificará al usuario las credenciales de acceso.',
        visibilidad: 'TODOS',
        autorTipo: 'INTERNO',
        autorId: USER_SUP,
        fecha: d(1),
      },
    ],
  });
  console.log('✅ 13 Comentarios creados.');

  // ── Documentos simulados ──
  await prisma.documentoTramite.createMany({
    data: [
      {
        id: 'd0000001-0000-4000-8000-000000000001',
        tramiteId: T3,
        nombreArchivo: 'formulario_alta_proveedor.pdf',
        mimeType: 'application/pdf',
        size: 245760,
        storageKey: 'documents/T3/formulario_alta_proveedor.pdf',
        subidoPorTipo: 'INTERNO',
        subidoPorId: USER_MESA,
        fechaCarga: d(180),
      },
      {
        id: 'd0000002-0000-4000-8000-000000000002',
        tramiteId: T3,
        nombreArchivo: 'constancia_fiscal_proveedor.pdf',
        mimeType: 'application/pdf',
        size: 128000,
        storageKey: 'documents/T3/constancia_fiscal.pdf',
        subidoPorTipo: 'INTERNO',
        subidoPorId: USER_ADMIN,
        fechaCarga: d(150),
      },
      {
        id: 'd0000003-0000-4000-8000-000000000003',
        tramiteId: T5,
        nombreArchivo: 'contrato_locacion_deposito.docx',
        mimeType:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: 89000,
        storageKey: 'documents/T5/contrato_locacion.docx',
        subidoPorTipo: 'INTERNO',
        subidoPorId: USER_OP_LEG,
        fechaCarga: d(40),
      },
      {
        id: 'd0000004-0000-4000-8000-000000000004',
        tramiteId: T7,
        nombreArchivo: 'factura_ultimo_mes.pdf',
        mimeType: 'application/pdf',
        size: 320000,
        storageKey: 'documents/T7/factura.pdf',
        subidoPorTipo: 'EXTERNO',
        subidoPorId: EXT_JUAN,
        fechaCarga: d(60),
      },
      {
        id: 'd0000005-0000-4000-8000-000000000005',
        tramiteId: T6,
        nombreArchivo: 'NDA_TechPartners_revisado.pdf',
        mimeType: 'application/pdf',
        size: 156000,
        storageKey: 'documents/T6/NDA_revisado.pdf',
        subidoPorTipo: 'EXTERNO',
        subidoPorId: EXT_MARIA,
        fechaCarga: d(5),
      },
    ],
  });
  console.log('✅ 5 Documentos simulados creados.');

  console.log('🎉 Seeds completados exitosamente.');
}

main()
  .catch((e) => {
    console.error('❌ Error en seeds:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
