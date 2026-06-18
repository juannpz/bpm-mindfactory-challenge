import { ComentarioTramite } from '@domain/entities';

export interface IComentarioRepository {
  create(comentario: ComentarioTramite): Promise<ComentarioTramite>;
  findByTramiteId(tramiteId: string): Promise<ComentarioTramite[]>;
}
