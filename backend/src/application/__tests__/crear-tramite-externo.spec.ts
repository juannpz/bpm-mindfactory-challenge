/// <reference types="jest" />

import { TramiteUseCases } from '@application/use-cases/tramite.use-cases';
import type { ITramiteRepository } from '@application/ports/tramite.repository.port';
import type { ITipoTramiteRepository } from '@application/ports/tipo-tramite.repository.port';
import type { IMovimientoRepository } from '@application/ports/movimiento.repository.port';
import { Tramite } from '@domain/aggregates';
import { TipoTramite } from '@domain/entities';
import { OrigenTramite, Prioridad, TipoUsuario } from '@domain/enums';
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

const mockMovimientoRepo = mockRepo<IMovimientoRepository>({
  create: jest.fn(),
  findByTramiteId: jest.fn(),
});

describe('TramiteUseCases.crear() - EXTERNO_INTERNO', () => {
  let useCases: TramiteUseCases;

  beforeEach(() => {
    jest.clearAllMocks();
    useCases = new TramiteUseCases(
      mockTramiteRepo,
      mockTipoTramiteRepo,
      mockMovimientoRepo,
    );

    mockTramiteRepo.create.mockImplementation((tramite: Tramite) =>
      Promise.resolve(tramite),
    );
    mockTipoTramiteRepo.findById.mockResolvedValue(
      TipoTramite.create({
        id: 'tt-001',
        codigo: 'TEST',
        nombre: 'Test Tipo',
        descripcion: 'Tipo de prueba',
        activo: true,
        requiereExterno: true,
        permiteInicioExterno: true,
        slaHoras: 48,
        areaInicialId: 'area-001',
      }),
    );
  });

  it('should create a tramite with origen EXTERNO_INTERNO', async () => {
    const dto = {
      tipoTramiteId: 'tt-001',
      titulo: 'Trámite desde externo',
      descripcion: 'Iniciado por usuario externo',
      prioridad: Prioridad.ALTA,
      origen: OrigenTramite.EXTERNO_INTERNO,
      usuarioExternoId: 'ext-001',
    };

    const response = await useCases.crear(dto, TipoUsuario.EXTERNO, 'ext-001');

    expect(mockTramiteRepo.create).toHaveBeenCalledTimes(1);

    const createdTramite: Tramite = mockTramiteRepo.create.mock.calls[0][0];
    expect(createdTramite.origen).toBe(OrigenTramite.EXTERNO_INTERNO);

    expect(response.origen).toBe(OrigenTramite.EXTERNO_INTERNO);
    expect(response.titulo).toBe('Trámite desde externo');
    expect(response.prioridad).toBe(Prioridad.ALTA);
  });
});
