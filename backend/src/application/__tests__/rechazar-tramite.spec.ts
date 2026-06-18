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

describe('WorkflowUseCases.rechazar()', () => {
  let useCases: WorkflowUseCases;

  const mockTramiteEnRevision = Tramite.fromProps({
    id: 't-002',
    numero: 'TRAM-2026-00002',
    tipoTramiteId: 'tt-001',
    titulo: 'Trámite a rechazar',
    descripcion: '',
    origen: OrigenTramite.INTERNO_INTERNO,
    estado: EstadoTramite.EN_REVISION,
    prioridad: Prioridad.MEDIA,
    areaActualId: 'area-001',
    usuarioAsignadoId: 'u-001',
    usuarioExternoId: null,
    creadoPorTipo: TipoUsuario.INTERNO,
    creadoPorId: 'u-creator',
    fechaCreacion: new Date(),
    fechaActualizacion: new Date(),
    fechaCierre: null,
    version: 2,
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

    mockTramiteRepo.findById.mockResolvedValue(mockTramiteEnRevision);
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
        requiereExterno: false,
        permiteInicioExterno: false,
        slaHoras: 48,
        areaInicialId: 'area-001',
      }),
    );
  });

  it('should transition tramite to RECHAZADO with motivo', async () => {
    const motivo = 'No cumple con los requisitos mínimos';
    const response = await useCases.rechazar('t-002', motivo, 'u-001');

    expect(mockUow.runInTransaction).toHaveBeenCalledTimes(1);
    expect(mockTramiteRepo.findById).toHaveBeenCalledWith('t-002');

    expect(mockTramiteRepo.update).toHaveBeenCalledTimes(1);
    const updatedTramite: Tramite = mockTramiteRepo.update.mock.calls[0][0];
    expect(updatedTramite.estado).toBe(EstadoTramite.RECHAZADO);
    expect(updatedTramite.version).toBe(3);

    expect(mockMovimientoRepo.create).toHaveBeenCalledTimes(1);
    const createdMovimiento = mockMovimientoRepo.create.mock.calls[0][0];
    expect(createdMovimiento.accion).toBe(AccionMovimiento.RECHAZAR);
    expect(createdMovimiento.comentario).toBe(motivo);

    expect(response.estado).toBe(EstadoTramite.RECHAZADO);
    expect(response.id).toBe('t-002');
  });

  it('should pass an empty motivo if provided as empty string', async () => {
    await useCases.rechazar('t-002', '', 'u-001');

    const createdMovimiento = mockMovimientoRepo.create.mock.calls[0][0];
    expect(createdMovimiento.accion).toBe(AccionMovimiento.RECHAZAR);
    expect(createdMovimiento.comentario).toBe('');
  });
});
