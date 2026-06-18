import { Injectable } from '@nestjs/common';
import type {
  ITramiteRepository,
  ListarTramitesFilters,
} from '@application/ports/tramite.repository.port';
import { Tramite } from '@domain/aggregates';
import type { TramiteProps } from '@domain/aggregates/tramite.aggregate';
import {
  OrigenTramite,
  EstadoTramite,
  Prioridad,
  TipoUsuario,
} from '@domain/enums';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client.js';

const TRAMITE_INCLUDE = {
  tipoTramite: true,
  areaActual: true,
  usuarioAsignado: true,
  usuarioExterno: true,
} as const;

type PrismaTramiteWithIncludes = {
  id: string;
  numero: string;
  tipoTramiteId: string | null;
  titulo: string;
  descripcion: string;
  origen: string;
  estado: string;
  prioridad: string;
  areaActualId: string | null;
  usuarioAsignadoId: string | null;
  usuarioExternoId: string | null;
  creadoPorTipo: string;
  creadoPorInternoId: string | null;
  creadoPorExternoId: string | null;
  fechaCreacion: Date;
  fechaActualizacion: Date;
  fechaCierre: Date | null;
  version: number;
  tipoTramite: { nombre: string } | null;
  areaActual: { nombre: string } | null;
  usuarioAsignado: { nombre: string } | null;
  usuarioExterno: { nombre: string } | null;
};

function propsFromPrisma(data: PrismaTramiteWithIncludes): TramiteProps {
  return {
    id: data.id,
    numero: data.numero,
    tipoTramiteId: data.tipoTramiteId ?? '',
    tipoTramiteNombre: data.tipoTramite?.nombre ?? null,
    titulo: data.titulo,
    descripcion: data.descripcion,
    origen: data.origen as OrigenTramite,
    estado: data.estado as EstadoTramite,
    prioridad: data.prioridad as Prioridad,
    areaActualId: data.areaActualId,
    areaActualNombre: data.areaActual?.nombre ?? null,
    usuarioAsignadoId: data.usuarioAsignadoId,
    usuarioAsignadoNombre: data.usuarioAsignado?.nombre ?? null,
    usuarioExternoId: data.usuarioExternoId,
    usuarioExternoNombre: data.usuarioExterno?.nombre ?? null,
    creadoPorTipo: data.creadoPorTipo as TipoUsuario,
    creadoPorId: data.creadoPorInternoId ?? data.creadoPorExternoId ?? '',
    fechaCreacion: data.fechaCreacion,
    fechaActualizacion: data.fechaActualizacion,
    fechaCierre: data.fechaCierre,
    version: data.version,
  };
}

@Injectable()
export class PrismaTramiteRepository implements ITramiteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Tramite | null> {
    const data = await this.prisma.tramite.findUnique({
      where: { id },
      include: TRAMITE_INCLUDE,
    });
    if (!data) return null;
    return Tramite.fromProps(propsFromPrisma(data));
  }

  async findAll(
    filters: ListarTramitesFilters,
  ): Promise<{ data: Tramite[]; total: number }> {
    const where: Record<string, unknown> = {};
    if (filters.estado) where.estado = filters.estado;
    if (filters.origen) where.origen = filters.origen;
    if (filters.areaId) where.areaActualId = filters.areaId;
    if (filters.prioridad) where.prioridad = filters.prioridad;

    // Authorization: external users only see their own tramites
    const OR: Record<string, unknown>[] = [];
    if (filters.usuarioExternoId || filters.creadoPorExternoId) {
      if (filters.usuarioExternoId) {
        OR.push({ usuarioExternoId: filters.usuarioExternoId });
      }
      if (filters.creadoPorExternoId) {
        OR.push({ creadoPorExternoId: filters.creadoPorExternoId });
      }
    }

    // Authorization: operadores/supervisores only see their area's tramites (unless admin/auditor)
    if (
      filters.areaOperadorId &&
      filters.rolUsuario &&
      !['ADMIN', 'AUDITOR'].includes(filters.rolUsuario)
    ) {
      OR.push({ areaActualId: filters.areaOperadorId });
    }

    if (OR.length > 0) {
      if (where.OR && Array.isArray(where.OR)) {
        // Combine con AND: (search conditions) AND (user filters)
        where.AND = [{ OR: where.OR }, { OR: OR }];
        delete where.OR;
      } else {
        where.OR = OR;
      }
    }

    if (filters.search) {
      const searchOR = [
        { numero: { contains: filters.search, mode: 'insensitive' } },
        { titulo: { contains: filters.search, mode: 'insensitive' } },
      ];
      if (where.AND) {
        (where.AND as unknown[]).push({ OR: searchOR });
      } else if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchOR }];
        delete where.OR;
      } else {
        where.OR = searchOR;
      }
    }

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const [data, total] = await Promise.all([
      this.prisma.tramite.findMany({
        where: where as unknown as Prisma.TramiteWhereInput,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { fechaCreacion: 'desc' },
        include: TRAMITE_INCLUDE,
      }),
      this.prisma.tramite.count({
        where: where as unknown as Prisma.TramiteWhereInput,
      }),
    ]);

    return {
      data: data.map((d) =>
        Tramite.fromProps(propsFromPrisma(d as PrismaTramiteWithIncludes)),
      ),
      total,
    };
  }

  async create(tramite: Tramite): Promise<Tramite> {
    const created = await this.prisma.tramite.create({
      data: {
        id: tramite.id,
        numero: tramite.numero,
        tipoTramiteId: tramite.tipoTramiteId,
        titulo: tramite.titulo,
        descripcion: tramite.descripcion,
        origen: tramite.origen,
        estado: tramite.estado,
        prioridad: tramite.prioridad,
        areaActualId: tramite.areaActualId,
        usuarioExternoId: tramite.usuarioExternoId,
        creadoPorTipo: tramite.creadoPorTipo,
        creadoPorInternoId:
          tramite.creadoPorTipo === 'INTERNO' ? tramite.creadoPorId : null,
        creadoPorExternoId:
          tramite.creadoPorTipo === 'EXTERNO' ? tramite.creadoPorId : null,
        fechaCreacion: tramite.fechaCreacion,
        fechaActualizacion: tramite.fechaActualizacion,
        version: tramite.version,
      },
      include: TRAMITE_INCLUDE,
    });
    return Tramite.fromProps(propsFromPrisma(created));
  }

  async update(tramite: Tramite): Promise<Tramite> {
    const updated = await this.prisma.tramite.update({
      where: { id: tramite.id, version: tramite.version - 1 },
      data: {
        estado: tramite.estado,
        prioridad: tramite.prioridad,
        areaActualId: tramite.areaActualId,
        usuarioAsignadoId: tramite.usuarioAsignadoId,
        usuarioExternoId: tramite.usuarioExternoId,
        fechaActualizacion: tramite.fechaActualizacion,
        fechaCierre: tramite.fechaCierre,
        version: tramite.version,
      },
      include: TRAMITE_INCLUDE,
    });
    return Tramite.fromProps(propsFromPrisma(updated));
  }

  async delete(id: string): Promise<void> {
    await this.prisma.tramite.delete({ where: { id } });
  }
}
