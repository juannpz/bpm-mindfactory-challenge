export interface TipoTramiteProps {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  activo: boolean;
  requiereExterno: boolean;
  permiteInicioExterno: boolean;
  slaHoras: number;
  areaInicialId: string;
}

export class TipoTramite {
  private constructor(
    public readonly id: string,
    public readonly codigo: string,
    public readonly nombre: string,
    public readonly descripcion: string,
    public readonly activo: boolean,
    public readonly requiereExterno: boolean,
    public readonly permiteInicioExterno: boolean,
    public readonly slaHoras: number,
    public readonly areaInicialId: string,
  ) {}

  static create(props: TipoTramiteProps): TipoTramite {
    return new TipoTramite(
      props.id,
      props.codigo,
      props.nombre,
      props.descripcion,
      props.activo,
      props.requiereExterno,
      props.permiteInicioExterno,
      props.slaHoras,
      props.areaInicialId,
    );
  }
}
