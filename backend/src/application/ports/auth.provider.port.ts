export interface AuthenticatedUser {
  id: string;
  tipo: 'INTERNO' | 'EXTERNO';
  email?: string;
  rol?: string;
  areaId?: string;
}

export interface IAuthProvider {
  validateToken(token: string): Promise<AuthenticatedUser | null>;
}

export interface IInternalTokenSigner {
  signInternalToken(user: {
    id: string;
    nombre: string;
    email: string;
    azureObjectId: string;
    rol: string;
    areaId: string | null;
  }): string;
}

export const INTERNAL_TOKEN_SIGNER = Symbol('IInternalTokenSigner');
