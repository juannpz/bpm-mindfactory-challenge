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

describe('TramiteUseCases.listar() - SLA vencido', () => {
  let useCases: TramiteUseCases;

  beforeEach(() => {
    jest.clearAllMocks();
    useCases = new TramiteUseCases(mockTramiteRepo, mockTipoTramiteRepo);
  });

  it('should return slaVencido: true when SLA has expired', async () => {
    const hace48Horas = new Date(Date.now() - 49 * 60 * 60 * 1000);

    const tramite = Tramite.fromProps({
      id: 't-001',
      numero: 'TRAM-2026-00001',
      tipoTramiteId: 'tt-001',
      titulo: 'Test',
      descripcion: '',
      origen: OrigenTramite.INTERNO_INTERNO,
      estado: EstadoTramite.INGRESADO,
      prioridad: Prioridad.MEDIA,
      areaActualId: 'area-001',
      usuarioAsignadoId: null,
      usuarioExternoId: null,
      creadoPorTipo: TipoUsuario.INTERNO,
      creadoPorId: 'u-creator',
      fechaCreacion: hace48Horas,
      fechaActualizacion: hace48Horas,
      fechaCierre: null,
      version: 1,
    });

    mockTramiteRepo.findAll.mockResolvedValue({ data: [tramite], total: 1 });
    mockTipoTramiteRepo.findById.mockResolvedValue(
      TipoTramite.create({
        id: 'tt-001',
        codigo: 'TEST',
        nombre: 'Test Tipo',
        descripcion: 'Tipo de prueba',
        activo: true,
        requiereExterno: false,
        permiteInicioExterno: false,
        slaHoras: 24,
        areaInicialId: 'area-001',
      }),
    );

    const response = await useCases.listar({});

    expect(mockTramiteRepo.findAll).toHaveBeenCalledTimes(1);
    expect(mockTipoTramiteRepo.findById).toHaveBeenCalledWith('tt-001');

    expect(response.data.length).toBe(1);
    expect(response.data[0].slaVencido).toBe(true);
    expect(response.data[0].id).toBe('t-001');
  });

  it('should return slaVencido: false when SLA has not expired', async () => {
    const hace5Min = new Date(Date.now() - 5 * 60 * 1000);

    const tramite = Tramite.fromProps({
      id: 't-002',
      numero: 'TRAM-2026-00002',
      tipoTramiteId: 'tt-001',
      titulo: 'Test',
      descripcion: '',
      origen: OrigenTramite.INTERNO_INTERNO,
      estado: EstadoTramite.INGRESADO,
      prioridad: Prioridad.MEDIA,
      areaActualId: 'area-001',
      usuarioAsignadoId: null,
      usuarioExternoId: null,
      creadoPorTipo: TipoUsuario.INTERNO,
      creadoPorId: 'u-creator',
      fechaCreacion: hace5Min,
      fechaActualizacion: hace5Min,
      fechaCierre: null,
      version: 1,
    });

    mockTramiteRepo.findAll.mockResolvedValue({ data: [tramite], total: 1 });
    mockTipoTramiteRepo.findById.mockResolvedValue(
      TipoTramite.create({
        id: 'tt-001',
        codigo: 'TEST',
        nombre: 'Test Tipo',
        descripcion: 'Tipo de prueba',
        activo: true,
        requiereExterno: false,
        permiteInicioExterno: false,
        slaHoras: 24,
        areaInicialId: 'area-001',
      }),
    );

    const response = await useCases.listar({});

    expect(response.data[0].slaVencido).toBe(false);
  });
});
