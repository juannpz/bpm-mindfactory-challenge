import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators';
import { USUARIO_INTERNO_REPOSITORY } from '@application/ports/tokens';
import type { IUsuarioInternoRepository } from '@application/ports/usuario-interno.repository.port';
import { MockInternalTokenValidator } from '@infrastructure/auth/internal-token-validators';

const isMockMode = () => process.env.MOCK_AUTH !== 'false';

/**
 * InternalAuthGuard — solo acepta usuarios INTERNOS.
 *
 * Provider-agnostic:
 *   Mock:   token RS256 firmado por OIDC mock local
 *   Prod:   token Azure Entra ID validado por AzureAdStrategy
 *   Fallback: X-Mock-User-Id (solo mock)
 */
@Injectable()
export class InternalAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly mockValidator: MockInternalTokenValidator,
    @Inject(USUARIO_INTERNO_REPOSITORY)
    private readonly usuarioInternoRepo: IUsuarioInternoRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const authHeader: string | undefined = request.headers['authorization'];

    // 1. Bearer internal token
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);

      if (isMockMode()) {
        const payload = this.mockValidator.verify(token);
        if (payload) {
          const usuario = await this.usuarioInternoRepo.findById(payload.sub);
          if (usuario && usuario.activo) {
            request.user = {
              id: usuario.id,
              tipo: 'INTERNO',
              email: usuario.email,
              rol: usuario.rol,
              areaId: usuario.areaId,
            };
            return true;
          }
        }
      }
      // Production mode: Azure AD validation handled by AzureAdGuard
    }

    // 2. Fallback: X-Mock-User-Id
    if (isMockMode()) {
      const mockUserId: string | undefined = request.headers['x-mock-user-id'];
      if (mockUserId) {
        const usuario =
          await this.usuarioInternoRepo.findByAzureObjectId(mockUserId);
        if (!usuario || !usuario.activo) {
          throw new UnauthorizedException(
            'Usuario interno no encontrado o inactivo',
          );
        }
        request.user = {
          id: usuario.id,
          tipo: 'INTERNO',
          email: usuario.email,
          rol: usuario.rol,
          areaId: usuario.areaId,
        };
        return true;
      }
    }

    throw new UnauthorizedException('Autenticación interna requerida');
  }
}
