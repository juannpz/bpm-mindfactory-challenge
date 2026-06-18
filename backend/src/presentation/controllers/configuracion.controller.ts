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

@Controller()
@UseGuards(AuthGuard)
export class ConfiguracionController {
  constructor(
    private readonly configUseCases: ConfiguracionUseCases,
    @Inject(USUARIO_EXTERNO_REPOSITORY)
    private readonly usuarioExternoRepo: IUsuarioExternoRepository,
  ) {}

  @Get('tipos-tramite')
  async listarTiposTramite() {
    return this.configUseCases.listarTiposTramite();
  }

  @Post('tipos-tramite')
  @UseGuards(InternalAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async crearTipoTramite(@Body() dto: CrearTipoTramiteDto) {
    return this.configUseCases.crearTipoTramite(dto);
  }

  @Put('tipos-tramite/:id')
  @UseGuards(InternalAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async actualizarTipoTramite(
    @Param('id') id: string,
    @Body() dto: Partial<CrearTipoTramiteDto>,
  ) {
    return this.configUseCases.actualizarTipoTramite(id, dto);
  }

  @Get('areas')
  async listarAreas() {
    return this.configUseCases.listarAreas();
  }

  @Post('areas')
  @UseGuards(InternalAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async crearArea(@Body() dto: CrearAreaDto) {
    return this.configUseCases.crearArea(dto);
  }

  @Put('areas/:id')
  @UseGuards(InternalAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async actualizarArea(
    @Param('id') id: string,
    @Body() dto: ActualizarAreaDto,
  ) {
    return this.configUseCases.actualizarArea(id, dto);
  }

  @Get('usuarios-externos')
  @UseGuards(InternalAuthGuard)
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
