import { Injectable } from '@nestjs/common';
import type { IComentarioRepository } from '@application/ports/comentario.repository.port';
import { ComentarioTramite } from '@domain/entities';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaComentarioRepository implements IComentarioRepository {
  constructor(private readonly prisma: PrismaService) {}
  async create(c: ComentarioTramite): Promise<ComentarioTramite> {
    const d = await this.prisma.comentarioTramite.create({
      data: {
        id: c.id,
        tramiteId: c.tramiteId,
        mensaje: c.mensaje,
        visibilidad: c.visibilidad,
        autorTipo: c.autorTipo,
        autorId: c.autorId,
        fecha: c.fecha,
      },
    });
    return ComentarioTramite.create(d as unknown as ComentarioTramiteProps);
  }

  async findByTramiteId(tid: string): Promise<ComentarioTramite[]> {
    const comentarios = await this.prisma.comentarioTramite.findMany({
      where: { tramiteId: tid },
      orderBy: { fecha: 'asc' },
    });

    const internosIds = comentarios
      .filter((c) => c.autorTipo === 'INTERNO' && c.autorId)
      .map((c) => c.autorId!);
    const externosIds = comentarios
      .filter((c) => c.autorTipo === 'EXTERNO' && c.autorId)
      .map((c) => c.autorId!);

    const [internos, externos]: [
      { id: string; nombre: string }[],
      { id: string; nombre: string }[],
    ] = await Promise.all([
      internosIds.length > 0
        ? this.prisma.usuarioInterno.findMany({
            where: { id: { in: internosIds } },
            select: { id: true, nombre: true },
          })
        : ([] as { id: string; nombre: string }[]),
      externosIds.length > 0
        ? this.prisma.usuarioExterno.findMany({
            where: { id: { in: externosIds } },
            select: { id: true, nombre: true },
          })
        : ([] as { id: string; nombre: string }[]),
    ]);

    const nombreMap = new Map<string, string>();
    internos.forEach((u) => nombreMap.set(u.id, u.nombre));
    externos.forEach((u) => nombreMap.set(u.id, u.nombre));

    return comentarios.map((c) =>
      ComentarioTramite.create({
        ...c,
        autorNombre: (c.autorId && nombreMap.get(c.autorId)) || null,
      } as unknown as ComentarioTramiteProps),
    );
  }
}
