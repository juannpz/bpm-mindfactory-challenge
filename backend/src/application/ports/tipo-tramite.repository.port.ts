import { TipoTramite } from '@domain/entities';

export interface ITipoTramiteRepository {
  findById(id: string): Promise<TipoTramite | null>;
  findAll(): Promise<TipoTramite[]>;
  create(tipo: TipoTramite): Promise<TipoTramite>;
  update(tipo: TipoTramite): Promise<TipoTramite>;
}
