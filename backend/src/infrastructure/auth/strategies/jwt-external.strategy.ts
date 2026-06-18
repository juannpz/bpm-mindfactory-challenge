import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtExternalStrategy extends PassportStrategy(
  Strategy,
  'jwt-external',
) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey:
        process.env.JWT_SECRET_EXTERNAL ?? 'super-secret-external-jwt-key',
    });
  }

  async validate(payload: {
    sub: string;
    email: string;
  }): Promise<{ id: string; email: string; tipo: 'EXTERNO' }> {
    return { id: payload.sub, email: payload.email, tipo: 'EXTERNO' };
  }
}
