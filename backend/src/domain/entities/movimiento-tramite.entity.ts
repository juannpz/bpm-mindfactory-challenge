import { AccionMovimiento, TipoUsuario, EstadoTramite } from '../enums';

export interface MovimientoTramiteProps {
  id: string;
  tramiteId: string;
  estadoAnterior: EstadoTramite | null;
  estadoNuevo: EstadoTramite;
  areaAnteriorId: string | null;
  areaNuevaId: string | null;
  usuarioTipo: TipoUsuario;
  usuarioId: string;
  accion: AccionMovimiento;
  comentario: string | null;
  fecha: Date;
}

export class MovimientoTramite {
  private constructor(
    public readonly id: string,
    public readonly tramiteId: string,
    public readonly estadoAnterior: EstadoTramite | null,
    public readonly estadoNuevo: EstadoTramite,
    public readonly areaAnteriorId: string | null,
    public readonly areaNuevaId: string | null,
    public readonly usuarioTipo: TipoUsuario,
    public readonly usuarioId: string,
    public readonly accion: AccionMovimiento,
    public readonly comentario: string | null,
    public readonly fecha: Date,
  ) {}

  static create(props: MovimientoTramiteProps): MovimientoTramite {
    return new MovimientoTramite(
      props.id,
      props.tramiteId,
      props.estadoAnterior,
      props.estadoNuevo,
      props.areaAnteriorId,
      props.areaNuevaId,
      props.usuarioTipo,
      props.usuarioId,
      props.accion,
      props.comentario,
      props.fecha,
    );
  }
}
