/// <reference types="jest" />

import { AuthUseCases } from '@application/use-cases/auth.use-cases';
import type { IUsuarioExternoRepository } from '@application/ports/usuario-externo.repository.port';
import type { IUsuarioInternoRepository } from '@application/ports/usuario-interno.repository.port';
import type { IInternalTokenSigner } from '@application/ports/auth.provider.port';
import { JwtService } from '@nestjs/jwt';
import { EstadoUsuarioExterno } from '@domain/enums';
import * as bcrypt from 'bcrypt';
import { mockRepo } from './test-helpers';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

const mockUsuarioExternoRepo = mockRepo<IUsuarioExternoRepository>({
  findById: jest.fn(),
  findByEmail: jest.fn(),
  findAll: jest.fn(),
  create: jest.fn(),
});

const mockUsuarioInternoRepo = mockRepo<IUsuarioInternoRepository>({
  findById: jest.fn(),
  findByAzureObjectId: jest.fn(),
});

const mockJwtService = mockRepo<JwtService>({
  sign: jest.fn(),
  verify: jest.fn(),
});

const mockOidcService = mockRepo<IInternalTokenSigner>({
  signInternalToken: jest.fn(),
});

describe('AuthUseCases.loginExterno()', () => {
  let useCases: AuthUseCases;

  const mockExterno = {
    id: 'ext-001',
    nombre: 'Juan Pérez',
    email: 'externo1@test.com',
    documento: '20123456789',
    organizacion: 'Empresa ABC',
    estado: EstadoUsuarioExterno.ACTIVO,
    fechaAlta: new Date(),
    passwordHash: '$2b$10$hashedpassword1234567890abcdef',
    estaActivo: () => true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useCases = new AuthUseCases(
      mockUsuarioExternoRepo,
      mockUsuarioInternoRepo,
      mockJwtService,
      mockOidcService,
    );
    mockJwtService.sign.mockReturnValue('jwt-token-123');
  });

  it('should login successfully with valid credentials', async () => {
    mockUsuarioExternoRepo.findByEmail.mockResolvedValue(mockExterno);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const result = await useCases.loginExterno({
      email: 'externo1@test.com',
      password: 'Password123!',
    });

    expect(mockUsuarioExternoRepo.findByEmail).toHaveBeenCalledWith(
      'externo1@test.com',
    );
    expect(result.token).toBe('jwt-token-123');
    expect(result.usuario.nombre).toBe('Juan Pérez');
    expect(result.usuario.email).toBe('externo1@test.com');
    expect(result.usuario.tipo).toBe('EXTERNO');
  });

  it('should throw with wrong password', async () => {
    mockUsuarioExternoRepo.findByEmail.mockResolvedValue(mockExterno);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      useCases.loginExterno({
        email: 'externo1@test.com',
        password: 'wrong',
      }),
    ).rejects.toThrow('Credenciales inválidas');
  });

  it('should throw with non-existent email', async () => {
    mockUsuarioExternoRepo.findByEmail.mockResolvedValue(null);

    await expect(
      useCases.loginExterno({
        email: 'noexiste@test.com',
        password: 'Password123!',
      }),
    ).rejects.toThrow('Credenciales inválidas');
  });

  it('should throw when user is not active', async () => {
    const pendiente = {
      ...mockExterno,
      estaActivo: () => false,
    };
    mockUsuarioExternoRepo.findByEmail.mockResolvedValue(pendiente);

    await expect(
      useCases.loginExterno({
        email: 'pendiente@test.com',
        password: 'Password123!',
      }),
    ).rejects.toThrow('Credenciales inválidas');
  });

  it('should throw when user has no passwordHash', async () => {
    const sinHash = {
      ...mockExterno,
      passwordHash: null,
      estaActivo: () => true,
    };
    mockUsuarioExternoRepo.findByEmail.mockResolvedValue(sinHash);

    await expect(
      useCases.loginExterno({
        email: 'sinhash@test.com',
        password: 'Password123!',
      }),
    ).rejects.toThrow('Credenciales inválidas');
  });
});
