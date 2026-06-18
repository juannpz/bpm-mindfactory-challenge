import { MovimientoTramite } from '@domain/entities';

export interface IMovimientoRepository {
  create(movimiento: MovimientoTramite): Promise<MovimientoTramite>;
  findByTramiteId(tramiteId: string): Promise<MovimientoTramite[]>;
}
