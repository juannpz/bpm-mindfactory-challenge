import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { TramiteUseCases } from '@application/use-cases';
import { CrearTramiteDto, ActualizarTramiteDto } from '@application/dtos';
import {
  TramiteResponse,
  TramiteListResponse,
} from '@application/dtos/responses';
import { AuthGuard } from '../guards';
import { CurrentUser } from '../decorators';

@ApiTags('Trámites')
@ApiBearerAuth()
@Controller('tramites')
@UseGuards(AuthGuard)
export class TramiteController {
  constructor(private readonly tramiteUseCases: TramiteUseCases) {}

  @Get()
  @ApiOperation({ summary: 'Listar trámites con filtros y paginación' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Número de página',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Resultados por página',
    example: 20,
  })
  @ApiQuery({
    name: 'estado',
    required: false,
    description: 'Filtrar por estado',
    example: 'EN_REVISION',
  })
  @ApiQuery({
    name: 'origen',
    required: false,
    description: 'Filtrar por origen',
    example: 'INTERNO_INTERNO',
  })
  @ApiQuery({
    name: 'prioridad',
    required: false,
    description: 'Filtrar por prioridad',
    example: 'ALTA',
  })
  @ApiQuery({
    name: 'areaId',
    required: false,
    description: 'Filtrar por área',
    example: 'uuid-area',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Búsqueda por texto en título/descripción',
    example: 'contrato',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de trámites',
    type: TramiteListResponse,
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'No autorizado' })
  async listar(
    @CurrentUser()
    user: { id: string; tipo: string; rol?: string; areaId?: string },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('estado') estado?: string,
    @Query('origen') origen?: string,
    @Query('prioridad') prioridad?: string,
    @Query('areaId') areaId?: string,
    @Query('search') search?: string,
  ) {
    return this.tramiteUseCases.listar({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      estado,
      origen,
      prioridad,
      areaId,
      search,
      usuarioExternoId: user.tipo === 'EXTERNO' ? user.id : undefined,
      creadoPorExternoId: user.tipo === 'EXTERNO' ? user.id : undefined,
      areaOperadorId: user.areaId,
      rolUsuario: user.rol,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de un trámite' })
  @ApiParam({
    name: 'id',
    description: 'ID del trámite',
    example: 'uuid-tramite',
  })
  @ApiResponse({
    status: 200,
    description: 'Detalle del trámite',
    type: TramiteResponse,
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Trámite no encontrado' })
  async obtener(
    @Param('id') id: string,
    @CurrentUser()
    user: { id: string; tipo: string; rol?: string; areaId?: string },
  ) {
    const result = await this.tramiteUseCases.obtener(id, user);
    if (!result) throw new Error('Trámite no encontrado');
    return result;
  }

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo trámite' })
  @ApiBody({ type: CrearTramiteDto })
  @ApiResponse({
    status: 201,
    description: 'Trámite creado',
    type: TramiteResponse,
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({
    status: 422,
    description: 'Datos inválidos o regla de negocio violada',
  })
  async crear(
    @Body() dto: CrearTramiteDto,
    @CurrentUser() user: { id: string; tipo: string },
  ) {
    return this.tramiteUseCases.crear(dto, user.tipo, user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar trámite (solo en BORRADOR)' })
  @ApiParam({
    name: 'id',
    description: 'ID del trámite',
    example: 'uuid-tramite',
  })
  @ApiBody({ type: ActualizarTramiteDto })
  @ApiResponse({
    status: 200,
    description: 'Trámite actualizado',
    type: TramiteResponse,
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'Trámite no encontrado' })
  @ApiResponse({
    status: 422,
    description: 'Solo trámites en BORRADOR pueden editarse',
  })
  async actualizar(@Param('id') id: string, @Body() dto: ActualizarTramiteDto) {
    const result = await this.tramiteUseCases.actualizar(id, dto);
    if (!result) throw new Error('Trámite no encontrado');
    return result;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar trámite (solo en BORRADOR)' })
  @ApiParam({
    name: 'id',
    description: 'ID del trámite',
    example: 'uuid-tramite',
  })
  @ApiResponse({ status: 200, description: 'Trámite eliminado' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'Trámite no encontrado' })
  @ApiResponse({
    status: 422,
    description: 'Solo trámites en BORRADOR pueden eliminarse',
  })
  async eliminar(@Param('id') id: string) {
    await this.tramiteUseCases.eliminar(id);
    return { message: 'Trámite eliminado' };
  }
}
