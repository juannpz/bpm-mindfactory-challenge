import { Tramite } from '@domain/aggregates';

export interface ListarTramitesFilters {
  estado?: string;
  origen?: string;
  areaId?: string;
  prioridad?: string;
  fechaDesde?: Date;
  fechaHasta?: Date;
  search?: string;
  page?: number;
  limit?: number;
  /** Filtro por usuario: solo trámites donde participa el usuario externo */
  usuarioExternoId?: string;
  /** Filtro por creador: solo trámites creados por este usuario externo */
  creadoPorExternoId?: string;
  /** Filtro por área asignada (para operadores) */
  areaOperadorId?: string;
  /** Rol del usuario actual */
  rolUsuario?: string;
}

export interface ITramiteRepository {
  findById(id: string): Promise<Tramite | null>;
  findAll(
    filters: ListarTramitesFilters,
  ): Promise<{ data: Tramite[]; total: number }>;
  create(tramite: Tramite): Promise<Tramite>;
  update(tramite: Tramite): Promise<Tramite>;
  delete(id: string): Promise<void>;
}
