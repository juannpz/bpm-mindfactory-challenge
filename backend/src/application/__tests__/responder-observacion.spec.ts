/// <reference types="jest" />

import { WorkflowUseCases } from '@application/use-cases/workflow.use-cases';
import type { ITramiteRepository } from '@application/ports/tramite.repository.port';
import type { IMovimientoRepository } from '@application/ports/movimiento.repository.port';
import type { ITipoTramiteRepository } from '@application/ports/tipo-tramite.repository.port';
import type { IUnitOfWork } from '@application/ports/unit-of-work.port';
import { Tramite } from '@domain/aggregates';
import { TipoTramite, MovimientoTramite } from '@domain/entities';
import {
  OrigenTramite,
  EstadoTramite,
  Prioridad,
  TipoUsuario,
  AccionMovimiento,
} from '@domain/enums';
import { mockRepo } from './test-helpers';

const mockTramiteRepo = mockRepo<ITramiteRepository>({
  findById: jest.fn(),
  findAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

const mockMovimientoRepo = mockRepo<IMovimientoRepository>({
  create: jest.fn(),
  findByTramiteId: jest.fn(),
});

const mockTipoTramiteRepo = mockRepo<ITipoTramiteRepository>({
  findById: jest.fn(),
  findAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
});

const mockUow = mockRepo<IUnitOfWork>({
  runInTransaction: jest.fn(),
});

describe('WorkflowUseCases.responderObservacion()', () => {
  let useCases: WorkflowUseCases;

  const mockTramiteObservado = Tramite.fromProps({
    id: 't-001',
    numero: 'TRAM-2026-00001',
    tipoTramiteId: 'tt-001',
    titulo: 'Test',
    descripcion: '',
    origen: OrigenTramite.EXTERNO_INTERNO,
    estado: EstadoTramite.OBSERVADO,
    prioridad: Prioridad.MEDIA,
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
    useCases = new WorkflowUseCases(
      mockTramiteRepo,
      mockMovimientoRepo,
      mockTipoTramiteRepo,
      mockUow,
    );

    mockUow.runInTransaction.mockImplementation(async (fn: Function) => fn());

    mockTramiteRepo.findById.mockResolvedValue(mockTramiteObservado);
    mockTramiteRepo.update.mockImplementation((t: Tramite) =>
      Promise.resolve(t),
    );
    mockMovimientoRepo.create.mockImplementation((m: MovimientoTramite) =>
      Promise.resolve(m),
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

  it('should transition tramite from OBSERVADO to INGRESADO', async () => {
    const response = await useCases.responderObservacion(
      't-001',
      { comentario: 'Corregido' },
      'ext-001',
    );

    expect(mockUow.runInTransaction).toHaveBeenCalledTimes(1);
    expect(mockTramiteRepo.findById).toHaveBeenCalledWith('t-001');

    expect(mockTramiteRepo.update).toHaveBeenCalledTimes(1);
    const updatedTramite: Tramite = mockTramiteRepo.update.mock.calls[0][0];
    expect(updatedTramite.estado).toBe(EstadoTramite.INGRESADO);
    expect(updatedTramite.version).toBe(4);

    expect(mockMovimientoRepo.create).toHaveBeenCalledTimes(1);
    const createdMovimiento = mockMovimientoRepo.create.mock.calls[0][0];
    expect(createdMovimiento.accion).toBe(
      AccionMovimiento.RESPONDER_OBSERVACION,
    );
    expect(createdMovimiento.comentario).toBe('Corregido');

    expect(response.estado).toBe(EstadoTramite.INGRESADO);
    expect(response.id).toBe('t-001');
  });
});
