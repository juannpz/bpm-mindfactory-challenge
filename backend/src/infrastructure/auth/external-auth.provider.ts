import { Injectable, Inject } from '@nestjs/common';
import type {
  IAuthProvider,
  AuthenticatedUser,
} from '@application/ports/auth.provider.port';
import type { IUsuarioExternoRepository } from '@application/ports/usuario-externo.repository.port';
import { USUARIO_EXTERNO_REPOSITORY } from '@application/ports/tokens';
import bcrypt from 'bcrypt';

@Injectable()
export class ExternalAuthProvider implements IAuthProvider {
  constructor(
    @Inject(USUARIO_EXTERNO_REPOSITORY)
    private readonly usuarioRepo: IUsuarioExternoRepository,
  ) {}

  async validateToken(_token: string): Promise<AuthenticatedUser> {
    throw new Error(
      'External auth requiere validación JWT vía Passport strategy',
    );
  }

  async login(
    email: string,
    password: string,
  ): Promise<AuthenticatedUser & { token: string }> {
    const usuario = await this.usuarioRepo.findByEmail(email);
    if (!usuario || !usuario.estaActivo()) {
      throw new Error('Credenciales inválidas');
    }
    const passwordMatch = await bcrypt.compare(
      password,
      usuario.passwordHash ?? '',
    );
    if (!passwordMatch) {
      throw new Error('Credenciales inválidas');
    }
    return { id: usuario.id, tipo: 'EXTERNO', email: usuario.email, token: '' };
  }

  async register(dto: {
    nombre: string;
    email: string;
    password: string;
    documento: string;
    organizacion: string;
  }): Promise<AuthenticatedUser> {
    return { id: '', tipo: 'EXTERNO', email: dto.email };
  }
}
