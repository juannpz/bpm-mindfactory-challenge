import { Injectable, Inject } from '@nestjs/common';
import { Tramite } from '@domain/aggregates';
import { TipoUsuario } from '@domain/enums';
import { SlaService } from '@domain/services';
import { v4 as uuid } from 'uuid';
import type {
  ITramiteRepository,
  ListarTramitesFilters,
} from '../ports/tramite.repository.port';
import type { ITipoTramiteRepository } from '../ports/tipo-tramite.repository.port';
import type { IMovimientoRepository } from '../ports/movimiento.repository.port';
import {
  TRAMITE_REPOSITORY,
  TIPO_TRAMITE_REPOSITORY,
  MOVIMIENTO_REPOSITORY,
} from '../ports/tokens';
import { CrearTramiteDto, ActualizarTramiteDto } from '../dtos';
import {
  mapTramiteToResponse,
  type TramiteResponse,
  type TramiteListResponse,
} from '../dtos/responses';

@Injectable()
export class TramiteUseCases {
  constructor(
    @Inject(TRAMITE_REPOSITORY)
    private readonly tramiteRepo: ITramiteRepository,
    @Inject(TIPO_TRAMITE_REPOSITORY)
    private readonly tipoTramiteRepo: ITipoTramiteRepository,
    @Inject(MOVIMIENTO_REPOSITORY)
    private readonly movimientoRepo: IMovimientoRepository,
  ) {}

  async crear(
    dto: CrearTramiteDto,
    creadorTipo: string,
    creadorId: string,
  ): Promise<TramiteResponse> {
    // Validar tipo de trámite
    const tipo = await this.tipoTramiteRepo.findById(dto.tipoTramiteId);
    if (!tipo || !tipo.activo) {
      throw new Error('Tipo de trámite no encontrado o inactivo');
    }

    // Regla: solo tipos que permitan inicio externo pueden ser creados por externos
    if (dto.origen === 'EXTERNO_INTERNO' && !tipo.permiteInicioExterno) {
      throw new Error('Este tipo de trámite no permite inicio externo');
    }

    // Regla: trámites INTERNO_EXTERNO requieren usuario externo vinculado
    if (dto.origen === 'INTERNO_EXTERNO' && !dto.usuarioExternoId) {
      throw new Error(
        'Los trámites Interno → Externo requieren un usuario externo vinculado',
      );
    }

    const { tramite, movimiento } = Tramite.create({
      id: uuid(),
      tipoTramiteId: dto.tipoTramiteId,
      titulo: dto.titulo,
      descripcion: dto.descripcion,
      origen: dto.origen,
      prioridad: dto.prioridad,
      areaActualId: dto.areaDestinoId ?? null,
      usuarioExternoId: dto.usuarioExternoId ?? null,
      creadoPorTipo: creadorTipo as TipoUsuario,
      creadoPorId: creadorId,
      anio: new Date().getFullYear(),
      secuencial: Math.floor(Math.random() * 99999),
      usuarioAsignadoId: null,
    });
    await this.tramiteRepo.create(tramite);
    await this.movimientoRepo.create(movimiento);
    return this.toResponse(tramite);
  }

  async obtener(
    id: string,
    user?: { id: string; tipo: string; rol?: string; areaId?: string },
  ): Promise<TramiteResponse | null> {
    const t = await this.tramiteRepo.findById(id);
    if (!t) return null;

    // Authorization check
    if (user) {
      if (user.tipo === 'EXTERNO') {
        // Externo solo ve tramites donde participa
        const isParticipant =
          t.usuarioExternoId === user.id ||
          (t.creadoPorTipo === 'EXTERNO' && t.creadoPorId === user.id);
        if (!isParticipant) {
          throw new Error('No tiene permiso para ver este trámite');
        }
      } else if (user.rol && !['ADMIN', 'AUDITOR'].includes(user.rol)) {
        // Operador/supervisor solo ve tramites de su area
        if (user.areaId && t.areaActualId && t.areaActualId !== user.areaId) {
          throw new Error('No tiene permiso para ver trámites de otra área');
        }
      }
    }

    return this.toResponse(t);
  }

  async listar(filters: ListarTramitesFilters): Promise<TramiteListResponse> {
    const result = await this.tramiteRepo.findAll(filters);
    const responses = await Promise.all(
      result.data.map((t) => this.toResponse(t)),
    );
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    return {
      data: responses,
      meta: {
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit),
      },
    };
  }

  async actualizar(
    id: string,
    dto: ActualizarTramiteDto,
  ): Promise<TramiteResponse | null> {
    const t = await this.tramiteRepo.findById(id);
    if (!t || t.estado !== 'BORRADOR')
      throw new Error('Solo trámites en BORRADOR pueden editarse');
    const saved = await this.tramiteRepo.update(
      Tramite.fromProps({ ...t, ...dto }),
    );
    return this.toResponse(saved);
  }

  async eliminar(id: string): Promise<void> {
    const t = await this.tramiteRepo.findById(id);
    if (!t || t.estado !== 'BORRADOR')
      throw new Error('Solo trámites en BORRADOR pueden eliminarse');
    await this.tramiteRepo.delete(id);
  }

  async toResponse(tramite: Tramite): Promise<TramiteResponse> {
    let slaVencido = false;
    if (tramite.tipoTramiteId) {
      const tipo = await this.tipoTramiteRepo.findById(tramite.tipoTramiteId);
      if (tipo)
        slaVencido = SlaService.estaVencido(
          tramite.fechaCreacion,
          tipo.slaHoras,
        );
    }
    return mapTramiteToResponse({
      ...tramite,
      accionesDisponibles: tramite.accionesDisponibles(),
      slaVencido,
    });
  }
}
