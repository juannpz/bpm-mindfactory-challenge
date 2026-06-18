import { Injectable, Inject } from '@nestjs/common';
import { DocumentoTramite } from '@domain/entities';
import { TipoUsuario } from '@domain/enums';
import { v4 as uuid } from 'uuid';
import { mapDocumentoToResponse, DocumentoResponse } from '../dtos/responses';
import { DOCUMENTO_REPOSITORY, FILE_STORAGE } from '../ports/tokens';
import type { IDocumentoRepository } from '../ports/documento.repository.port';
import type { IFileStorage } from '../ports/file-storage.port';

@Injectable()
export class DocumentoUseCases {
  constructor(
    @Inject(DOCUMENTO_REPOSITORY)
    private readonly docRepo: IDocumentoRepository,
    @Inject(FILE_STORAGE) private readonly fileStorage: IFileStorage,
  ) {}

  async subir(
    tramiteId: string,
    file: {
      originalname: string;
      buffer: Buffer;
      mimetype: string;
      size: number;
    },
    subidoPorTipo: string,
    subidoPorId: string,
  ): Promise<DocumentoResponse> {
    const storageKey = await this.fileStorage.save(
      file.originalname,
      file.buffer,
      file.mimetype,
    );
    const doc = DocumentoTramite.create({
      id: uuid(),
      tramiteId,
      nombreArchivo: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      storageKey,
      subidoPorTipo: subidoPorTipo as TipoUsuario,
      subidoPorId,
      fechaCarga: new Date(),
    });
    const created = await this.docRepo.create(doc);
    return mapDocumentoToResponse(created);
  }

  async listar(
    tramiteId: string,
    usuarioTipo?: string,
    usuarioId?: string,
  ): Promise<DocumentoResponse[]> {
    const docs = await this.docRepo.findByTramiteId(tramiteId);
    // Filtrar por visibilidad: externos solo ven sus propios documentos
    const filtered = docs.filter((doc) => {
      if (usuarioTipo === 'EXTERNO') {
        return doc.subidoPorTipo === 'EXTERNO' && doc.subidoPorId === usuarioId;
      }
      return true; // INTERNO ve todos
    });
    return filtered.map(mapDocumentoToResponse);
  }

  async obtener(documentoId: string): Promise<DocumentoResponse | null> {
    const doc = await this.docRepo.findById(documentoId);
    return doc ? mapDocumentoToResponse(doc) : null;
  }

  async eliminar(documentoId: string): Promise<void> {
    const doc = await this.docRepo.findById(documentoId);
    if (doc) {
      await this.fileStorage.delete(doc.storageKey);
      await this.docRepo.delete(documentoId);
    }
  }
}
