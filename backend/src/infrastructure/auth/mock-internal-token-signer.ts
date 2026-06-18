import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { OidcService } from './oidc.service';
import type { IInternalTokenSigner } from '@application/ports/auth.provider.port';

@Injectable()
export class MockInternalTokenSigner implements IInternalTokenSigner {
  constructor(private readonly oidcService: OidcService) {}

  signInternalToken(user: {
    id: string;
    nombre: string;
    email: string;
    azureObjectId: string;
    rol: string;
    areaId: string | null;
  }): string {
    const expiresIn = 86400;
    return jwt.sign(
      {
        azureObjectId: user.azureObjectId,
        email: user.email,
        name: user.nombre,
        tipo: 'INTERNO',
        rol: user.rol,
        areaId: user.areaId,
      },
      this.oidcService.privateKey,
      {
        algorithm: 'RS256',
        keyid: this.oidcService.kid,
        expiresIn,
        subject: user.id,
        issuer: 'bpm-mock-oidc',
        audience: 'bpm-api',
      },
    );
  }
}
