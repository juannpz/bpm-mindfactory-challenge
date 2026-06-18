export type TipoUsuarioAuth = "INTERNO" | "EXTERNO";

export interface AuthUser {
  id: string;
  nombre: string;
  email: string;
  tipo: TipoUsuarioAuth;
  rol?: string;
  areaId?: string;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface ApiResponse<T> {
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: string[];
}

export interface TramiteListItem {
  id: string;
  numero: string;
  tipoTramiteId: string;
  tipoTramiteNombre?: string;
  titulo: string;
  origen: string;
  estado: string;
  prioridad: string;
  areaActualId: string;
  areaActualNombre?: string;
  usuarioAsignadoNombre?: string;
  usuarioExternoNombre?: string;
  fechaCreacion: string;
  fechaActualizacion: string;
  slaVencido?: boolean;
}

export interface TramiteDetail {
  id: string;
  numero: string;
  tipoTramiteId: string;
  tipoTramiteNombre?: string;
  tipoTramiteSlaHoras?: number;
  titulo: string;
  descripcion: string;
  origen: string;
  estado: string;
  prioridad: string;
  areaActualId: string;
  areaActualNombre?: string;
  usuarioAsignadoId?: string;
  usuarioAsignadoNombre?: string;
  usuarioExternoId?: string;
  usuarioExternoNombre?: string;
  creadoPorTipo: string;
  creadoPorId: string;
  fechaCreacion: string;
  fechaActualizacion: string;
  fechaCierre?: string;
  version: number;
  accionesDisponibles?: string[];
  slaVencido?: boolean;
}

export interface Movimiento {
  id: string;
  tramiteId: string;
  estadoAnterior: string | null;
  estadoNuevo: string;
  areaAnteriorId: string | null;
  areaNuevaId: string | null;
  usuarioTipo: string;
  accion: string;
  comentario: string | null;
  fecha: string;
}

export interface Comentario {
  id: string;
  tramiteId: string;
  mensaje: string;
  visibilidad: string;
  autorTipo: string;
  autorId: string;
  autorNombre?: string | null;
  fecha: string;
}

export interface Documento {
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

export interface DashboardData {
  tramitesPorEstado: Record<string, number>;
  tramitesPorOrigen: Record<string, number>;
  tramitesVencidos: number;
  promedioResolucionHoras: number;
  cantidadPorArea: Record<string, number>;
  ultimosMovimientos: Movimiento[];
}

export interface TipoTramite {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  activo: boolean;
  requiereExterno: boolean;
  permiteInicioExterno: boolean;
  slaHoras: number;
  areaInicialId: string;
}

export interface Area {
  id: string;
  nombre: string;
  codigo: string;
  activa: boolean;
}

export interface TramiteFilters {
  estado?: string;
  area?: string;
  prioridad?: string;
  origen?: string;
  search?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  page?: number;
  limit?: number;
}
