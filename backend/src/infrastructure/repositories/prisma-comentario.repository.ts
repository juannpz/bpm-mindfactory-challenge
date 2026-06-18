import { Injectable } from '@nestjs/common';
import type { IComentarioRepository } from '@application/ports/comentario.repository.port';
import { ComentarioTramite } from '@domain/entities';
import type { ComentarioTramiteProps } from '@domain/entities/comentario-tramite.entity';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaComentarioRepository implements IComentarioRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(d: ComentarioTramiteProps): ComentarioTramite {
    return ComentarioTramite.create(d);
  }

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
    return this.toDomain(d as ComentarioTramiteProps);
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

    const [internos, externos] = await Promise.all([
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
      this.toDomain({
        id: c.id,
        tramiteId: c.tramiteId,
        mensaje: c.mensaje,
        visibilidad: c.visibilidad,
        autorTipo: c.autorTipo,
        autorId: c.autorId,
        autorNombre: (c.autorId && nombreMap.get(c.autorId)) || null,
        fecha: c.fecha,
      } as ComentarioTramiteProps),
    );
  }
}
