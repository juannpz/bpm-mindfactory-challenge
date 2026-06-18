import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import {
  PrismaTramiteRepository,
  PrismaMovimientoRepository,
  PrismaDocumentoRepository,
  PrismaComentarioRepository,
  PrismaTipoTramiteRepository,
  PrismaAreaRepository,
  PrismaUsuarioInternoRepository,
  PrismaUsuarioExternoRepository,
} from './repositories';
import { LocalFileStorageService } from './storage';
import { JwtExternalStrategy } from './auth/strategies/jwt-external.strategy';
import { MockInternalAuthProvider } from './auth/mock-internal-auth.provider';
import { ExternalAuthProvider } from './auth/external-auth.provider';
import {
  JwtExternalAuthGuard,
  MockInternalAuthGuard,
} from './auth/auth.guards';
import { OidcService } from './auth/oidc.service';
import {
  MockInternalTokenValidator,
  AzureInternalTokenValidator,
} from './auth/internal-token-validators';
import { AzureAdStrategy } from './auth/strategies/azure-ad.strategy';
import { PrismaUnitOfWork } from './prisma/prisma-unit-of-work';
import { MagicTokenService } from './auth/magic-token.service';
import { EmailService } from './auth/email.service';
import {
  TRAMITE_REPOSITORY,
  MOVIMIENTO_REPOSITORY,
  DOCUMENTO_REPOSITORY,
  COMENTARIO_REPOSITORY,
  TIPO_TRAMITE_REPOSITORY,
  AREA_REPOSITORY,
  USUARIO_INTERNO_REPOSITORY,
  USUARIO_EXTERNO_REPOSITORY,
  FILE_STORAGE,
  UNIT_OF_WORK,
} from '@application/ports/tokens';
import { INTERNAL_TOKEN_SIGNER } from '@application/ports/auth.provider.port';
import { MockInternalTokenSigner } from './auth/mock-internal-token-signer';

const repositoryProviders = [
  { provide: TRAMITE_REPOSITORY, useClass: PrismaTramiteRepository },
  { provide: MOVIMIENTO_REPOSITORY, useClass: PrismaMovimientoRepository },
  { provide: DOCUMENTO_REPOSITORY, useClass: PrismaDocumentoRepository },
  { provide: COMENTARIO_REPOSITORY, useClass: PrismaComentarioRepository },
  { provide: TIPO_TRAMITE_REPOSITORY, useClass: PrismaTipoTramiteRepository },
  { provide: AREA_REPOSITORY, useClass: PrismaAreaRepository },
  {
    provide: USUARIO_INTERNO_REPOSITORY,
    useClass: PrismaUsuarioInternoRepository,
  },
  {
    provide: USUARIO_EXTERNO_REPOSITORY,
    useClass: PrismaUsuarioExternoRepository,
  },
  { provide: FILE_STORAGE, useClass: LocalFileStorageService },
  { provide: UNIT_OF_WORK, useClass: PrismaUnitOfWork },
  { provide: INTERNAL_TOKEN_SIGNER, useClass: MockInternalTokenSigner },
];

const authProviders = [
  JwtExternalStrategy,
  MockInternalAuthProvider,
  ExternalAuthProvider,
  JwtExternalAuthGuard,
  MockInternalAuthGuard,
  OidcService,
  MockInternalTokenValidator,
  AzureInternalTokenValidator,
  MagicTokenService,
  EmailService,
  ...(process.env.MOCK_AUTH !== 'false' ? [] : [AzureAdStrategy]),
];

@Module({
  imports: [PrismaModule],
  providers: [...repositoryProviders, ...authProviders],
  exports: [
    ...repositoryProviders.map((p) => p.provide),
    PrismaModule,
    ...authProviders,
  ],
})
export class InfrastructureModule {}
