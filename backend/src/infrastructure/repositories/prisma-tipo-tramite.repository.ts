import { Injectable } from '@nestjs/common';
import type { ITipoTramiteRepository } from '@application/ports/tipo-tramite.repository.port';
import { TipoTramite } from '@domain/entities';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaTipoTramiteRepository implements ITipoTramiteRepository {
  constructor(private readonly prisma: PrismaService) {}
  async findById(id: string) {
    const d = await this.prisma.tipoTramite.findUnique({ where: { id } });
    return d ? TipoTramite.create(d as unknown as TipoTramiteProps) : null;
  }
  async findAll() {
    return (await this.prisma.tipoTramite.findMany()).map((d) =>
      TipoTramite.create(d as unknown as TipoTramiteProps),
    );
  }
  async create(t: TipoTramite) {
    const d = await this.prisma.tipoTramite.create({
      data: {
        id: t.id,
        codigo: t.codigo,
        nombre: t.nombre,
        descripcion: t.descripcion,
        activo: t.activo,
        requiereExterno: t.requiereExterno,
        permiteInicioExterno: t.permiteInicioExterno,
        slaHoras: t.slaHoras,
        areaInicialId: t.areaInicialId,
      },
    });
    return TipoTramite.create(d as unknown as TipoTramiteProps);
  }
  async update(t: TipoTramite) {
    const d = await this.prisma.tipoTramite.update({
      where: { id: t.id },
      data: {
        codigo: t.codigo,
        nombre: t.nombre,
        descripcion: t.descripcion,
        activo: t.activo,
        requiereExterno: t.requiereExterno,
        permiteInicioExterno: t.permiteInicioExterno,
        slaHoras: t.slaHoras,
        areaInicialId: t.areaInicialId,
      },
    });
    return TipoTramite.create(d as unknown as TipoTramiteProps);
  }
}
