import { Injectable } from '@nestjs/common';
import type { IUsuarioExternoRepository } from '@application/ports/usuario-externo.repository.port';
import { UsuarioExterno } from '@domain/entities';
import type { UsuarioExternoProps } from '@domain/entities/usuario-externo.entity';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaUsuarioExternoRepository implements IUsuarioExternoRepository {
  constructor(private readonly prisma: PrismaService) {}
  async findById(id: string) {
    const d = await this.prisma.usuarioExterno.findUnique({ where: { id } });
    return d
      ? UsuarioExterno.create(d as unknown as UsuarioExternoProps)
      : null;
  }
  async findByEmail(email: string) {
    const d = await this.prisma.usuarioExterno.findUnique({
      where: { email: email.toLowerCase() },
    });
    return d
      ? UsuarioExterno.create(d as unknown as UsuarioExternoProps)
      : null;
  }
  async findAll(): Promise<UsuarioExterno[]> {
    const data = await this.prisma.usuarioExterno.findMany({
      where: { estado: 'ACTIVO' },
      orderBy: { nombre: 'asc' },
    });
    return data.map((d) =>
      UsuarioExterno.create(d as unknown as UsuarioExternoProps),
    );
  }
  async create(u: UsuarioExterno & { passwordHash: string }) {
    const d = await this.prisma.usuarioExterno.create({
      data: {
        id: u.id,
        nombre: u.nombre,
        email: u.email,
        passwordHash: u.passwordHash,
        documento: u.documento,
        organizacion: u.organizacion,
        estado: u.estado,
        fechaAlta: u.fechaAlta,
      },
    });
    return UsuarioExterno.create(d as unknown as UsuarioExternoProps);
  }
}
