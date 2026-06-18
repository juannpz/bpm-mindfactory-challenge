import { RolInterno } from '../enums';

export interface UsuarioInternoProps {
  id: string;
  nombre: string;
  email: string;
  areaId: string;
  rol: RolInterno;
  azureObjectId: string;
  activo: boolean;
}

export class UsuarioInterno {
  private constructor(
    public readonly id: string,
    public readonly nombre: string,
    public readonly email: string,
    public readonly areaId: string,
    public readonly rol: RolInterno,
    public readonly azureObjectId: string,
    public readonly activo: boolean,
  ) {}

  static create(props: UsuarioInternoProps): UsuarioInterno {
    return new UsuarioInterno(
      props.id,
      props.nombre,
      props.email,
      props.areaId,
      props.rol,
      props.azureObjectId,
      props.activo,
    );
  }

  puedeConfigurar(): boolean {
    return this.rol === RolInterno.ADMIN;
  }

  puedeReasignar(): boolean {
    return this.rol === RolInterno.SUPERVISOR || this.rol === RolInterno.ADMIN;
  }

  puedeVerTodo(): boolean {
    return this.rol === RolInterno.ADMIN || this.rol === RolInterno.AUDITOR;
  }

  esAuditor(): boolean {
    return this.rol === RolInterno.AUDITOR;
  }
}
