import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { InfrastructureModule } from '@infrastructure/infrastructure.module';
import {
  TramiteUseCases,
  WorkflowUseCases,
  ComentarioUseCases,
  DocumentoUseCases,
  DashboardUseCases,
  ConfiguracionUseCases,
  AuthUseCases,
} from './use-cases';

@Module({
  imports: [
    InfrastructureModule,
    JwtModule.register({
      secret:
        process.env.JWT_SECRET_EXTERNAL ?? 'super-secret-external-jwt-key',
      signOptions: { expiresIn: '24h' as const },
    }),
  ],
  providers: [
    TramiteUseCases,
    WorkflowUseCases,
    ComentarioUseCases,
    DocumentoUseCases,
    DashboardUseCases,
    ConfiguracionUseCases,
    AuthUseCases,
  ],
  exports: [
    TramiteUseCases,
    WorkflowUseCases,
    ComentarioUseCases,
    DocumentoUseCases,
    DashboardUseCases,
    ConfiguracionUseCases,
    AuthUseCases,
    InfrastructureModule,
  ],
})
export class ApplicationModule {}
