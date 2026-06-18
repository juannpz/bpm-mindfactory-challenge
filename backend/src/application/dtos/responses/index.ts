import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TramiteProps } from '@domain/aggregates/tramite.aggregate';
import { MovimientoTramiteProps } from '@domain/entities/movimiento-tramite.entity';
import { ComentarioTramiteProps } from '@domain/entities/comentario-tramite.entity';
import { DocumentoTramiteProps } from '@domain/entities/documento-tramite.entity';
import { AccionMovimiento } from '@domain/enums';

export class TramiteResponse {
  @ApiProperty({ example: 'uuid-tramite' })
  id: string;

  @ApiProperty({ example: 'TRAM-2026-00001' })
  numero: string;

  @ApiProperty({ example: 'uuid-tipo-tramite', nullable: true })
  tipoTramiteId: string | null;

  @ApiPropertyOptional({ example: 'Solicitud de Alta de Proveedor' })
  tipoTramiteNombre?: string | null;

  @ApiProperty({ example: 'Solicitud de alta de proveedor' })
  titulo: string;

  @ApiProperty({
    example: 'Se solicita alta de proveedor para el área de compras',
  })
  descripcion: string;

  @ApiProperty({ example: 'INTERNO_INTERNO' })
  origen: string;

  @ApiProperty({ example: 'EN_REVISION' })
  estado: string;

  @ApiProperty({ example: 'MEDIA' })
  prioridad: string;

  @ApiProperty({ example: 'uuid-area-actual', nullable: true })
  areaActualId: string | null;

  @ApiPropertyOptional({ example: 'Mesa de Entrada' })
  areaActualNombre?: string | null;

  @ApiProperty({ example: 'uuid-usuario-asignado', nullable: true })
  usuarioAsignadoId: string | null;

  @ApiPropertyOptional({ example: 'Admin General' })
  usuarioAsignadoNombre?: string | null;

  @ApiProperty({ example: 'uuid-usuario-externo', nullable: true })
  usuarioExternoId: string | null;

  @ApiPropertyOptional({ example: 'Juan Pérez' })
  usuarioExternoNombre?: string | null;

  @ApiProperty({ example: 'INTERNO' })
  creadoPorTipo: string;

  @ApiProperty({ example: 'uuid-creador' })
  creadoPorId: string;

  @ApiProperty({ example: '2026-06-16T12:00:00.000Z' })
  fechaCreacion: string;

  @ApiProperty({ example: '2026-06-17T15:30:00.000Z' })
  fechaActualizacion: string;

  @ApiProperty({ example: '2026-06-18T10:00:00.000Z', nullable: true })
  fechaCierre: string | null;

  @ApiProperty({ example: 3 })
  version: number;

  @ApiProperty({ example: ['INGRESAR', 'TOMAR', 'APROBAR', 'RECHAZAR'] })
  accionesDisponibles: string[];

  @ApiProperty({ example: false })
  slaVencido: boolean;

  constructor(data: Partial<TramiteResponse> = {}) {
    Object.assign(this, data);
  }
}

export class TramiteMeta {
  @ApiProperty({ example: 10 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 1 })
  totalPages: number;
}

export class TramiteListResponse {
  @ApiProperty({ type: [TramiteResponse] })
  data: TramiteResponse[];

  @ApiProperty({ type: TramiteMeta })
  meta: TramiteMeta;

  constructor(data: TramiteResponse[], meta: TramiteMeta) {
    this.data = data;
    this.meta = meta;
  }
}

export class MovimientoResponse {
  @ApiProperty({ example: 'uuid-movimiento' })
  id: string;

  @ApiProperty({ example: 'uuid-tramite' })
  tramiteId: string;

  @ApiProperty({ example: 'INGRESADO', nullable: true })
  estadoAnterior: string | null;

  @ApiProperty({ example: 'EN_REVISION' })
  estadoNuevo: string;

  @ApiProperty({ example: 'uuid-area-anterior', nullable: true })
  areaAnteriorId: string | null;

  @ApiProperty({ example: 'uuid-area-nueva', nullable: true })
  areaNuevaId: string | null;

  @ApiProperty({ example: 'INTERNO' })
  usuarioTipo: string;

  @ApiProperty({ example: 'uuid-usuario' })
  usuarioId: string;

  @ApiProperty({ example: 'TOMAR' })
  accion: string;

  @ApiProperty({ example: 'Trámite tomado para revisión', nullable: true })
  comentario: string | null;

  @ApiProperty({ example: '2026-06-17T12:00:00.000Z' })
  fecha: string;

  constructor(data: Partial<MovimientoResponse> = {}) {
    Object.assign(this, data);
  }
}

export class ComentarioResponse {
  @ApiProperty({ example: 'uuid-comentario' })
  id: string;

  @ApiProperty({ example: 'uuid-tramite' })
  tramiteId: string;

  @ApiProperty({ example: 'Revisar la documentación adjunta' })
  mensaje: string;

  @ApiProperty({ example: 'INTERNA' })
  visibilidad: string;

  @ApiProperty({ example: 'INTERNO' })
  autorTipo: string;

  @ApiProperty({ example: 'uuid-autor' })
  autorId: string;

  @ApiPropertyOptional({ example: 'Admin General' })
  autorNombre?: string | null;

  @ApiProperty({ example: '2026-06-17T14:00:00.000Z' })
  fecha: string;

  constructor(data: Partial<ComentarioResponse> = {}) {
    Object.assign(this, data);
  }
}

export class DocumentoResponse {
  @ApiProperty({ example: 'uuid-documento' })
  id: string;

  @ApiProperty({ example: 'uuid-tramite' })
  tramiteId: string;

  @ApiProperty({ example: 'informe.pdf' })
  nombreArchivo: string;

  @ApiProperty({ example: 'application/pdf' })
  mimeType: string;

  @ApiProperty({ example: 102400 })
  size: number;

  @ApiProperty({ example: 'uploads/uuid-informe.pdf' })
  storageKey: string;

  @ApiProperty({ example: 'EXTERNO' })
  subidoPorTipo: string;

  @ApiProperty({ example: 'uuid-usuario' })
  subidoPorId: string;

  @ApiProperty({ example: '2026-06-17T16:00:00.000Z' })
  fechaCarga: string;

  constructor(data: Partial<DocumentoResponse> = {}) {
    Object.assign(this, data);
  }
}

export class DashboardResponse {
  @ApiProperty({ example: { BORRADOR: 1, INGRESADO: 2, EN_REVISION: 3 } })
  tramitesPorEstado: Record<string, number>;

  @ApiProperty({
    example: { INTERNO_INTERNO: 4, EXTERNO_INTERNO: 4, INTERNO_EXTERNO: 2 },
  })
  tramitesPorOrigen: Record<string, number>;

  @ApiProperty({ example: 3 })
  tramitesVencidos: number;

  @ApiProperty({ example: 48.5 })
  promedioResolucionHoras: number;

  @ApiProperty({ example: { ME: 5, ADM: 3, LEG: 2 } })
  cantidadPorArea: Record<string, number>;

  @ApiProperty({ type: [MovimientoResponse] })
  ultimosMovimientos: MovimientoResponse[];

  constructor(data: Partial<DashboardResponse> = {}) {
    Object.assign(this, data);
  }
}

export class AuthUsuario {
  @ApiProperty({ example: 'uuid-usuario' })
  id: string;

  @ApiProperty({ example: 'Admin General' })
  nombre: string;

  @ApiProperty({ example: 'admin@empresa.com' })
  email: string;

  @ApiProperty({ example: 'INTERNO' })
  tipo: string;

  @ApiPropertyOptional({ example: 'ADMIN' })
  rol?: string;

  @ApiPropertyOptional({ example: 'uuid-area' })
  areaId?: string;
}

export class AuthResponse {
  @ApiProperty({ example: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...' })
  token: string;

  @ApiProperty({ type: AuthUsuario })
  usuario: AuthUsuario;

  constructor(token: string, usuario: AuthUsuario) {
    this.token = token;
    this.usuario = usuario;
  }
}

export function mapTramiteToResponse(
  t: TramiteProps & {
    accionesDisponibles?: AccionMovimiento[];
    slaVencido?: boolean;
  },
): TramiteResponse {
  return new TramiteResponse({
    id: t.id,
    numero: t.numero,
    tipoTramiteId: t.tipoTramiteId,
    tipoTramiteNombre: t.tipoTramiteNombre ?? null,
    titulo: t.titulo,
    descripcion: t.descripcion,
    origen: t.origen,
    estado: t.estado,
    prioridad: t.prioridad,
    areaActualId: t.areaActualId,
    areaActualNombre: t.areaActualNombre ?? null,
    usuarioAsignadoId: t.usuarioAsignadoId,
    usuarioAsignadoNombre: t.usuarioAsignadoNombre ?? null,
    usuarioExternoId: t.usuarioExternoId,
    usuarioExternoNombre: t.usuarioExternoNombre ?? null,
    creadoPorTipo: t.creadoPorTipo,
    creadoPorId: t.creadoPorId,
    fechaCreacion:
      t.fechaCreacion instanceof Date
        ? t.fechaCreacion.toISOString()
        : String(t.fechaCreacion),
    fechaActualizacion:
      t.fechaActualizacion instanceof Date
        ? t.fechaActualizacion.toISOString()
        : String(t.fechaActualizacion),
    fechaCierre: t.fechaCierre
      ? t.fechaCierre instanceof Date
        ? t.fechaCierre.toISOString()
        : String(t.fechaCierre)
      : null,
    version: t.version,
    accionesDisponibles: (t.accionesDisponibles ?? []).map(String),
    slaVencido: t.slaVencido ?? false,
  });
}

export function mapMovimientoToResponse(
  m: MovimientoTramiteProps,
): MovimientoResponse {
  return new MovimientoResponse({
    id: m.id,
    tramiteId: m.tramiteId,
    estadoAnterior: m.estadoAnterior,
    estadoNuevo: m.estadoNuevo,
    areaAnteriorId: m.areaAnteriorId,
    areaNuevaId: m.areaNuevaId,
    usuarioTipo: m.usuarioTipo,
    usuarioId: m.usuarioId,
    accion: m.accion,
    comentario: m.comentario,
    fecha: m.fecha instanceof Date ? m.fecha.toISOString() : String(m.fecha),
  });
}

export function mapComentarioToResponse(
  c: ComentarioTramiteProps,
): ComentarioResponse {
  return new ComentarioResponse({
    id: c.id,
    tramiteId: c.tramiteId,
    mensaje: c.mensaje,
    visibilidad: c.visibilidad,
    autorTipo: c.autorTipo,
    autorId: c.autorId,
    autorNombre: c.autorNombre ?? null,
    fecha: c.fecha instanceof Date ? c.fecha.toISOString() : String(c.fecha),
  });
}

export function mapDocumentoToResponse(
  d: DocumentoTramiteProps,
): DocumentoResponse {
  return new DocumentoResponse({
    id: d.id,
    tramiteId: d.tramiteId,
    nombreArchivo: d.nombreArchivo,
    mimeType: d.mimeType,
    size: d.size,
    storageKey: d.storageKey,
    subidoPorTipo: d.subidoPorTipo,
    subidoPorId: d.subidoPorId,
    fechaCarga:
      d.fechaCarga instanceof Date
        ? d.fechaCarga.toISOString()
        : String(d.fechaCarga),
  });
}
