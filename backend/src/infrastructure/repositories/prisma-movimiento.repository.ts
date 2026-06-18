import { Injectable } from '@nestjs/common';
import type { IMovimientoRepository } from '@application/ports/movimiento.repository.port';
import { MovimientoTramite } from '@domain/entities';
import type { MovimientoTramiteProps } from '@domain/entities/movimiento-tramite.entity';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaMovimientoRepository implements IMovimientoRepository {
  constructor(private readonly prisma: PrismaService) {}
  async create(m: MovimientoTramite): Promise<MovimientoTramite> {
    const d = await this.prisma.movimientoTramite.create({
      data: {
        id: m.id,
        tramiteId: m.tramiteId,
        estadoAnterior: m.estadoAnterior,
        estadoNuevo: m.estadoNuevo,
        areaAnteriorId: m.areaAnteriorId,
        areaNuevaId: m.areaNuevaId,
        usuarioTipo: m.usuarioTipo,
        usuarioId: m.usuarioId,
        accion: m.accion,
        comentario: m.comentario,
        fecha: m.fecha,
      },
    });
    return MovimientoTramite.create(d as unknown as MovimientoTramiteProps);
  }
  async findByTramiteId(tramiteId: string): Promise<MovimientoTramite[]> {
    const data = await this.prisma.movimientoTramite.findMany({
      where: { tramiteId },
      orderBy: { fecha: 'asc' },
    });
    return data.map((d) =>
      MovimientoTramite.create(d as unknown as MovimientoTramiteProps),
    );
  }
}
