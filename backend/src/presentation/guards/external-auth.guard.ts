import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from '../decorators';

/**
 * ExternalAuthGuard — valida JWT Bearer token para usuarios EXTERNOS.
 * Solo acepta tokens JWT firmados con JWT_SECRET_EXTERNAL.
 * No acepta mock headers (X-Mock-User-Id).
 */
@Injectable()
export class ExternalAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const authHeader: string | undefined = request.headers['authorization'];

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Autenticación externa requerida (Bearer token)',
      );
    }

    const token = authHeader.slice(7);
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
}
