import { UsuarioExterno } from '@domain/entities';

export interface IUsuarioExternoRepository {
  findById(id: string): Promise<UsuarioExterno | null>;
  findByEmail(email: string): Promise<UsuarioExterno | null>;
  findAll(): Promise<UsuarioExterno[]>;
  create(
    usuario: UsuarioExterno & { passwordHash: string },
  ): Promise<UsuarioExterno>;
}
