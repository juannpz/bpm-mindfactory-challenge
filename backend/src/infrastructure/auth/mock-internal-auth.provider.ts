import { Injectable, Inject } from '@nestjs/common';
import type {
  IAuthProvider,
  AuthenticatedUser,
} from '@application/ports/auth.provider.port';
import type { IUsuarioInternoRepository } from '@application/ports/usuario-interno.repository.port';
import { USUARIO_INTERNO_REPOSITORY } from '@application/ports/tokens';

@Injectable()
export class MockInternalAuthProvider implements IAuthProvider {
  constructor(
    @Inject(USUARIO_INTERNO_REPOSITORY)
    private readonly usuarioRepo: IUsuarioInternoRepository,
  ) {}

  async validateToken(token: string): Promise<AuthenticatedUser> {
    const mockUserId = token.startsWith('mock-')
      ? token.replace('mock-', '')
      : token;
    const usuario = await this.usuarioRepo.findById(mockUserId);
    if (!usuario || !usuario.activo) {
      throw new Error('Usuario interno no encontrado o inactivo');
    }
    return {
      id: usuario.id,
      tipo: 'INTERNO',
      email: usuario.email,
      rol: usuario.rol,
      areaId: usuario.areaId,
    };
  }
}
