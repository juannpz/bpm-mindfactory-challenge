import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthUseCases, type InternalLoginDto } from '@application/use-cases';
import { RegistroExternoDto, LoginExternoDto } from '@application/dtos';
import { Public } from '../decorators';
import { AuthGuard, InternalAuthGuard } from '../guards';
import { CurrentUser } from '../decorators';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authUseCases: AuthUseCases) {}

  @Public()
  @Post('external/register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar usuario externo' })
  @ApiBody({ type: RegistroExternoDto })
  @ApiResponse({ status: 201, description: 'Usuario registrado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  async register(@Body() dto: RegistroExternoDto) {
    return this.authUseCases.registrarExterno(dto);
  }

  @Public()
  @Post('external/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login de usuario externo' })
  @ApiBody({ type: LoginExternoDto })
  @ApiResponse({ status: 200, description: 'Login exitoso, retorna JWT' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  async login(@Body() dto: LoginExternoDto) {
    return this.authUseCases.loginExterno(dto);
  }

  @Public()
  @Post('external/logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout de usuario externo' })
  @ApiResponse({ status: 200, description: 'Logout exitoso' })
  logout() {
    return { message: 'Logout exitoso' };
  }

  @Public()
  @Post('internal/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login de usuario interno (mock OIDC emulado)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { azureObjectId: { type: 'string' } },
      required: ['azureObjectId'],
    },
  })
  @ApiResponse({ status: 200, description: 'Login exitoso, retorna JWT' })
  @ApiResponse({ status: 401, description: 'Usuario no encontrado o inactivo' })
  async internalLogin(@Body() dto: InternalLoginDto) {
    return this.authUseCases.loginInternoMock(dto);
  }

  @UseGuards(AuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener datos del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Datos del usuario' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async me(@CurrentUser() user: { id: string; tipo: string }) {
    return this.authUseCases.obtenerMe(user.id, user.tipo);
  }

  @UseGuards(InternalAuthGuard)
  @Get('internal/me')
  @ApiOperation({ summary: 'Obtener datos del usuario interno autenticado' })
  @ApiResponse({ status: 200, description: 'Datos del usuario interno' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Acceso externo no permitido' })
  async internalMe(@CurrentUser() user: { id: string; tipo: string }) {
    return this.authUseCases.obtenerMe(user.id, user.tipo);
  }
}
