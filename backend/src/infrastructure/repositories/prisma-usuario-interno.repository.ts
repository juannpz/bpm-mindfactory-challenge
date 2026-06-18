import { Injectable } from '@nestjs/common';
import type { IUsuarioInternoRepository } from '@application/ports/usuario-interno.repository.port';
import { UsuarioInterno } from '@domain/entities';
import { RolInterno } from '@domain/enums';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaUsuarioInternoRepository implements IUsuarioInternoRepository {
  constructor(private readonly prisma: PrismaService) {}
  async findById(id: string) {
    const d = await this.prisma.usuarioInterno.findUnique({ where: { id } });
    return d
      ? UsuarioInterno.create({
          ...d,
          areaId: d.areaId ?? '',
          rol: d.rol as RolInterno,
        })
      : null;
  }
  async findByAzureObjectId(oid: string) {
    const d = await this.prisma.usuarioInterno.findUnique({
      where: { azureObjectId: oid },
    });
    return d
      ? UsuarioInterno.create({
          ...d,
          areaId: d.areaId ?? '',
          rol: d.rol as RolInterno,
        })
      : null;
  }
  async findByAreaId(aid: string) {
    return (
      await this.prisma.usuarioInterno.findMany({ where: { areaId: aid } })
    ).map((d) =>
      UsuarioInterno.create({
        ...d,
        areaId: d.areaId ?? '',
        rol: d.rol as RolInterno,
      }),
    );
  }
}
