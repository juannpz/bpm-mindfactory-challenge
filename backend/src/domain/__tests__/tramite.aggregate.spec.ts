/// <reference types="jest" />

import { Tramite } from '@domain/aggregates/tramite.aggregate';
import { OrigenTramite } from '@domain/enums/origen-tramite.enum';
import { EstadoTramite } from '@domain/enums/estado-tramite.enum';
import { Prioridad } from '@domain/enums/prioridad.enum';
import { TipoUsuario } from '@domain/enums/tipo-usuario.enum';
import { AccionMovimiento } from '@domain/enums/accion-movimiento.enum';

const commonProps = {
  id: 't-001',
  tipoTramiteId: 'tt-001',
  titulo: 'Test Tramite',
  descripcion: 'Descripcion de prueba',
  origen: OrigenTramite.INTERNO_INTERNO,
  prioridad: Prioridad.MEDIA,
  areaActualId: 'area-001',
  usuarioAsignadoId: null,
  usuarioExternoId: null,
  creadoPorTipo: TipoUsuario.INTERNO,
  creadoPorId: 'u-001',
};

function crearTramite(overrides = {}) {
  return Tramite.create({
    ...commonProps,
    ...overrides,
    anio: 2026,
    secuencial: 1,
  });
}

function tramiteEnEstado(
  origen: OrigenTramite,
  estado: EstadoTramite,
  overrides = {},
) {
  const props = {
    ...commonProps,
    origen,
    estado,
    id: `t-${estado.toLowerCase()}`,
    numero: `TRAM-2026-00001`,
    fechaCreacion: new Date(),
    fechaActualizacion: new Date(),
    fechaCierre: null,
    version: 1,
    ...overrides,
  };
  return Tramite.fromProps(props);
}

describe('Tramite Aggregate', () => {
  describe('create', () => {
    it('should create a tramite in BORRADOR state with version 1', () => {
      const { tramite, movimiento } = crearTramite();
      expect(tramite.estado).toBe(EstadoTramite.BORRADOR);
      expect(tramite.numero).toMatch(/^TRAM-\d{4}-\d{5}$/);
      expect(tramite.version).toBe(1);
      expect(movimiento.accion).toBe(AccionMovimiento.CREAR);
      expect(movimiento.estadoAnterior).toBeNull();
      expect(movimiento.estadoNuevo).toBe(EstadoTramite.BORRADOR);
    });
  });

  describe('INTERNO_INTERNO workflow', () => {
    const origen = OrigenTramite.INTERNO_INTERNO;

    it('BORRADOR → INGRESADO', () => {
      const t = tramiteEnEstado(origen, EstadoTramite.BORRADOR);
      const result = t.ingresar('u-001', 'area-001');
      expect(result.tramite.estado).toBe(EstadoTramite.INGRESADO);
      expect(result.movimiento.accion).toBe(AccionMovimiento.INGRESAR);
    });

    it('INGRESADO → EN_REVISION via tomar', () => {
      const t = tramiteEnEstado(origen, EstadoTramite.INGRESADO);
      const result = t.tomar('u-001', 'area-001');
      expect(result.tramite.estado).toBe(EstadoTramite.EN_REVISION);
      expect(result.tramite.usuarioAsignadoId).toBe('u-001');
    });

    it('EN_REVISION → OBSERVADO via observar', () => {
      const t = tramiteEnEstado(origen, EstadoTramite.EN_REVISION);
      const result = t.observar('Necesita correcciones', 'u-001');
      expect(result.tramite.estado).toBe(EstadoTramite.OBSERVADO);
    });

    it('EN_REVISION → APROBADO', () => {
      const t = tramiteEnEstado(origen, EstadoTramite.EN_REVISION);
      const result = t.aprobar('u-001');
      expect(result.tramite.estado).toBe(EstadoTramite.APROBADO);
      expect(result.movimiento.accion).toBe(AccionMovimiento.APROBAR);
    });

    it('EN_REVISION → RECHAZADO', () => {
      const t = tramiteEnEstado(origen, EstadoTramite.EN_REVISION);
      const result = t.rechazar('u-001', 'No cumple requisitos');
      expect(result.tramite.estado).toBe(EstadoTramite.RECHAZADO);
      expect(result.movimiento.accion).toBe(AccionMovimiento.RECHAZAR);
    });

    it('APROBADO → CERRADO', () => {
      const t = tramiteEnEstado(origen, EstadoTramite.APROBADO);
      const result = t.cerrar('u-001');
      expect(result.tramite.estado).toBe(EstadoTramite.CERRADO);
    });

    it('should allow DERIVAR from EN_REVISION', () => {
      const t = tramiteEnEstado(origen, EstadoTramite.EN_REVISION);
      const result = t.derivar('area-002', 'u-001');
      expect(result.tramite.estado).toBe(EstadoTramite.EN_REVISION);
      expect(result.tramite.areaActualId).toBe('area-002');
    });

    it('should not allow DERIVAR from non-INTERNO_INTERNO origin', () => {
      const t = tramiteEnEstado(
        OrigenTramite.INTERNO_EXTERNO,
        EstadoTramite.EN_REVISION,
      );
      expect(() => t.derivar('area-002', 'u-001')).toThrow();
    });

    it('should increment version on every transition', () => {
      const t = tramiteEnEstado(origen, EstadoTramite.BORRADOR, { version: 1 });
      const r1 = t.ingresar('u-001', 'area-001');
      expect(r1.tramite.version).toBe(2);
      const r2 = r1.tramite.tomar('u-001', 'area-001');
      expect(r2.tramite.version).toBe(3);
    });

    describe('CANCELAR from various states', () => {
      const cancelableStates = [
        EstadoTramite.BORRADOR,
        EstadoTramite.INGRESADO,
        EstadoTramite.EN_REVISION,
        EstadoTramite.OBSERVADO,
      ];

      cancelableStates.forEach((estado) => {
        it(`should cancel from ${estado}`, () => {
          const t = tramiteEnEstado(origen, estado);
          const result = t.cancelar('u-001');
          expect(result.tramite.estado).toBe(EstadoTramite.CANCELADO);
        });
      });
    });

    it('should not cancel from CERRADO', () => {
      const t = tramiteEnEstado(origen, EstadoTramite.CERRADO);
      expect(() => t.cancelar('u-001')).toThrow();
    });
  });

  describe('INTERNO_EXTERNO workflow', () => {
    const origen = OrigenTramite.INTERNO_EXTERNO;

    it('INGRESADO → ESPERANDO_EXTERNO', () => {
      const t = tramiteEnEstado(origen, EstadoTramite.INGRESADO);
      const result = t.solicitarIntervencionExterna(
        'ext-001',
        'u-001',
        'Requerimiento',
      );
      expect(result.tramite.estado).toBe(EstadoTramite.ESPERANDO_EXTERNO);
      expect(result.movimiento.accion).toBe(
        AccionMovimiento.SOLICITAR_INTERVENCION_EXTERNA,
      );
    });

    it('EN_REVISION → ESPERANDO_EXTERNO', () => {
      const t = tramiteEnEstado(origen, EstadoTramite.EN_REVISION);
      const result = t.solicitarIntervencionExterna('ext-001', 'u-001');
      expect(result.tramite.estado).toBe(EstadoTramite.ESPERANDO_EXTERNO);
    });

    it('ESPERANDO_EXTERNO → ESPERANDO_INTERNO', () => {
      const t = tramiteEnEstado(origen, EstadoTramite.ESPERANDO_EXTERNO);
      const result = t.responderIntervencionExterna(
        'ext-001',
        'Documentación adjunta',
      );
      expect(result.tramite.estado).toBe(EstadoTramite.ESPERANDO_INTERNO);
    });

    it('ESPERANDO_INTERNO → EN_REVISION via tomar', () => {
      const t = tramiteEnEstado(origen, EstadoTramite.ESPERANDO_INTERNO);
      const result = t.tomar('u-001', 'area-001');
      expect(result.tramite.estado).toBe(EstadoTramite.EN_REVISION);
    });

    it('should not allow DERIVAR from INTERNO_EXTERNO', () => {
      const t = tramiteEnEstado(origen, EstadoTramite.EN_REVISION);
      expect(() => t.derivar('area-002', 'u-001')).toThrow(
        'Solo se puede derivar trámites de origen INTERNO_INTERNO',
      );
    });

    it('should not allow TOMAR from INGRESADO (INTERNO_EXTERNO)', () => {
      const t = tramiteEnEstado(origen, EstadoTramite.INGRESADO);
      expect(() => t.tomar('u-001', 'area-001')).toThrow();
    });
  });

  describe('EXTERNO_INTERNO workflow', () => {
    const origen = OrigenTramite.EXTERNO_INTERNO;

    it('EN_REVISION → OBSERVADO', () => {
      const t = tramiteEnEstado(origen, EstadoTramite.EN_REVISION);
      const result = t.observar('Falta documentación', 'u-001');
      expect(result.tramite.estado).toBe(EstadoTramite.OBSERVADO);
    });

    it('OBSERVADO → INGRESADO via responderObservacion', () => {
      const t = tramiteEnEstado(origen, EstadoTramite.OBSERVADO);
      const result = t.responderObservacion(
        'Documentación corregida',
        'ext-001',
      );
      expect(result.tramite.estado).toBe(EstadoTramite.INGRESADO);
    });

    it('should not allow responderObservacion from non-EXTERNO_INTERNO', () => {
      const t = tramiteEnEstado(
        OrigenTramite.INTERNO_INTERNO,
        EstadoTramite.OBSERVADO,
      );
      expect(() => t.responderObservacion('Respuesta', 'ext-001')).toThrow(
        'Solo trámites de origen EXTERNO_INTERNO pueden responder observaciones',
      );
    });
  });

  describe('Invalid transitions', () => {
    it('should not allow APROBAR in BORRADOR', () => {
      const t = tramiteEnEstado(
        OrigenTramite.INTERNO_INTERNO,
        EstadoTramite.BORRADOR,
      );
      expect(() => t.aprobar('u-001')).toThrow();
    });

    it('should not allow CERRAR from INGRESADO', () => {
      const t = tramiteEnEstado(
        OrigenTramite.INTERNO_INTERNO,
        EstadoTramite.INGRESADO,
      );
      expect(() => t.cerrar('u-001')).toThrow();
    });

    it('should not allow CERRAR from EN_REVISION', () => {
      const t = tramiteEnEstado(
        OrigenTramite.INTERNO_INTERNO,
        EstadoTramite.EN_REVISION,
      );
      expect(() => t.cerrar('u-001')).toThrow();
    });

    it('should not allow TOMAR if already taken by another user', () => {
      const t = tramiteEnEstado(
        OrigenTramite.INTERNO_INTERNO,
        EstadoTramite.INGRESADO,
        {
          usuarioAsignadoId: 'other-user',
        },
      );
      expect(() => t.tomar('u-001', 'area-001')).toThrow(
        'El trámite ya fue tomado por otro usuario',
      );
    });

    it('should allow TOMAR if taking own tramite', () => {
      const t = tramiteEnEstado(
        OrigenTramite.INTERNO_INTERNO,
        EstadoTramite.INGRESADO,
        {
          usuarioAsignadoId: 'u-001',
        },
      );
      const result = t.tomar('u-001', 'area-001');
      expect(result.tramite.estado).toBe(EstadoTramite.EN_REVISION);
    });

    it('should not allow INGRESAR twice', () => {
      const t = tramiteEnEstado(
        OrigenTramite.INTERNO_INTERNO,
        EstadoTramite.INGRESADO,
      );
      expect(() => t.ingresar('u-001', 'area-001')).toThrow();
    });
  });

  describe('accionesDisponibles', () => {
    it('should return INGRESAR and CANCELAR for BORRADOR', () => {
      const t = tramiteEnEstado(
        OrigenTramite.INTERNO_INTERNO,
        EstadoTramite.BORRADOR,
      );
      const acciones = t.accionesDisponibles();
      expect(acciones).toContain(AccionMovimiento.INGRESAR);
      expect(acciones).toContain(AccionMovimiento.CANCELAR);
      expect(acciones).toHaveLength(2);
    });

    it('should return empty array for CERRADO', () => {
      const t = tramiteEnEstado(
        OrigenTramite.INTERNO_INTERNO,
        EstadoTramite.CERRADO,
      );
      expect(t.accionesDisponibles()).toEqual([]);
    });
  });
});
