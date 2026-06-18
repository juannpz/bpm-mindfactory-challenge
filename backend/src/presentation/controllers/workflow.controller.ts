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
  ApiBody,
  ApiParam,
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
import {
  TramiteResponse,
  MovimientoResponse,
} from '@application/dtos/responses';
import { CurrentUser, Roles } from '../decorators';
import { AuthGuard, RolesGuard } from '../guards';

@ApiTags('Workflow')
@ApiBearerAuth()
@Controller('tramites/:id')
@UseGuards(AuthGuard)
export class WorkflowController {
  constructor(private readonly workflowUseCases: WorkflowUseCases) {}

  private soloInterno(user: { tipo: string }) {
    if (user.tipo !== 'INTERNO') {
      throw new ForbiddenException(
        'Solo usuarios internos pueden ejecutar esta acción',
      );
    }
  }

  @Post('ingresar')
  @ApiOperation({ summary: 'Ingresar trámite (BORRADOR → INGRESADO)' })
  @ApiParam({
    name: 'id',
    description: 'ID del trámite',
    example: 'uuid-tramite',
  })
  @ApiResponse({
    status: 200,
    description: 'Trámite ingresado',
    type: TramiteResponse,
  })
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
  @ApiOperation({ summary: 'Tomar trámite (INGRESADO → EN_REVISION)' })
  @ApiParam({
    name: 'id',
    description: 'ID del trámite',
    example: 'uuid-tramite',
  })
  @ApiResponse({
    status: 200,
    description: 'Trámite tomado',
    type: TramiteResponse,
  })
  @ApiResponse({ status: 403, description: 'Solo usuarios internos' })
  @ApiResponse({
    status: 422,
    description: 'Transición no permitida o ya tomado',
  })
  async tomar(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; tipo: string; areaId?: string },
  ) {
    this.soloInterno(user);
    return this.workflowUseCases.tomar(id, user.id, user.areaId ?? '');
  }

  @Post('asignar')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPERVISOR')
  @ApiOperation({
    summary: 'Asignar trámite a un usuario interno (ADMIN/SUPERVISOR)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del trámite',
    example: 'uuid-tramite',
  })
  @ApiBody({ type: AsignarTramiteDto })
  @ApiResponse({
    status: 200,
    description: 'Trámite asignado',
    type: TramiteResponse,
  })
  @ApiResponse({ status: 403, description: 'Solo ADMIN/SUPERVISOR internos' })
  @ApiResponse({ status: 422, description: 'Transición no permitida' })
  async asignar(
    @Param('id') id: string,
    @Body() dto: AsignarTramiteDto,
    @CurrentUser() user: { id: string; tipo: string; rol?: string },
  ) {
    this.soloInterno(user);
    return this.workflowUseCases.asignar(id, dto, user.id);
  }

  @Post('derivar')
  @ApiOperation({
    summary: 'Derivar trámite a otra área (solo INTERNO_INTERNO)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del trámite',
    example: 'uuid-tramite',
  })
  @ApiBody({ type: DerivarTramiteDto })
  @ApiResponse({
    status: 200,
    description: 'Trámite derivado',
    type: TramiteResponse,
  })
  @ApiResponse({ status: 403, description: 'Solo usuarios internos' })
  @ApiResponse({ status: 422, description: 'Transición no permitida' })
  async derivar(
    @Param('id') id: string,
    @Body() dto: DerivarTramiteDto,
    @CurrentUser() user: { id: string; tipo: string },
  ) {
    this.soloInterno(user);
    return this.workflowUseCases.derivar(id, dto, user.id);
  }

  @Post('observar')
  @ApiOperation({ summary: 'Observar trámite con comentario obligatorio' })
  @ApiParam({
    name: 'id',
    description: 'ID del trámite',
    example: 'uuid-tramite',
  })
  @ApiBody({ type: ObservarTramiteDto })
  @ApiResponse({
    status: 200,
    description: 'Trámite observado',
    type: TramiteResponse,
  })
  @ApiResponse({ status: 403, description: 'Solo usuarios internos' })
  @ApiResponse({ status: 422, description: 'Transición no permitida' })
  async observar(
    @Param('id') id: string,
    @Body() dto: ObservarTramiteDto,
    @CurrentUser() user: { id: string; tipo: string },
  ) {
    this.soloInterno(user);
    return this.workflowUseCases.observar(id, dto, user.id);
  }

  @Post('responder-observacion')
  @ApiOperation({ summary: 'Responder observación (solo EXTERNO)' })
  @ApiParam({
    name: 'id',
    description: 'ID del trámite',
    example: 'uuid-tramite',
  })
  @ApiBody({ type: ResponderObservacionDto })
  @ApiResponse({
    status: 200,
    description: 'Observación respondida',
    type: TramiteResponse,
  })
  @ApiResponse({ status: 403, description: 'Solo usuarios externos' })
  @ApiResponse({ status: 422, description: 'Transición no permitida' })
  async responderObservacion(
    @Param('id') id: string,
    @Body() dto: ResponderObservacionDto,
    @CurrentUser() user: { id: string; tipo: string },
  ) {
    if (user.tipo !== 'EXTERNO') {
      throw new ForbiddenException(
        'Solo usuarios externos pueden responder observaciones',
      );
    }
    return this.workflowUseCases.responderObservacion(id, dto, user.id);
  }

  @Post('solicitar-intervencion-externa')
  @ApiOperation({
    summary: 'Solicitar intervención de usuario externo (solo INTERNO_EXTERNO)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del trámite',
    example: 'uuid-tramite',
  })
  @ApiBody({ type: SolicitarIntervencionExternaDto })
  @ApiResponse({
    status: 200,
    description: 'Intervención externa solicitada',
    type: TramiteResponse,
  })
  @ApiResponse({ status: 403, description: 'Solo usuarios internos' })
  @ApiResponse({ status: 422, description: 'Transición no permitida' })
  async solicitarIntervencionExterna(
    @Param('id') id: string,
    @Body() dto: SolicitarIntervencionExternaDto,
    @CurrentUser() user: { id: string; tipo: string },
  ) {
    this.soloInterno(user);
    return this.workflowUseCases.solicitarIntervencionExterna(id, dto, user.id);
  }

  @Post('responder-intervencion-externa')
  @ApiOperation({ summary: 'Responder intervención externa (solo EXTERNO)' })
  @ApiParam({
    name: 'id',
    description: 'ID del trámite',
    example: 'uuid-tramite',
  })
  @ApiBody({ type: ResponderIntervencionExternaDto })
  @ApiResponse({
    status: 200,
    description: 'Intervención externa respondida',
    type: TramiteResponse,
  })
  @ApiResponse({ status: 403, description: 'Solo usuarios externos' })
  @ApiResponse({ status: 422, description: 'Transición no permitida' })
  async responderIntervencionExterna(
    @Param('id') id: string,
    @Body() dto: ResponderIntervencionExternaDto,
    @CurrentUser() user: { id: string; tipo: string },
  ) {
    if (user.tipo !== 'EXTERNO') {
      throw new ForbiddenException(
        'Solo usuarios externos pueden responder intervenciones',
      );
    }
    return this.workflowUseCases.responderIntervencionExterna(id, dto, user.id);
  }

  @Post('aprobar')
  @ApiOperation({ summary: 'Aprobar trámite' })
  @ApiParam({
    name: 'id',
    description: 'ID del trámite',
    example: 'uuid-tramite',
  })
  @ApiBody({ type: AprobarTramiteDto })
  @ApiResponse({
    status: 200,
    description: 'Trámite aprobado',
    type: TramiteResponse,
  })
  @ApiResponse({ status: 403, description: 'Solo usuarios internos' })
  @ApiResponse({ status: 422, description: 'Transición no permitida' })
  async aprobar(
    @Param('id') id: string,
    @Body() dto: AprobarTramiteDto,
    @CurrentUser() user: { id: string; tipo: string },
  ) {
    this.soloInterno(user);
    return this.workflowUseCases.aprobar(id, dto, user.id);
  }

  @Post('rechazar')
  @ApiOperation({ summary: 'Rechazar trámite con motivo obligatorio' })
  @ApiParam({
    name: 'id',
    description: 'ID del trámite',
    example: 'uuid-tramite',
  })
  @ApiBody({ type: RechazarTramiteDto })
  @ApiResponse({
    status: 200,
    description: 'Trámite rechazado',
    type: TramiteResponse,
  })
  @ApiResponse({ status: 403, description: 'Solo usuarios internos' })
  @ApiResponse({
    status: 422,
    description: 'Transición no permitida o sin motivo',
  })
  async rechazar(
    @Param('id') id: string,
    @Body() dto: RechazarTramiteDto,
    @CurrentUser() user: { id: string; tipo: string },
  ) {
    this.soloInterno(user);
    return this.workflowUseCases.rechazar(id, dto.motivo, user.id);
  }

  @Post('cancelar')
  @ApiOperation({ summary: 'Cancelar trámite' })
  @ApiParam({
    name: 'id',
    description: 'ID del trámite',
    example: 'uuid-tramite',
  })
  @ApiResponse({
    status: 200,
    description: 'Trámite cancelado',
    type: TramiteResponse,
  })
  @ApiResponse({ status: 403, description: 'Solo usuarios internos' })
  @ApiResponse({ status: 422, description: 'Transición no permitida' })
  async cancelar(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; tipo: string },
  ) {
    this.soloInterno(user);
    return this.workflowUseCases.cancelar(id, user.id);
  }

  @Post('cerrar')
  @ApiOperation({
    summary: 'Cerrar trámite (solo desde APROBADO/RECHAZADO/CANCELADO)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del trámite',
    example: 'uuid-tramite',
  })
  @ApiResponse({
    status: 200,
    description: 'Trámite cerrado',
    type: TramiteResponse,
  })
  @ApiResponse({ status: 403, description: 'Solo usuarios internos' })
  @ApiResponse({ status: 422, description: 'Transición no permitida' })
  async cerrar(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; tipo: string },
  ) {
    this.soloInterno(user);
    return this.workflowUseCases.cerrar(id, user.id);
  }

  @Get('historial')
  @ApiOperation({ summary: 'Obtener historial de movimientos del trámite' })
  @ApiParam({
    name: 'id',
    description: 'ID del trámite',
    example: 'uuid-tramite',
  })
  @ApiResponse({
    status: 200,
    description: 'Historial de movimientos',
    type: [MovimientoResponse],
  })
  async historial(@Param('id') id: string) {
    return this.workflowUseCases.obtenerHistorial(id);
  }
}
