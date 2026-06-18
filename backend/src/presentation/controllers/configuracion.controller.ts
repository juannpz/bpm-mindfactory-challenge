import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Inject,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { ConfiguracionUseCases } from '@application/use-cases';
import {
  CrearTipoTramiteDto,
  CrearAreaDto,
  ActualizarAreaDto,
} from '@application/dtos';
import { AuthGuard } from '../guards/auth.guard';
import { InternalAuthGuard, RolesGuard } from '../guards';
import { Roles } from '../decorators';
import { USUARIO_EXTERNO_REPOSITORY } from '@application/ports/tokens';
import type { IUsuarioExternoRepository } from '@application/ports/usuario-externo.repository.port';

@ApiTags('Configuración')
@ApiBearerAuth()
@Controller()
@UseGuards(AuthGuard)
export class ConfiguracionController {
  constructor(
    private readonly configUseCases: ConfiguracionUseCases,
    @Inject(USUARIO_EXTERNO_REPOSITORY)
    private readonly usuarioExternoRepo: IUsuarioExternoRepository,
  ) {}

  @Get('tipos-tramite')
  @ApiOperation({ summary: 'Listar todos los tipos de trámite' })
  @ApiResponse({ status: 200, description: 'Lista de tipos de trámite' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async listarTiposTramite() {
    return this.configUseCases.listarTiposTramite();
  }

  @Post('tipos-tramite')
  @UseGuards(InternalAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Crear un nuevo tipo de trámite (ADMIN)' })
  @ApiBody({ type: CrearTipoTramiteDto })
  @ApiResponse({ status: 201, description: 'Tipo de trámite creado' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Solo ADMIN' })
  @ApiResponse({ status: 422, description: 'Datos inválidos' })
  async crearTipoTramite(@Body() dto: CrearTipoTramiteDto) {
    return this.configUseCases.crearTipoTramite(dto);
  }

  @Put('tipos-tramite/:id')
  @UseGuards(InternalAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Actualizar un tipo de trámite (ADMIN)' })
  @ApiParam({
    name: 'id',
    description: 'ID del tipo de trámite',
    example: 'uuid-tipo',
  })
  @ApiBody({ type: CrearTipoTramiteDto })
  @ApiResponse({ status: 200, description: 'Tipo de trámite actualizado' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Solo ADMIN' })
  @ApiResponse({ status: 404, description: 'Tipo de trámite no encontrado' })
  async actualizarTipoTramite(
    @Param('id') id: string,
    @Body() dto: Partial<CrearTipoTramiteDto>,
  ) {
    return this.configUseCases.actualizarTipoTramite(id, dto);
  }

  @Get('areas')
  @ApiOperation({ summary: 'Listar todas las áreas' })
  @ApiResponse({ status: 200, description: 'Lista de áreas' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async listarAreas() {
    return this.configUseCases.listarAreas();
  }

  @Post('areas')
  @UseGuards(InternalAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Crear una nueva área (ADMIN)' })
  @ApiBody({ type: CrearAreaDto })
  @ApiResponse({ status: 201, description: 'Área creada' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Solo ADMIN' })
  @ApiResponse({ status: 422, description: 'Datos inválidos' })
  async crearArea(@Body() dto: CrearAreaDto) {
    return this.configUseCases.crearArea(dto);
  }

  @Put('areas/:id')
  @UseGuards(InternalAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Actualizar un área (ADMIN)' })
  @ApiParam({ name: 'id', description: 'ID del área', example: 'uuid-area' })
  @ApiBody({ type: ActualizarAreaDto })
  @ApiResponse({ status: 200, description: 'Área actualizada' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Solo ADMIN' })
  @ApiResponse({ status: 404, description: 'Área no encontrada' })
  async actualizarArea(
    @Param('id') id: string,
    @Body() dto: ActualizarAreaDto,
  ) {
    return this.configUseCases.actualizarArea(id, dto);
  }

  @Get('usuarios-externos')
  @UseGuards(InternalAuthGuard)
  @ApiOperation({ summary: 'Listar usuarios externos (INTERNO)' })
  @ApiResponse({ status: 200, description: 'Lista de usuarios externos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Solo usuarios internos' })
  async listarUsuariosExternos() {
    const usuarios = await this.usuarioExternoRepo.findAll();
    return usuarios.map((u) => ({
      id: u.id,
      nombre: u.nombre,
      email: u.email,
      documento: u.documento,
      organizacion: u.organizacion,
      estado: u.estado,
    }));
  }
}
