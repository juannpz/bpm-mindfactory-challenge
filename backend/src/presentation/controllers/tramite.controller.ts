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
} from '@nestjs/swagger';
import { TramiteUseCases } from '@application/use-cases';
import { CrearTramiteDto, ActualizarTramiteDto } from '@application/dtos';
import { AuthGuard } from '../guards';
import { CurrentUser } from '../decorators';

@ApiTags('Trámites')
@ApiBearerAuth()
@Controller('tramites')
@UseGuards(AuthGuard)
export class TramiteController {
  constructor(private readonly tramiteUseCases: TramiteUseCases) {}

  @Get()
  @ApiOperation({ summary: 'Listar trámites con filtros' })
  @ApiQuery({ name: 'estado', required: false })
  @ApiQuery({ name: 'origen', required: false })
  @ApiQuery({ name: 'prioridad', required: false })
  @ApiQuery({ name: 'areaId', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: 200, description: 'Lista paginada de trámites' })
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
  async crear(
    @Body() dto: CrearTramiteDto,
    @CurrentUser() user: { id: string; tipo: string },
  ) {
    return this.tramiteUseCases.crear(dto, user.tipo, user.id);
  }

  @Put(':id')
  async actualizar(@Param('id') id: string, @Body() dto: ActualizarTramiteDto) {
    const result = await this.tramiteUseCases.actualizar(id, dto);
    if (!result) throw new Error('Trámite no encontrado');
    return result;
  }

  @Delete(':id')
  async eliminar(@Param('id') id: string) {
    await this.tramiteUseCases.eliminar(id);
    return { message: 'Trámite eliminado' };
  }
}
