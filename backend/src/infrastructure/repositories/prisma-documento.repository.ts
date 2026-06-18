import { Injectable } from '@nestjs/common';
import type { IDocumentoRepository } from '@application/ports/documento.repository.port';
import { DocumentoTramite } from '@domain/entities';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaDocumentoRepository implements IDocumentoRepository {
  constructor(private readonly prisma: PrismaService) {}
  async create(doc: DocumentoTramite): Promise<DocumentoTramite> {
    const d = await this.prisma.documentoTramite.create({
      data: {
        id: doc.id,
        tramiteId: doc.tramiteId,
        nombreArchivo: doc.nombreArchivo,
        mimeType: doc.mimeType,
        size: doc.size,
        storageKey: doc.storageKey,
        subidoPorTipo: doc.subidoPorTipo,
        subidoPorId: doc.subidoPorId,
        fechaCarga: doc.fechaCarga,
      },
    });
    return DocumentoTramite.create(d as unknown as DocumentoTramiteProps);
  }
  async findByTramiteId(tid: string): Promise<DocumentoTramite[]> {
    return (
      await this.prisma.documentoTramite.findMany({
        where: { tramiteId: tid },
        orderBy: { fechaCarga: 'desc' },
      })
    ).map((d) =>
      DocumentoTramite.create(d as unknown as DocumentoTramiteProps),
    );
  }
  async findById(id: string): Promise<DocumentoTramite | null> {
    const d = await this.prisma.documentoTramite.findUnique({ where: { id } });
    return d
      ? DocumentoTramite.create(d as unknown as DocumentoTramiteProps)
      : null;
  }
  async delete(id: string): Promise<void> {
    await this.prisma.documentoTramite.delete({ where: { id } });
  }
}
