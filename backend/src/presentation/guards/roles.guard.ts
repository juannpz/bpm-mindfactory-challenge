import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators';

export interface RequestUser {
  id: string;
  tipo: 'INTERNO' | 'EXTERNO';
  email: string;
  rol?: string;
  areaId?: string;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context
      .switchToHttp()
      .getRequest<{ user?: RequestUser }>();
    if (!user) throw new ForbiddenException('Usuario no autenticado');

    const userRole: string =
      user.tipo === 'INTERNO' ? (user.rol ?? '') : 'EXTERNO';

    if (!requiredRoles.includes(userRole)) {
      throw new ForbiddenException(
        'No tiene permisos para realizar esta acción',
      );
    }

    return true;
  }
}
