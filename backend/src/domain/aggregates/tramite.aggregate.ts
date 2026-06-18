import {
  OrigenTramite,
  EstadoTramite,
  Prioridad,
  AccionMovimiento,
  TipoUsuario,
} from '../enums';
import { NumeroTramite } from '../value-objects';
import { MovimientoTramite } from '../entities/movimiento-tramite.entity';
import { TransicionValidatorService } from '../services/transicion-validator.service';
import { v4 as uuid } from 'uuid';

export interface TramiteProps {
  id: string;
  numero: string;
  tipoTramiteId: string;
  tipoTramiteNombre?: string | null;
  titulo: string;
  descripcion: string;
  origen: OrigenTramite;
  estado: EstadoTramite;
  prioridad: Prioridad;
  areaActualId: string | null;
  areaActualNombre?: string | null;
  usuarioAsignadoId: string | null;
  usuarioAsignadoNombre?: string | null;
  usuarioExternoId: string | null;
  usuarioExternoNombre?: string | null;
  creadoPorTipo: TipoUsuario;
  creadoPorId: string;
  fechaCreacion: Date;
  fechaActualizacion: Date;
  fechaCierre: Date | null;
  version: number;
}

export class Tramite {
  private constructor(
    public readonly id: string,
    public readonly numero: string,
    public readonly tipoTramiteId: string,
    public readonly tipoTramiteNombre: string | null | undefined,
    public readonly titulo: string,
    public readonly descripcion: string,
    public readonly origen: OrigenTramite,
    public readonly estado: EstadoTramite,
    public readonly prioridad: Prioridad,
    public readonly areaActualId: string | null,
    public readonly areaActualNombre: string | null | undefined,
    public readonly usuarioAsignadoId: string | null,
    public readonly usuarioAsignadoNombre: string | null | undefined,
    public readonly usuarioExternoId: string | null,
    public readonly usuarioExternoNombre: string | null | undefined,
    public readonly creadoPorTipo: TipoUsuario,
    public readonly creadoPorId: string,
    public readonly fechaCreacion: Date,
    public readonly fechaActualizacion: Date,
    public readonly fechaCierre: Date | null,
    public readonly version: number,
  ) {}

  static create(
    props: Omit<
      TramiteProps,
      | 'estado'
      | 'numero'
      | 'fechaCreacion'
      | 'fechaActualizacion'
      | 'fechaCierre'
      | 'version'
    > & { anio: number; secuencial: number },
  ): { tramite: Tramite; movimiento: MovimientoTramite } {
    const ahora = new Date();
    const tramite = new Tramite(
      props.id,
      NumeroTramite.generate(props.anio, props.secuencial).toString(),
      props.tipoTramiteId,
      null,
      props.titulo,
      props.descripcion,
      props.origen,
      EstadoTramite.BORRADOR,
      props.prioridad,
      props.areaActualId ?? null,
      null,
      null,
      null,
      props.usuarioExternoId ?? null,
      null,
      props.creadoPorTipo,
      props.creadoPorId,
      ahora,
      ahora,
      null,
      1,
    );

    const movimiento = MovimientoTramite.create({
      id: uuid(),
      tramiteId: tramite.id,
      estadoAnterior: null,
      estadoNuevo: EstadoTramite.BORRADOR,
      areaAnteriorId: null,
      areaNuevaId: props.areaActualId ?? null,
      usuarioTipo: props.creadoPorTipo,
      usuarioId: props.creadoPorId,
      accion: AccionMovimiento.CREAR,
      comentario: null,
      fecha: ahora,
    });

    return { tramite, movimiento };
  }

  static fromProps(props: TramiteProps): Tramite {
    return new Tramite(
      props.id,
      props.numero,
      props.tipoTramiteId,
      props.tipoTramiteNombre ?? null,
      props.titulo,
      props.descripcion,
      props.origen,
      props.estado,
      props.prioridad,
      props.areaActualId,
      props.areaActualNombre ?? null,
      props.usuarioAsignadoId,
      props.usuarioAsignadoNombre ?? null,
      props.usuarioExternoId,
      props.usuarioExternoNombre ?? null,
      props.creadoPorTipo,
      props.creadoPorId,
      props.fechaCreacion,
      props.fechaActualizacion,
      props.fechaCierre,
      props.version,
    );
  }

  ingresar(
    usuarioId: string,
    areaId: string,
  ): { tramite: Tramite; movimiento: MovimientoTramite } {
    this.validarTransicion(AccionMovimiento.INGRESAR);
    return this.aplicarTransicion(
      EstadoTramite.INGRESADO,
      AccionMovimiento.INGRESAR,
      TipoUsuario.INTERNO,
      usuarioId,
      areaId,
      null,
      null,
    );
  }

  tomar(
    usuarioId: string,
    areaId: string,
  ): { tramite: Tramite; movimiento: MovimientoTramite } {
    this.validarTransicion(AccionMovimiento.TOMAR);
    if (this.usuarioAsignadoId && this.usuarioAsignadoId !== usuarioId) {
      throw new Error('El trámite ya fue tomado por otro usuario');
    }
    return this.aplicarTransicion(
      EstadoTramite.EN_REVISION,
      AccionMovimiento.TOMAR,
      TipoUsuario.INTERNO,
      usuarioId,
      areaId,
      usuarioId,
      null,
    );
  }

  asignar(
    usuarioId: string,
    supervisorId: string,
    areaId: string,
  ): { tramite: Tramite; movimiento: MovimientoTramite } {
    this.validarTransicion(AccionMovimiento.ASIGNAR);
    return this.aplicarTransicion(
      this.estado,
      AccionMovimiento.ASIGNAR,
      TipoUsuario.INTERNO,
      supervisorId,
      areaId,
      usuarioId,
      null,
    );
  }

  derivar(
    areaDestinoId: string,
    usuarioId: string,
  ): { tramite: Tramite; movimiento: MovimientoTramite } {
    if (this.origen !== OrigenTramite.INTERNO_INTERNO) {
      throw new Error(
        'Solo se puede derivar trámites de origen INTERNO_INTERNO',
      );
    }
    this.validarTransicion(AccionMovimiento.DERIVAR);
    return this.aplicarTransicion(
      EstadoTramite.EN_REVISION,
      AccionMovimiento.DERIVAR,
      TipoUsuario.INTERNO,
      usuarioId,
      areaDestinoId,
      usuarioId,
      null,
    );
  }

  observar(
    comentario: string,
    usuarioId: string,
  ): { tramite: Tramite; movimiento: MovimientoTramite } {
    this.validarTransicion(AccionMovimiento.OBSERVAR);
    return this.aplicarTransicion(
      EstadoTramite.OBSERVADO,
      AccionMovimiento.OBSERVAR,
      TipoUsuario.INTERNO,
      usuarioId,
      this.areaActualId,
      usuarioId,
      comentario,
    );
  }

  responderObservacion(
    comentario: string,
    usuarioExternoId: string,
  ): { tramite: Tramite; movimiento: MovimientoTramite } {
    if (this.origen !== OrigenTramite.EXTERNO_INTERNO) {
      throw new Error(
        'Solo trámites de origen EXTERNO_INTERNO pueden responder observaciones',
      );
    }
    this.validarTransicion(AccionMovimiento.RESPONDER_OBSERVACION);
    return this.aplicarTransicion(
      EstadoTramite.INGRESADO,
      AccionMovimiento.RESPONDER_OBSERVACION,
      TipoUsuario.EXTERNO,
      usuarioExternoId,
      this.areaActualId,
      null,
      comentario,
    );
  }

  solicitarIntervencionExterna(
    usuarioExternoId: string,
    operadorId: string,
    comentario: string | null = null,
  ): { tramite: Tramite; movimiento: MovimientoTramite } {
    if (this.origen !== OrigenTramite.INTERNO_EXTERNO) {
      throw new Error(
        'Solo trámites de origen INTERNO_EXTERNO pueden solicitar intervención externa',
      );
    }
    this.validarTransicion(AccionMovimiento.SOLICITAR_INTERVENCION_EXTERNA);
    return this.aplicarTransicion(
      EstadoTramite.ESPERANDO_EXTERNO,
      AccionMovimiento.SOLICITAR_INTERVENCION_EXTERNA,
      TipoUsuario.INTERNO,
      operadorId,
      this.areaActualId,
      undefined,
      comentario,
    );
  }

  responderIntervencionExterna(
    usuarioExternoId: string,
    comentario: string | null = null,
  ): { tramite: Tramite; movimiento: MovimientoTramite } {
    this.validarTransicion(AccionMovimiento.RESPONDER_INTERVENCION_EXTERNA);
    return this.aplicarTransicion(
      EstadoTramite.ESPERANDO_INTERNO,
      AccionMovimiento.RESPONDER_INTERVENCION_EXTERNA,
      TipoUsuario.EXTERNO,
      usuarioExternoId,
      this.areaActualId,
      null,
      comentario,
    );
  }

  aprobar(
    usuarioId: string,
    comentario: string | null = null,
  ): { tramite: Tramite; movimiento: MovimientoTramite } {
    this.validarTransicion(AccionMovimiento.APROBAR);
    return this.aplicarTransicion(
      EstadoTramite.APROBADO,
      AccionMovimiento.APROBAR,
      TipoUsuario.INTERNO,
      usuarioId,
      this.areaActualId,
      usuarioId,
      comentario,
    );
  }

  rechazar(
    usuarioId: string,
    motivo: string,
  ): { tramite: Tramite; movimiento: MovimientoTramite } {
    this.validarTransicion(AccionMovimiento.RECHAZAR);
    return this.aplicarTransicion(
      EstadoTramite.RECHAZADO,
      AccionMovimiento.RECHAZAR,
      TipoUsuario.INTERNO,
      usuarioId,
      this.areaActualId,
      usuarioId,
      motivo,
    );
  }

  cancelar(usuarioId: string): {
    tramite: Tramite;
    movimiento: MovimientoTramite;
  } {
    this.validarTransicion(AccionMovimiento.CANCELAR);
    return this.aplicarTransicion(
      EstadoTramite.CANCELADO,
      AccionMovimiento.CANCELAR,
      TipoUsuario.INTERNO,
      usuarioId,
      this.areaActualId,
      usuarioId,
      null,
    );
  }

  cerrar(usuarioId: string): {
    tramite: Tramite;
    movimiento: MovimientoTramite;
  } {
    this.validarTransicion(AccionMovimiento.CERRAR);
    return this.aplicarTransicion(
      EstadoTramite.CERRADO,
      AccionMovimiento.CERRAR,
      TipoUsuario.INTERNO,
      usuarioId,
      this.areaActualId,
      usuarioId,
      null,
    );
  }

  accionesDisponibles(): AccionMovimiento[] {
    return TransicionValidatorService.accionesDisponibles(
      this.origen,
      this.estado,
    );
  }

  private validarTransicion(accion: AccionMovimiento): void {
    if (
      !TransicionValidatorService.puedeTransicionar(
        this.origen,
        this.estado,
        accion,
      )
    ) {
      throw new Error(
        `No se puede ejecutar la acción ${accion} en el estado ${this.estado} (origen: ${this.origen})`,
      );
    }
  }

  private aplicarTransicion(
    estadoNuevo: EstadoTramite,
    accion: AccionMovimiento,
    usuarioTipo: TipoUsuario,
    usuarioId: string,
    areaNuevaId: string | null,
    asignadoA: string | null,
    comentario: string | null,
  ): { tramite: Tramite; movimiento: MovimientoTramite } {
    const ahora = new Date();
    const tramite = new Tramite(
      this.id,
      this.numero,
      this.tipoTramiteId,
      this.tipoTramiteNombre,
      this.titulo,
      this.descripcion,
      this.origen,
      estadoNuevo,
      this.prioridad,
      areaNuevaId ?? this.areaActualId,
      this.areaActualNombre,
      asignadoA !== undefined ? asignadoA : this.usuarioAsignadoId,
      this.usuarioAsignadoNombre,
      this.usuarioExternoId,
      this.usuarioExternoNombre,
      this.creadoPorTipo,
      this.creadoPorId,
      this.fechaCreacion,
      ahora,
      this.fechaCierre,
      this.version + 1,
    );

    const movimiento = MovimientoTramite.create({
      id: uuid(),
      tramiteId: this.id,
      estadoAnterior: this.estado,
      estadoNuevo,
      areaAnteriorId: this.areaActualId,
      areaNuevaId: areaNuevaId ?? this.areaActualId,
      usuarioTipo,
      usuarioId,
      accion,
      comentario,
      fecha: ahora,
    });

    return { tramite, movimiento };
  }
}
