import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ComentarioUseCases } from '@application/use-cases';
import { CrearComentarioDto } from '@application/dtos';
import { AuthGuard } from '../guards';
import { CurrentUser } from '../decorators';

@Controller('tramites/:id/comentarios')
@UseGuards(AuthGuard)
export class ComentarioController {
  constructor(private readonly comentarioUseCases: ComentarioUseCases) {}

  @Post()
  async crear(
    @Param('id') tramiteId: string,
    @Body() dto: CrearComentarioDto,
    @CurrentUser() user: { id: string; tipo: string },
  ) {
    return this.comentarioUseCases.crear(tramiteId, dto, user.tipo, user.id);
  }

  @Get()
  async listar(
    @Param('id') tramiteId: string,
    @CurrentUser() user: { id: string; tipo: string },
  ) {
    return this.comentarioUseCases.listar(tramiteId, user.tipo);
  }
}
