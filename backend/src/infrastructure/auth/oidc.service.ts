import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

export interface JwkKey {
  kty: string;
  n: string;
  e: string;
  kid: string;
  alg: string;
  use: string;
}

export interface Jwks {
  keys: JwkKey[];
}

export interface OidcConfig {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri: string;
  response_types_supported: string[];
  subject_types_supported: string[];
  id_token_signing_alg_values_supported: string[];
  token_endpoint_auth_methods_supported: string[];
}

/**
 * OidcService — emula un Identity Provider OIDC compatible con Azure Entra ID.
 *
 * Genera claves RSA en memoria al iniciar. Para producción, configurar
 * AZURE_TENANT_ID y AZURE_CLIENT_ID para validar contra Azure JWKS real.
 */
@Injectable()
export class OidcService {
  readonly privateKey: string; // PKCS#8 PEM
  readonly publicKey: string; // SPKI PEM
  readonly kid: string;

  constructor() {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
    });

    this.privateKey = privateKey
      .export({ type: 'pkcs8', format: 'pem' })
      .toString();
    this.publicKey = publicKey
      .export({ type: 'spki', format: 'pem' })
      .toString();
    this.kid = crypto.randomUUID();
  }

  getJwks(): Jwks {
    // Exportar clave pública en formato JWK desde el SPKI PEM
    const pubKeyObj = crypto.createPublicKey(this.publicKey);
    const jwk = pubKeyObj.export({ format: 'jwk' }) as { n: string; e: string };
    return {
      keys: [
        {
          kty: 'RSA',
          n: jwk.n,
          e: jwk.e,
          kid: this.kid,
          alg: 'RS256',
          use: 'sig',
        },
      ],
    };
  }

  getOidcConfig(baseUrl: string): OidcConfig {
    return {
      issuer: baseUrl,
      authorization_endpoint: `${baseUrl}/auth/internal/authorize`,
      token_endpoint: `${baseUrl}/auth/internal/login`,
      jwks_uri: `${baseUrl}/.well-known/jwks.json`,
      response_types_supported: ['code', 'id_token', 'token id_token'],
      subject_types_supported: ['public'],
      id_token_signing_alg_values_supported: ['RS256'],
      token_endpoint_auth_methods_supported: ['none'],
    };
  }
}
