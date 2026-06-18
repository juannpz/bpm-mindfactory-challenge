import { Injectable, Inject } from '@nestjs/common';
import { SlaService } from '@domain/services';
import { Tramite } from '@domain/aggregates';
import { MovimientoTramite } from '@domain/entities';
import {
  TRAMITE_REPOSITORY,
  MOVIMIENTO_REPOSITORY,
  TIPO_TRAMITE_REPOSITORY,
  UNIT_OF_WORK,
} from '../ports/tokens';
import type { ITramiteRepository } from '../ports/tramite.repository.port';
import type { IMovimientoRepository } from '../ports/movimiento.repository.port';
import type { ITipoTramiteRepository } from '../ports/tipo-tramite.repository.port';
import type { IUnitOfWork } from '../ports/unit-of-work.port';
import {
  AsignarTramiteDto,
  DerivarTramiteDto,
  ObservarTramiteDto,
  ResponderObservacionDto,
  SolicitarIntervencionExternaDto,
  ResponderIntervencionExternaDto,
  AprobarTramiteDto,
} from '../dtos';
import {
  mapTramiteToResponse,
  mapMovimientoToResponse,
  TramiteResponse,
  MovimientoResponse,
} from '../dtos/responses';

@Injectable()
export class WorkflowUseCases {
  constructor(
    @Inject(TRAMITE_REPOSITORY)
    private readonly tramiteRepo: ITramiteRepository,
    @Inject(MOVIMIENTO_REPOSITORY)
    private readonly movimientoRepo: IMovimientoRepository,
    @Inject(TIPO_TRAMITE_REPOSITORY)
    private readonly tipoTramiteRepo: ITipoTramiteRepository,
    @Inject(UNIT_OF_WORK) private readonly uow: IUnitOfWork,
  ) {}

  private async ejecutarTransicion(
    tramiteId: string,
    fn: (t: Tramite) => { tramite: Tramite; movimiento: MovimientoTramite },
  ): Promise<TramiteResponse> {
    return this.uow.runInTransaction(async () => {
      const t = await this.tramiteRepo.findById(tramiteId);
      if (!t) throw new Error('Trámite no encontrado');
      const { tramite: nuevo, movimiento } = fn(t);
      await this.tramiteRepo.update(nuevo);
      await this.movimientoRepo.create(movimiento);
      let slaVencido = false;
      if (nuevo.tipoTramiteId) {
        const tipo = await this.tipoTramiteRepo.findById(nuevo.tipoTramiteId);
        if (tipo)
          slaVencido = SlaService.estaVencido(
            nuevo.fechaCreacion,
            tipo.slaHoras,
          );
      }
      return mapTramiteToResponse({
        ...nuevo,
        accionesDisponibles: nuevo.accionesDisponibles(),
        slaVencido,
      });
    });
  }

  async ingresar(tramiteId: string, usuarioId: string, areaId: string) {
    return this.ejecutarTransicion(tramiteId, (t) =>
      t.ingresar(usuarioId, areaId),
    );
  }
  async tomar(tramiteId: string, usuarioId: string, areaId: string) {
    return this.ejecutarTransicion(tramiteId, (t) =>
      t.tomar(usuarioId, areaId),
    );
  }
  async asignar(
    tramiteId: string,
    dto: AsignarTramiteDto,
    supervisorId: string,
  ) {
    return this.ejecutarTransicion(tramiteId, (t) =>
      t.asignar(
        dto.usuarioId,
        supervisorId,
        dto.areaId ?? t.areaActualId ?? '',
      ),
    );
  }
  async derivar(tramiteId: string, dto: DerivarTramiteDto, usuarioId: string) {
    return this.ejecutarTransicion(tramiteId, (t) =>
      t.derivar(dto.areaDestinoId, usuarioId),
    );
  }
  async observar(
    tramiteId: string,
    dto: ObservarTramiteDto,
    usuarioId: string,
  ) {
    return this.ejecutarTransicion(tramiteId, (t) =>
      t.observar(dto.comentario, usuarioId),
    );
  }
  async responderObservacion(
    tramiteId: string,
    dto: ResponderObservacionDto,
    usuarioId: string,
  ) {
    return this.ejecutarTransicion(tramiteId, (t) =>
      t.responderObservacion(dto.comentario, usuarioId),
    );
  }
  async solicitarIntervencionExterna(
    tramiteId: string,
    dto: SolicitarIntervencionExternaDto,
    usuarioId: string,
  ) {
    return this.ejecutarTransicion(tramiteId, (t) =>
      t.solicitarIntervencionExterna(
        dto.usuarioExternoId,
        usuarioId,
        dto.comentario ?? null,
      ),
    );
  }
  async responderIntervencionExterna(
    tramiteId: string,
    dto: ResponderIntervencionExternaDto,
    usuarioId: string,
  ) {
    return this.ejecutarTransicion(tramiteId, (t) =>
      t.responderIntervencionExterna(usuarioId, dto.comentario ?? null),
    );
  }
  async aprobar(tramiteId: string, dto: AprobarTramiteDto, usuarioId: string) {
    return this.ejecutarTransicion(tramiteId, (t) =>
      t.aprobar(usuarioId, dto.comentario ?? null),
    );
  }
  async rechazar(tramiteId: string, motivo: string, usuarioId: string) {
    return this.ejecutarTransicion(tramiteId, (t) =>
      t.rechazar(usuarioId, motivo),
    );
  }
  async cancelar(tramiteId: string, usuarioId: string) {
    return this.ejecutarTransicion(tramiteId, (t) => t.cancelar(usuarioId));
  }
  async cerrar(tramiteId: string, usuarioId: string) {
    return this.ejecutarTransicion(tramiteId, (t) => t.cerrar(usuarioId));
  }

  async obtenerHistorial(tramiteId: string): Promise<MovimientoResponse[]> {
    const movs = await this.movimientoRepo.findByTramiteId(tramiteId);
    return movs.map(mapMovimientoToResponse);
  }
}
