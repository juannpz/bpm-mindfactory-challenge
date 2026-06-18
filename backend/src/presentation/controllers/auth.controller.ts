import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthUseCases } from '@application/use-cases';
import {
  RegistroExternoDto,
  LoginExternoDto,
  InternalLoginDto,
  MagicLinkRequestDto,
  MagicLinkVerifyDto,
} from '@application/dtos';
import { AuthResponse } from '@application/dtos/responses';
import { MagicTokenService } from '@infrastructure/auth/magic-token.service';
import { EmailService } from '@infrastructure/auth/email.service';
import { Public } from '../decorators';
import { AuthGuard, InternalAuthGuard } from '../guards';
import { CurrentUser } from '../decorators';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authUseCases: AuthUseCases,
    private readonly magicTokenService: MagicTokenService,
    private readonly emailService: EmailService,
  ) {}

  @Public()
  @Post('external/register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar usuario externo' })
  @ApiBody({ type: RegistroExternoDto })
  @ApiResponse({
    status: 201,
    description: 'Usuario registrado exitosamente',
    type: AuthResponse,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  async register(@Body() dto: RegistroExternoDto) {
    return this.authUseCases.registrarExterno(dto);
  }

  @Public()
  @Post('external/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login de usuario externo con email y contraseña' })
  @ApiBody({ type: LoginExternoDto })
  @ApiResponse({
    status: 200,
    description: 'Login exitoso, retorna JWT',
    type: AuthResponse,
  })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  async login(@Body() dto: LoginExternoDto) {
    return this.authUseCases.loginExterno(dto);
  }

  @Public()
  @Post('external/magic-link/request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Solicitar magic link para inicio de sesión sin contraseña',
  })
  @ApiBody({ type: MagicLinkRequestDto })
  @ApiResponse({ status: 200, description: 'Magic link enviado al email' })
  @ApiResponse({ status: 400, description: 'Email inválido' })
  async requestMagicLink(@Body() dto: MagicLinkRequestDto) {
    const usuario = await this.authUseCases.buscarExternoPorEmail(dto.email);
    if (!usuario) {
      return {
        message: 'Si el email está registrado, recibirás un enlace de acceso',
      };
    }

    const token = this.magicTokenService.generate(dto.email);
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    const magicLink = `${frontendUrl}/externo/magic-link?token=${encodeURIComponent(token)}`;

    const { sent } = await this.emailService.sendMagicLink(
      dto.email,
      magicLink,
      usuario.nombre,
    );

    return {
      message: 'Si el email está registrado, recibirás un enlace de acceso',
      devLink: sent ? undefined : magicLink,
    };
  }

  @Public()
  @Post('external/magic-link/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verificar token de magic link e iniciar sesión' })
  @ApiBody({ type: MagicLinkVerifyDto })
  @ApiResponse({
    status: 200,
    description: 'Inicio de sesión exitoso, retorna JWT',
    type: AuthResponse,
  })
  @ApiResponse({ status: 401, description: 'Token inválido o expirado' })
  async verifyMagicLink(@Body() dto: MagicLinkVerifyDto) {
    const email = this.magicTokenService.validate(dto.token);
    if (!email) {
      throw new BadRequestException('Token inválido o expirado');
    }

    return this.authUseCases.loginExternoPorEmail(email);
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
  @ApiBody({ type: InternalLoginDto })
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
