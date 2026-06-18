import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ApplicationModule } from '@application/application.module';
import { AuthGuard, InternalAuthGuard, RolesGuard } from './guards';
import {
  AuthController,
  TramiteController,
  WorkflowController,
  DocumentoController,
  ComentarioController,
  ConfiguracionController,
  DashboardController,
  HealthController,
  OidcController,
} from './controllers';

@Module({
  imports: [
    ApplicationModule,
    JwtModule.register({
      secret:
        process.env.JWT_SECRET_EXTERNAL ?? 'super-secret-external-jwt-key',
      signOptions: { expiresIn: '24h' as const },
    }),
  ],
  controllers: [
    AuthController,
    TramiteController,
    WorkflowController,
    DocumentoController,
    ComentarioController,
    ConfiguracionController,
    DashboardController,
    HealthController,
    OidcController,
  ],
  providers: [AuthGuard, InternalAuthGuard, RolesGuard],
  exports: [AuthGuard, InternalAuthGuard, RolesGuard],
})
export class PresentationModule {}
