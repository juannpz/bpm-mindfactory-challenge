import { DocumentoTramite } from '@domain/entities';

export interface IDocumentoRepository {
  create(documento: DocumentoTramite): Promise<DocumentoTramite>;
  findByTramiteId(tramiteId: string): Promise<DocumentoTramite[]>;
  findById(id: string): Promise<DocumentoTramite | null>;
  delete(id: string): Promise<void>;
}
