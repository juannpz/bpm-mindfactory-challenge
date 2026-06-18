import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Inject } from '@nestjs/common';
import { IS_PUBLIC_KEY } from '../decorators';
import { USUARIO_INTERNO_REPOSITORY } from '@application/ports/tokens';
import type { IUsuarioInternoRepository } from '@application/ports/usuario-interno.repository.port';
import { MockInternalTokenValidator } from '@infrastructure/auth/internal-token-validators';

const isMockMode = () => process.env.MOCK_AUTH !== 'false';

/**
 * AuthGuard unificado — provider-agnostic.
 *
 * Internos:
 *   MOCK_AUTH=true  → token RS256 firmado por OIDC mock local
 *   MOCK_AUTH=false → token Azure Entra ID (passport-azure-ad BearerStrategy)
 *
 * Externos:
 *   Siempre JWT HS256 con JWT_SECRET_EXTERNAL
 *
 * Fallback:
 *   X-Mock-User-Id (solo en modo mock)
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
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

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);

      // 1. Internal token — modo mock: RS256 local / prod: Azure AD
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
      // Production mode: Azure AD validation is handled by AzureAdGuard
      // (applied via @UseGuards on controllers or globally via APP_GUARD)

      // 2. External JWT (HS256)
      try {
        const payload = this.jwtService.verify(token);
        request.user = {
          id: payload.sub,
          email: payload.email,
          tipo: 'EXTERNO',
        };
        return true;
      } catch {
        throw new UnauthorizedException('Token JWT inválido o expirado');
      }
    }

    // 3. Fallback: X-Mock-User-Id (solo modo mock)
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

    throw new UnauthorizedException('Autenticación requerida');
  }
}
