/// <reference types="jest" />

import { WorkflowUseCases } from '@application/use-cases/workflow.use-cases';
import type { ITramiteRepository } from '@application/ports/tramite.repository.port';
import type { IMovimientoRepository } from '@application/ports/movimiento.repository.port';
import type { ITipoTramiteRepository } from '@application/ports/tipo-tramite.repository.port';
import type { IUnitOfWork } from '@application/ports/unit-of-work.port';
import { AccionMovimiento, EstadoTramite, TipoUsuario } from '@domain/enums';
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

describe('WorkflowUseCases.obtenerHistorial()', () => {
  let useCases: WorkflowUseCases;

  const movimientosSeed = [
    {
      id: 'm-001',
      tramiteId: 't-001',
      estadoAnterior: null,
      estadoNuevo: EstadoTramite.BORRADOR,
      areaAnteriorId: null,
      areaNuevaId: 'area-001',
      usuarioTipo: TipoUsuario.EXTERNO,
      usuarioId: 'ext-001',
      accion: AccionMovimiento.CREAR,
      comentario: null,
      fecha: new Date('2026-06-13T10:00:00Z'),
    },
    {
      id: 'm-002',
      tramiteId: 't-001',
      estadoAnterior: EstadoTramite.BORRADOR,
      estadoNuevo: EstadoTramite.INGRESADO,
      areaAnteriorId: 'area-001',
      areaNuevaId: 'area-001',
      usuarioTipo: TipoUsuario.INTERNO,
      usuarioId: 'u-001',
      accion: AccionMovimiento.INGRESAR,
      comentario: 'Documentación completa',
      fecha: new Date('2026-06-14T15:00:00Z'),
    },
    {
      id: 'm-003',
      tramiteId: 't-001',
      estadoAnterior: EstadoTramite.INGRESADO,
      estadoNuevo: EstadoTramite.EN_REVISION,
      areaAnteriorId: 'area-001',
      areaNuevaId: 'area-001',
      usuarioTipo: TipoUsuario.INTERNO,
      usuarioId: 'u-002',
      accion: AccionMovimiento.TOMAR,
      comentario: null,
      fecha: new Date('2026-06-14T16:00:00Z'),
    },
    {
      id: 'm-004',
      tramiteId: 't-001',
      estadoAnterior: EstadoTramite.EN_REVISION,
      estadoNuevo: EstadoTramite.APROBADO,
      areaAnteriorId: 'area-001',
      areaNuevaId: 'area-001',
      usuarioTipo: TipoUsuario.INTERNO,
      usuarioId: 'u-002',
      accion: AccionMovimiento.APROBAR,
      comentario: 'Todo correcto',
      fecha: new Date('2026-06-15T10:00:00Z'),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    useCases = new WorkflowUseCases(
      mockTramiteRepo,
      mockMovimientoRepo,
      mockTipoTramiteRepo,
      mockUow,
    );
  });

  it('should return all movements for a tramite in chronological order', async () => {
    mockMovimientoRepo.findByTramiteId.mockResolvedValue(movimientosSeed);

    const result = await useCases.obtenerHistorial('t-001');

    expect(mockMovimientoRepo.findByTramiteId).toHaveBeenCalledWith('t-001');
    expect(result).toHaveLength(4);
    expect(result[0].accion).toBe(AccionMovimiento.CREAR);
    expect(result[1].accion).toBe(AccionMovimiento.INGRESAR);
    expect(result[2].accion).toBe(AccionMovimiento.TOMAR);
    expect(result[3].accion).toBe(AccionMovimiento.APROBAR);

    // Verify estado transitions are properly recorded
    expect(result[1].estadoAnterior).toBe('BORRADOR');
    expect(result[1].estadoNuevo).toBe('INGRESADO');
    expect(result[3].estadoNuevo).toBe('APROBADO');
  });

  it('should return empty array when tramite has no movements', async () => {
    mockMovimientoRepo.findByTramiteId.mockResolvedValue([]);

    const result = await useCases.obtenerHistorial('t-nonexistent');

    expect(result).toEqual([]);
  });
});
