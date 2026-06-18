import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import jwksRsa from 'jwks-rsa';
import { OidcService } from './oidc.service';

export interface InternalTokenPayload {
  sub: string;
  email: string;
  name: string;
  rol: string;
  areaId: string | null;
  azureObjectId: string;
}

@Injectable()
export class MockInternalTokenValidator {
  constructor(private readonly oidcService: OidcService) {}

  verify(token: string): InternalTokenPayload | null {
    try {
      const payload = jwt.verify(token, this.oidcService.publicKey, {
        algorithms: ['RS256'],
      }) as Record<string, unknown>;

      if (payload.tipo !== 'INTERNO') return null;
      if (!payload.sub) return null;

      return {
        sub: payload.sub as string,
        email: (payload.email as string) ?? '',
        name: (payload.name as string) ?? '',
        rol: (payload.rol as string) ?? 'OPERADOR',
        areaId: (payload.areaId as string) ?? null,
        azureObjectId: (payload.azureObjectId as string) ?? '',
      };
    } catch {
      return null;
    }
  }
}

@Injectable()
export class AzureInternalTokenValidator {
  private readonly client: jwksRsa.JwksClient | null;
  private readonly tenantId: string;
  private readonly clientId: string;
  private readonly issuer: string;

  constructor() {
    this.tenantId = process.env.AZURE_TENANT_ID ?? '';
    this.clientId = process.env.AZURE_CLIENT_ID ?? '';
    this.issuer = this.tenantId
      ? `https://login.microsoftonline.com/${this.tenantId}/v2.0`
      : '';

    if (this.tenantId && this.clientId) {
      this.client = jwksRsa({
        jwksUri: `https://login.microsoftonline.com/${this.tenantId}/discovery/v2.0/keys`,
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 10,
        cacheMaxEntries: 5,
        cacheMaxAge: 600_000,
      });
    } else {
      this.client = null;
    }
  }

  async verify(token: string): Promise<InternalTokenPayload | null> {
    if (!this.client) return null;

    return new Promise((resolve) => {
      jwt.verify(
        token,
        (header, callback) => {
          this.client!.getSigningKey(header.kid ?? '', (err, key) => {
            if (err || !key) return callback(err ?? new Error('Key not found'));
            callback(null, key.getPublicKey());
          });
        },
        {
          algorithms: ['RS256', 'RS384'],
          issuer: this.issuer,
          audience: this.clientId,
          clockTolerance: 60,
        },
        (err, decoded: any) => {
          if (err) return resolve(null);

          const oid = decoded?.oid;
          if (!oid) return resolve(null);

          resolve({
            sub: oid,
            email:
              decoded.email ?? decoded.preferred_username ?? decoded.upn ?? '',
            name: decoded.name ?? '',
            rol: '',
            areaId: null,
            azureObjectId: oid,
          });
        },
      );
    });
  }
}
