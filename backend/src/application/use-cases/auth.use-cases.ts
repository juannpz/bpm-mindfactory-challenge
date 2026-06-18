import { Injectable, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsuarioExterno } from '@domain/entities';
import { EstadoUsuarioExterno } from '@domain/enums';
import { v4 as uuid } from 'uuid';
import * as bcrypt from 'bcrypt';
import { RegistroExternoDto, LoginExternoDto } from '../dtos';
import type { AuthResponse } from '../dtos/responses';
import {
  USUARIO_EXTERNO_REPOSITORY,
  USUARIO_INTERNO_REPOSITORY,
} from '../ports/tokens';
import type { IUsuarioExternoRepository } from '../ports/usuario-externo.repository.port';
import type { IUsuarioInternoRepository } from '../ports/usuario-interno.repository.port';
import type { IInternalTokenSigner } from '../ports/auth.provider.port';
import { INTERNAL_TOKEN_SIGNER } from '../ports/auth.provider.port';

export interface InternalLoginDto {
  azureObjectId: string;
}

@Injectable()
export class AuthUseCases {
  constructor(
    @Inject(USUARIO_EXTERNO_REPOSITORY)
    private readonly usuarioExternoRepo: IUsuarioExternoRepository,
    @Inject(USUARIO_INTERNO_REPOSITORY)
    private readonly usuarioInternoRepo: IUsuarioInternoRepository,
    private readonly jwtService: JwtService,
    @Inject(INTERNAL_TOKEN_SIGNER)
    private readonly tokenSigner: IInternalTokenSigner,
  ) {}

  async registrarExterno(dto: RegistroExternoDto): Promise<AuthResponse> {
    const existente = await this.usuarioExternoRepo.findByEmail(dto.email);
    if (existente) throw new Error('El email ya está registrado');
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const usuarioExterno = UsuarioExterno.create({
      id: uuid(),
      nombre: dto.nombre,
      email: dto.email.toLowerCase(),
      documento: dto.documento,
      organizacion: dto.organizacion,
      estado: EstadoUsuarioExterno.PENDIENTE_VERIFICACION,
      fechaAlta: new Date(),
      passwordHash,
    });
    const usuario = await this.usuarioExternoRepo.create(
      usuarioExterno as UsuarioExterno & { passwordHash: string },
    );
    const token = this.jwtService.sign({
      sub: usuario.id,
      email: usuario.email,
    });
    return {
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        tipo: 'EXTERNO',
      },
    };
  }

  async loginExterno(dto: LoginExternoDto): Promise<AuthResponse> {
    const usuario = await this.usuarioExternoRepo.findByEmail(dto.email);
    if (!usuario || !usuario.estaActivo())
      throw new Error('Credenciales inválidas');
    if (!usuario.passwordHash) throw new Error('Credenciales inválidas');
    const ok = await bcrypt.compare(dto.password, usuario.passwordHash);
    if (!ok) throw new Error('Credenciales inválidas');
    const token = this.jwtService.sign({
      sub: usuario.id,
      email: usuario.email,
    });
    return {
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        tipo: 'EXTERNO',
      },
    };
  }

  async loginInternoMock(dto: InternalLoginDto): Promise<{
    access_token: string;
    token_type: string;
    expires_in: number;
    usuario: {
      id: string;
      nombre: string;
      email: string;
      tipo: string;
      rol?: string;
      areaId?: string;
    };
  }> {
    const usuario = await this.usuarioInternoRepo.findByAzureObjectId(
      dto.azureObjectId,
    );
    if (!usuario || !usuario.activo) {
      throw new Error('Credenciales inválidas');
    }
    const expiresIn = 86400;
    const accessToken = this.tokenSigner.signInternalToken({
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      azureObjectId: usuario.azureObjectId,
      rol: usuario.rol,
      areaId: usuario.areaId,
    });
    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: expiresIn,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        tipo: 'INTERNO',
        rol: usuario.rol,
        areaId: usuario.areaId,
      },
    };
  }

  async obtenerMe(
    userId: string,
    tipo: string,
  ): Promise<{
    id: string;
    nombre: string;
    email: string;
    tipo: string;
    rol?: string;
    areaId?: string;
  } | null> {
    if (tipo === 'EXTERNO') {
      const u = await this.usuarioExternoRepo.findById(userId);
      return u
        ? { id: u.id, nombre: u.nombre, email: u.email, tipo: 'EXTERNO' }
        : null;
    }
    const u = await this.usuarioInternoRepo.findById(userId);
    return u
      ? {
          id: u.id,
          nombre: u.nombre,
          email: u.email,
          tipo: 'INTERNO',
          rol: u.rol,
          areaId: u.areaId,
        }
      : null;
  }
}
