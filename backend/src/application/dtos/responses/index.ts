import { TramiteProps } from '@domain/aggregates/tramite.aggregate';
import { MovimientoTramiteProps } from '@domain/entities/movimiento-tramite.entity';
import { ComentarioTramiteProps } from '@domain/entities/comentario-tramite.entity';
import { DocumentoTramiteProps } from '@domain/entities/documento-tramite.entity';
import { AccionMovimiento } from '@domain/enums';

export interface TramiteResponse {
  id: string;
  numero: string;
  tipoTramiteId: string | null;
  tipoTramiteNombre?: string | null;
  titulo: string;
  descripcion: string;
  origen: string;
  estado: string;
  prioridad: string;
  areaActualId: string | null;
  areaActualNombre?: string | null;
  usuarioAsignadoId: string | null;
  usuarioAsignadoNombre?: string | null;
  usuarioExternoId: string | null;
  usuarioExternoNombre?: string | null;
  creadoPorTipo: string;
  creadoPorId: string;
  fechaCreacion: string;
  fechaActualizacion: string;
  fechaCierre: string | null;
  version: number;
  accionesDisponibles: string[];
  slaVencido: boolean;
}

export interface TramiteListResponse {
  data: TramiteResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface MovimientoResponse {
  id: string;
  tramiteId: string;
  estadoAnterior: string | null;
  estadoNuevo: string;
  areaAnteriorId: string | null;
  areaNuevaId: string | null;
  usuarioTipo: string;
  usuarioId: string;
  accion: string;
  comentario: string | null;
  fecha: string;
}

export interface ComentarioResponse {
  id: string;
  tramiteId: string;
  mensaje: string;
  visibilidad: string;
  autorTipo: string;
  autorId: string;
  autorNombre?: string | null;
  fecha: string;
}

export interface DocumentoResponse {
  id: string;
  tramiteId: string;
  nombreArchivo: string;
  mimeType: string;
  size: number;
  storageKey: string;
  subidoPorTipo: string;
  subidoPorId: string;
  fechaCarga: string;
}

export interface DashboardResponse {
  tramitesPorEstado: Record<string, number>;
  tramitesPorOrigen: Record<string, number>;
  tramitesVencidos: number;
  promedioResolucionHoras: number;
  cantidadPorArea: Record<string, number>;
  ultimosMovimientos: MovimientoResponse[];
}

export interface AuthResponse {
  token: string;
  usuario: {
    id: string;
    nombre: string;
    email: string;
    tipo: string;
    rol?: string;
    areaId?: string;
  };
}

export function mapTramiteToResponse(
  t: TramiteProps & {
    accionesDisponibles?: AccionMovimiento[];
    slaVencido?: boolean;
  },
): TramiteResponse {
  return {
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
  };
}

export function mapMovimientoToResponse(
  m: MovimientoTramiteProps,
): MovimientoResponse {
  return {
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
  };
}

export function mapComentarioToResponse(
  c: ComentarioTramiteProps,
): ComentarioResponse {
  return {
    id: c.id,
    tramiteId: c.tramiteId,
    mensaje: c.mensaje,
    visibilidad: c.visibilidad,
    autorTipo: c.autorTipo,
    autorId: c.autorId,
    autorNombre: c.autorNombre ?? null,
    fecha: c.fecha instanceof Date ? c.fecha.toISOString() : String(c.fecha),
  };
}

export function mapDocumentoToResponse(
  d: DocumentoTramiteProps,
): DocumentoResponse {
  return {
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
  };
}
