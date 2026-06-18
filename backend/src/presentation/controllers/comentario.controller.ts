import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { ComentarioUseCases } from '@application/use-cases';
import { CrearComentarioDto } from '@application/dtos';
import { ComentarioResponse } from '@application/dtos/responses';
import { AuthGuard } from '../guards';
import { CurrentUser } from '../decorators';

@ApiTags('Comentarios')
@ApiBearerAuth()
@Controller('tramites/:id/comentarios')
@UseGuards(AuthGuard)
export class ComentarioController {
  constructor(private readonly comentarioUseCases: ComentarioUseCases) {}

  @Post()
  @ApiOperation({ summary: 'Agregar comentario a un trámite' })
  @ApiParam({
    name: 'id',
    description: 'ID del trámite',
    example: 'uuid-tramite',
  })
  @ApiBody({ type: CrearComentarioDto })
  @ApiResponse({
    status: 201,
    description: 'Comentario creado',
    type: ComentarioResponse,
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async crear(
    @Param('id') tramiteId: string,
    @Body() dto: CrearComentarioDto,
    @CurrentUser() user: { id: string; tipo: string },
  ) {
    return this.comentarioUseCases.crear(tramiteId, dto, user.tipo, user.id);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar comentarios del trámite (filtrado por visibilidad)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del trámite',
    example: 'uuid-tramite',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de comentarios',
    type: [ComentarioResponse],
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async listar(
    @Param('id') tramiteId: string,
    @CurrentUser() user: { id: string; tipo: string },
  ) {
    return this.comentarioUseCases.listar(tramiteId, user.tipo);
  }
}
