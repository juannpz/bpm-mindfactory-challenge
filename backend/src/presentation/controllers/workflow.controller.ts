import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { WorkflowUseCases } from '@application/use-cases';
import {
  AsignarTramiteDto,
  DerivarTramiteDto,
  ObservarTramiteDto,
  ResponderObservacionDto,
  SolicitarIntervencionExternaDto,
  ResponderIntervencionExternaDto,
  AprobarTramiteDto,
  RechazarTramiteDto,
} from '@application/dtos';
import { CurrentUser, Roles } from '../decorators';
import { AuthGuard } from '../guards';

@ApiTags('Workflow')
@ApiBearerAuth()
@Controller('tramites/:id')
@UseGuards(AuthGuard)
export class WorkflowController {
  constructor(private readonly workflowUseCases: WorkflowUseCases) {}

  /** Solo usuarios INTERNOS pueden ejecutar estas acciones */
  private soloInterno(user: { tipo: string }) {
    if (user.tipo !== 'INTERNO') {
      throw new ForbiddenException(
        'Solo usuarios internos pueden ejecutar esta acción',
      );
    }
  }

  @Post('ingresar')
  @ApiOperation({ summary: 'Ingresar trámite (BORRADOR → INGRESADO)' })
  @ApiResponse({ status: 200, description: 'Trámite ingresado' })
  @ApiResponse({ status: 403, description: 'Solo usuarios internos' })
  @ApiResponse({ status: 422, description: 'Transición no permitida' })
  async ingresar(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; tipo: string; areaId?: string },
  ) {
    this.soloInterno(user);
    return this.workflowUseCases.ingresar(id, user.id, user.areaId ?? '');
  }

  @Post('tomar')
  async tomar(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; tipo: string; areaId?: string },
  ) {
    this.soloInterno(user);
    return this.workflowUseCases.tomar(id, user.id, user.areaId ?? '');
  }

  @Post('asignar')
  @Roles('ADMIN', 'SUPERVISOR')
  async asignar(
    @Param('id') id: string,
    @Body() dto: AsignarTramiteDto,
    @CurrentUser() user: { id: string; tipo: string; rol?: string },
  ) {
    this.soloInterno(user);
    return this.workflowUseCases.asignar(id, dto, user.id);
  }

  @Post('derivar')
  async derivar(
    @Param('id') id: string,
    @Body() dto: DerivarTramiteDto,
    @CurrentUser() user: { id: string; tipo: string },
  ) {
    this.soloInterno(user);
    return this.workflowUseCases.derivar(id, dto, user.id);
  }

  @Post('observar')
  async observar(
    @Param('id') id: string,
    @Body() dto: ObservarTramiteDto,
    @CurrentUser() user: { id: string; tipo: string },
  ) {
    this.soloInterno(user);
    return this.workflowUseCases.observar(id, dto, user.id);
  }

  @Post('responder-observacion')
  async responderObservacion(
    @Param('id') id: string,
    @Body() dto: ResponderObservacionDto,
    @CurrentUser() user: { id: string; tipo: string },
  ) {
    // Solo EXTERNO puede responder observaciones
    if (user.tipo !== 'EXTERNO') {
      throw new ForbiddenException(
        'Solo usuarios externos pueden responder observaciones',
      );
    }
    return this.workflowUseCases.responderObservacion(id, dto, user.id);
  }

  @Post('solicitar-intervencion-externa')
  async solicitarIntervencionExterna(
    @Param('id') id: string,
    @Body() dto: SolicitarIntervencionExternaDto,
    @CurrentUser() user: { id: string; tipo: string },
  ) {
    this.soloInterno(user);
    return this.workflowUseCases.solicitarIntervencionExterna(id, dto, user.id);
  }

  @Post('responder-intervencion-externa')
  async responderIntervencionExterna(
    @Param('id') id: string,
    @Body() dto: ResponderIntervencionExternaDto,
    @CurrentUser() user: { id: string; tipo: string },
  ) {
    // Solo EXTERNO puede responder intervenciones
    if (user.tipo !== 'EXTERNO') {
      throw new ForbiddenException(
        'Solo usuarios externos pueden responder intervenciones',
      );
    }
    return this.workflowUseCases.responderIntervencionExterna(id, dto, user.id);
  }

  @Post('aprobar')
  async aprobar(
    @Param('id') id: string,
    @Body() dto: AprobarTramiteDto,
    @CurrentUser() user: { id: string; tipo: string },
  ) {
    this.soloInterno(user);
    return this.workflowUseCases.aprobar(id, dto, user.id);
  }

  @Post('rechazar')
  async rechazar(
    @Param('id') id: string,
    @Body() dto: RechazarTramiteDto,
    @CurrentUser() user: { id: string; tipo: string },
  ) {
    this.soloInterno(user);
    return this.workflowUseCases.rechazar(id, dto.motivo, user.id);
  }

  @Post('cancelar')
  async cancelar(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; tipo: string },
  ) {
    // Solo INTERNO puede cancelar (un externo si quiere cancelar su tramite en borrador lo elimina)
    this.soloInterno(user);
    return this.workflowUseCases.cancelar(id, user.id);
  }

  @Post('cerrar')
  async cerrar(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; tipo: string },
  ) {
    this.soloInterno(user);
    return this.workflowUseCases.cerrar(id, user.id);
  }

  @Get('historial')
  async historial(@Param('id') id: string) {
    return this.workflowUseCases.obtenerHistorial(id);
  }
}
