import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtExternalAuthGuard extends AuthGuard('jwt-external') {}

@Injectable()
export class MockInternalAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const mockUserId = request.headers['x-mock-user-id'];
    if (!mockUserId) return false;
    request.user = { id: mockUserId, tipo: 'INTERNO' };
    return true;
  }
}
