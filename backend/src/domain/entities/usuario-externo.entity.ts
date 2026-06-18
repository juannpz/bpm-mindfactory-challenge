import { EstadoUsuarioExterno } from '../enums';

export interface UsuarioExternoProps {
  id: string;
  nombre: string;
  email: string;
  documento: string;
  organizacion: string;
  estado: EstadoUsuarioExterno;
  fechaAlta: Date;
  passwordHash?: string | null;
}

export class UsuarioExterno {
  private constructor(
    public readonly id: string,
    public readonly nombre: string,
    public readonly email: string,
    public readonly documento: string,
    public readonly organizacion: string,
    public readonly estado: EstadoUsuarioExterno,
    public readonly fechaAlta: Date,
    public readonly passwordHash: string | null | undefined,
  ) {}

  static create(props: UsuarioExternoProps): UsuarioExterno {
    return new UsuarioExterno(
      props.id,
      props.nombre,
      props.email,
      props.documento,
      props.organizacion,
      props.estado,
      props.fechaAlta,
      props.passwordHash ?? null,
    );
  }

  estaActivo(): boolean {
    return this.estado === EstadoUsuarioExterno.ACTIVO;
  }
}
