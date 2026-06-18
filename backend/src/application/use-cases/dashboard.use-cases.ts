import { Injectable, Inject } from '@nestjs/common';
import { SlaService } from '@domain/services';
import { MovimientoTramite } from '@domain/entities';
import { DashboardResponse, MovimientoResponse } from '../dtos/responses';
import {
  TRAMITE_REPOSITORY,
  TIPO_TRAMITE_REPOSITORY,
  MOVIMIENTO_REPOSITORY,
} from '../ports/tokens';
import type { ITramiteRepository } from '../ports/tramite.repository.port';
import type { ITipoTramiteRepository } from '../ports/tipo-tramite.repository.port';
import type { IMovimientoRepository } from '../ports/movimiento.repository.port';
import { mapMovimientoToResponse } from '../dtos/responses';

@Injectable()
export class DashboardUseCases {
  constructor(
    @Inject(TRAMITE_REPOSITORY)
    private readonly tramiteRepo: ITramiteRepository,
    @Inject(TIPO_TRAMITE_REPOSITORY)
    private readonly tipoTramiteRepo: ITipoTramiteRepository,
    @Inject(MOVIMIENTO_REPOSITORY)
    private readonly movimientoRepo: IMovimientoRepository,
  ) {}

  async obtener(): Promise<DashboardResponse> {
    const { data: tramites } = await this.tramiteRepo.findAll({ limit: 1000 });
    const tipos = await this.tipoTramiteRepo.findAll();
    const tipoMap = new Map(tipos.map((t) => [t.id, t]));

    const tramitesPorEstado: Record<string, number> = {};
    const tramitesPorOrigen: Record<string, number> = {};
    let tramitesVencidos = 0;
    let totalResolucionHoras = 0;
    let tramitesResueltos = 0;
    const cantidadPorArea: Record<string, number> = {};

    for (const t of tramites) {
      tramitesPorEstado[t.estado] = (tramitesPorEstado[t.estado] ?? 0) + 1;
      tramitesPorOrigen[t.origen] = (tramitesPorOrigen[t.origen] ?? 0) + 1;
      if (t.areaActualId)
        cantidadPorArea[t.areaActualId] =
          (cantidadPorArea[t.areaActualId] ?? 0) + 1;

      const tipo = tipoMap.get(t.tipoTramiteId);
      if (tipo && SlaService.estaVencido(t.fechaCreacion, tipo.slaHoras))
        tramitesVencidos++;

      if (t.fechaCierre) {
        const duracionMs = t.fechaCierre.getTime() - t.fechaCreacion.getTime();
        totalResolucionHoras += duracionMs / (1000 * 60 * 60);
        tramitesResueltos++;
      }
    }

    const promedioResolucionHoras =
      tramitesResueltos > 0
        ? Math.round((totalResolucionHoras / tramitesResueltos) * 100) / 100
        : 0;

    // Obtener los ultimos 10 movimientos de todos los tramites visibles
    let ultimosMovimientos: MovimientoResponse[] = [];
    if (tramites.length > 0) {
      const allMovs = (
        await Promise.all(
          tramites.map((t) =>
            this.movimientoRepo
              .findByTramiteId(t.id)
              .catch(() => [] as MovimientoTramite[]),
          ),
        )
      ).flat();
      ultimosMovimientos = allMovs
        .sort(
          (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
        )
        .slice(0, 10)
        .map(mapMovimientoToResponse);
    }

    return {
      tramitesPorEstado,
      tramitesPorOrigen,
      tramitesVencidos,
      promedioResolucionHoras,
      cantidadPorArea,
      ultimosMovimientos,
    };
  }
}
