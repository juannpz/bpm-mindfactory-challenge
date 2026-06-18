import { Injectable } from '@nestjs/common';
import type { IAreaRepository } from '@application/ports/area.repository.port';
import { Area } from '@domain/entities';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaAreaRepository implements IAreaRepository {
  constructor(private readonly prisma: PrismaService) {}
  async findById(id: string) {
    const d = await this.prisma.area.findUnique({ where: { id } });
    return d ? Area.create(d) : null;
  }
  async findAll() {
    return (await this.prisma.area.findMany()).map((d) => Area.create(d));
  }
  async create(a: Area) {
    const d = await this.prisma.area.create({
      data: {
        id: a.id,
        nombre: a.nombre,
        codigo: a.codigo,
        activa: a.activa,
      },
    });
    return Area.create(d);
  }
  async update(a: Area) {
    const d = await this.prisma.area.update({
      where: { id: a.id },
      data: {
        nombre: a.nombre,
        codigo: a.codigo,
        activa: a.activa,
      },
    });
    return Area.create(d);
  }
}
