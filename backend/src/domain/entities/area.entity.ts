export interface AreaProps {
  id: string;
  nombre: string;
  codigo: string;
  activa: boolean;
}

export class Area {
  private constructor(
    public readonly id: string,
    public readonly nombre: string,
    public readonly codigo: string,
    public readonly activa: boolean,
  ) {}

  static create(props: AreaProps): Area {
    return new Area(props.id, props.nombre, props.codigo, props.activa);
  }
}
