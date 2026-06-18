import { TipoUsuario, VisibilidadComentario } from '../enums';

export interface ComentarioTramiteProps {
  id: string;
  tramiteId: string;
  mensaje: string;
  visibilidad: VisibilidadComentario;
  autorTipo: TipoUsuario;
  autorId: string;
  autorNombre?: string | null;
  fecha: Date;
}

export class ComentarioTramite {
  private constructor(
    public readonly id: string,
    public readonly tramiteId: string,
    public readonly mensaje: string,
    public readonly visibilidad: VisibilidadComentario,
    public readonly autorTipo: TipoUsuario,
    public readonly autorId: string,
    public readonly autorNombre: string | null | undefined,
    public readonly fecha: Date,
  ) {}

  static create(props: ComentarioTramiteProps): ComentarioTramite {
    return new ComentarioTramite(
      props.id,
      props.tramiteId,
      props.mensaje,
      props.visibilidad,
      props.autorTipo,
      props.autorId,
      props.autorNombre ?? null,
      props.fecha,
    );
  }

  esVisiblePara(tipo: TipoUsuario): boolean {
    if (this.visibilidad === VisibilidadComentario.TODOS) return true;
    if (
      tipo === TipoUsuario.INTERNO &&
      this.visibilidad === VisibilidadComentario.INTERNA
    )
      return true;
    if (
      tipo === TipoUsuario.EXTERNO &&
      this.visibilidad === VisibilidadComentario.EXTERNA
    )
      return true;
    return false;
  }
}
