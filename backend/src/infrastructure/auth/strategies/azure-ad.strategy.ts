import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { BearerStrategy } from 'passport-azure-ad';

export interface AzureAdUser {
  oid: string;
  name: string;
  email: string;
  upn: string;
}

/**
 * AzureAdStrategy — Passport strategy para Azure Entra ID.
 *
 * Se activa cuando MOCK_AUTH=false. Valida tokens Bearer contra
 * el JWKS endpoint de Azure (login.microsoftonline.com).
 * El claim `oid` (Object ID) se usa para buscar al usuario interno
 * por azureObjectId en la base de datos local.
 */
@Injectable()
export class AzureAdStrategy extends PassportStrategy(
  BearerStrategy,
  'azure-ad',
) {
  constructor() {
    const tenantId = process.env.AZURE_TENANT_ID;
    const clientId = process.env.AZURE_CLIENT_ID;

    if (!tenantId || !clientId) {
      throw new Error(
        'AZURE_TENANT_ID y AZURE_CLIENT_ID son requeridos cuando MOCK_AUTH=false',
      );
    }

    super({
      identityMetadata: `https://login.microsoftonline.com/${tenantId}/v2.0/.well-known/openid-configuration`,
      clientID: clientId,
      validateIssuer: true,
      passReqToCallback: false,
      loggingLevel: 'warn',
      isB2C: false,
    });
  }

  async validate(token: AzureAdUser): Promise<AzureAdUser> {
    // passport-azure-ad ya validó firma, issuer, audiencia y expiración.
    // Retornamos los claims — el guard buscará al usuario por oid.
    return token;
  }
}
