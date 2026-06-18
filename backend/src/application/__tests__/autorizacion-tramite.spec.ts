/// <reference types="jest" />

import { TramiteUseCases } from '@application/use-cases/tramite.use-cases';
import type { ITramiteRepository } from '@application/ports/tramite.repository.port';
import type { ITipoTramiteRepository } from '@application/ports/tipo-tramite.repository.port';
import { Tramite } from '@domain/aggregates';
import { TipoTramite } from '@domain/entities';
import {
  OrigenTramite,
  EstadoTramite,
  Prioridad,
  TipoUsuario,
} from '@domain/enums';
import { SlaService } from '@domain/services';
import { mockRepo } from './test-helpers';

const mockTramiteRepo = mockRepo<ITramiteRepository>({
  create: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

const mockTipoTramiteRepo = mockRepo<ITipoTramiteRepository>({
  findById: jest.fn(),
  findAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
});

describe('TramiteUseCases.obtener() — Authorization', () => {
  let useCases: TramiteUseCases;

  const tramiteInternoInterno = Tramite.fromProps({
    id: 't-001',
    numero: 'TRAM-2026-00001',
    tipoTramiteId: 'tt-001',
    titulo: 'Trámite interno',
    descripcion: '',
    origen: OrigenTramite.INTERNO_INTERNO,
    estado: EstadoTramite.EN_REVISION,
    prioridad: Prioridad.MEDIA,
    areaActualId: 'area-001',
    usuarioAsignadoId: 'u-001',
    usuarioExternoId: null,
    creadoPorTipo: TipoUsuario.INTERNO,
    creadoPorId: 'u-admin',
    fechaCreacion: new Date(),
    fechaActualizacion: new Date(),
    fechaCierre: null,
    version: 2,
  });

  const tramiteExternoInterno = Tramite.fromProps({
    id: 't-007',
    numero: 'TRAM-2026-00007',
    tipoTramiteId: 'tt-002',
    titulo: 'Reclamo externo',
    descripcion: '',
    origen: OrigenTramite.EXTERNO_INTERNO,
    estado: EstadoTramite.OBSERVADO,
    prioridad: Prioridad.ALTA,
    areaActualId: 'area-001',
    usuarioAsignadoId: null,
    usuarioExternoId: 'ext-001',
    creadoPorTipo: TipoUsuario.EXTERNO,
    creadoPorId: 'ext-001',
    fechaCreacion: new Date(),
    fechaActualizacion: new Date(),
    fechaCierre: null,
    version: 3,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    useCases = new TramiteUseCases(mockTramiteRepo, mockTipoTramiteRepo);

    mockTipoTramiteRepo.findById.mockResolvedValue(
      TipoTramite.create({
        id: 'tt-001',
        codigo: 'TEST',
        nombre: 'Test Tipo',
        descripcion: '',
        activo: true,
        requiereExterno: false,
        permiteInicioExterno: false,
        slaHoras: 48,
        areaInicialId: 'area-001',
      }),
    );

    jest.spyOn(SlaService, 'estaVencido').mockReturnValue(false);
  });

  it('should allow ADMIN to see any tramite', async () => {
    mockTramiteRepo.findById.mockResolvedValue(tramiteInternoInterno);

    const result = await useCases.obtener('t-001', {
      id: 'u-admin',
      tipo: 'INTERNO',
      rol: 'ADMIN',
    });

    expect(result).not.toBeNull();
    expect(result!.id).toBe('t-001');
  });

  it('should allow AUDITOR to see any tramite', async () => {
    mockTramiteRepo.findById.mockResolvedValue(tramiteExternoInterno);

    const result = await useCases.obtener('t-007', {
      id: 'u-audit',
      tipo: 'INTERNO',
      rol: 'AUDITOR',
    });

    expect(result).not.toBeNull();
    expect(result!.id).toBe('t-007');
  });

  it('should restrict OPERADOR to only its area', async () => {
    mockTramiteRepo.findById.mockResolvedValue(tramiteInternoInterno);

    await expect(
      useCases.obtener('t-001', {
        id: 'u-legal',
        tipo: 'INTERNO',
        rol: 'OPERADOR',
        areaId: 'area-003', // Different area than tramite (area-001)
      }),
    ).rejects.toThrow('No tiene permiso para ver trámites de otra área');
  });

  it('should allow OPERADOR to see tramites in its own area', async () => {
    mockTramiteRepo.findById.mockResolvedValue(tramiteInternoInterno);

    const result = await useCases.obtener('t-001', {
      id: 'u-mesa',
      tipo: 'INTERNO',
      rol: 'OPERADOR',
      areaId: 'area-001', // Same area as tramite
    });

    expect(result).not.toBeNull();
    expect(result!.id).toBe('t-001');
  });

  it('should allow EXTERNO to see own tramite (by usuarioExternoId)', async () => {
    mockTramiteRepo.findById.mockResolvedValue(tramiteExternoInterno);

    const result = await useCases.obtener('t-007', {
      id: 'ext-001',
      tipo: 'EXTERNO',
    });

    expect(result).not.toBeNull();
    expect(result!.id).toBe('t-007');
  });

  it('should allow EXTERNO to see own tramite (by creadoPorId)', async () => {
    mockTramiteRepo.findById.mockResolvedValue(tramiteExternoInterno);

    const result = await useCases.obtener('t-007', {
      id: 'ext-001',
      tipo: 'EXTERNO',
    });

    expect(result).not.toBeNull();
  });

  it('should block EXTERNO from seeing another externo tramite', async () => {
    mockTramiteRepo.findById.mockResolvedValue(tramiteExternoInterno);

    await expect(
      useCases.obtener('t-007', {
        id: 'ext-002', // Different externo user
        tipo: 'EXTERNO',
      }),
    ).rejects.toThrow('No tiene permiso para ver este trámite');
  });

  it('should return null for non-existent tramite', async () => {
    mockTramiteRepo.findById.mockResolvedValue(null);

    const result = await useCases.obtener('non-existent', {
      id: 'u-admin',
      tipo: 'INTERNO',
      rol: 'ADMIN',
    });

    expect(result).toBeNull();
  });
});
