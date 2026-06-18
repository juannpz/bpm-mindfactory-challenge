import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { OidcService } from './oidc.service';

export interface InternalTokenPayload {
  sub: string;
  email: string;
  name: string;
  rol: string;
  areaId: string | null;
  azureObjectId: string;
}

/**
 * Valida tokens internos generados por el OIDC mock local (RS256).
 */
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

/**
 * Valida tokens de Azure Entra ID usando passport-azure-ad BearerStrategy.
 *
 * Requiere AZURE_TENANT_ID y AZURE_CLIENT_ID configurados.
 * Para producción, valida issuer, audiencia, firma y expiración contra Azure JWKS.
 */
@Injectable()
export class AzureInternalTokenValidator {
  verify(_token: string): InternalTokenPayload | null {
    // En producción, passport-azure-ad valida automáticamente contra Azure JWKS.
    // Por ahora, esta implementación es un placeholder — el sistema está arquitectónicamente
    // preparado con los endpoints OIDC y guards agnósticos al proveedor.
    //
    // Para activar producción real:
    // 1. Configurar AZURE_TENANT_ID y AZURE_CLIENT_ID
    // 2. Implementar BearerStrategy de passport-azure-ad
    // 3. Validar token.oid contra UsuarioInterno.azureObjectId
    return null;
  }
}
