/// <reference types="jest" />

import { TransicionValidatorService } from '@domain/services/transicion-validator.service';
import { OrigenTramite } from '@domain/enums/origen-tramite.enum';
import { EstadoTramite } from '@domain/enums/estado-tramite.enum';
import { AccionMovimiento } from '@domain/enums/accion-movimiento.enum';

describe('TransicionValidatorService', () => {
  describe('INTERNO_INTERNO', () => {
    const origen = OrigenTramite.INTERNO_INTERNO;

    it('should allow INGRESAR from BORRADOR', () => {
      expect(
        TransicionValidatorService.puedeTransicionar(
          origen,
          EstadoTramite.BORRADOR,
          AccionMovimiento.INGRESAR,
        ),
      ).toBe(true);
    });

    it('should allow CANCELAR from BORRADOR', () => {
      expect(
        TransicionValidatorService.puedeTransicionar(
          origen,
          EstadoTramite.BORRADOR,
          AccionMovimiento.CANCELAR,
        ),
      ).toBe(true);
    });

    it('should not allow APROBAR from BORRADOR', () => {
      expect(
        TransicionValidatorService.puedeTransicionar(
          origen,
          EstadoTramite.BORRADOR,
          AccionMovimiento.APROBAR,
        ),
      ).toBe(false);
    });

    it('should allow TOMAR from INGRESADO', () => {
      expect(
        TransicionValidatorService.puedeTransicionar(
          origen,
          EstadoTramite.INGRESADO,
          AccionMovimiento.TOMAR,
        ),
      ).toBe(true);
    });

    it('should allow DERIVAR from EN_REVISION', () => {
      expect(
        TransicionValidatorService.puedeTransicionar(
          origen,
          EstadoTramite.EN_REVISION,
          AccionMovimiento.DERIVAR,
        ),
      ).toBe(true);
    });

    it('should allow APROBAR from EN_REVISION', () => {
      expect(
        TransicionValidatorService.puedeTransicionar(
          origen,
          EstadoTramite.EN_REVISION,
          AccionMovimiento.APROBAR,
        ),
      ).toBe(true);
    });

    it('should allow CERRAR from APROBADO', () => {
      expect(
        TransicionValidatorService.puedeTransicionar(
          origen,
          EstadoTramite.APROBADO,
          AccionMovimiento.CERRAR,
        ),
      ).toBe(true);
    });

    it('should not allow CERRAR from BORRADOR', () => {
      expect(
        TransicionValidatorService.puedeTransicionar(
          origen,
          EstadoTramite.BORRADOR,
          AccionMovimiento.CERRAR,
        ),
      ).toBe(false);
    });

    it('should not allow SOLICITAR_INTERVENCION_EXTERNA from EN_REVISION (INTERNO_INTERNO)', () => {
      expect(
        TransicionValidatorService.puedeTransicionar(
          origen,
          EstadoTramite.EN_REVISION,
          AccionMovimiento.SOLICITAR_INTERVENCION_EXTERNA,
        ),
      ).toBe(false);
    });

    it('should not allow OBSERVAR from INGRESADO (INTERNO_INTERNO)', () => {
      expect(
        TransicionValidatorService.puedeTransicionar(
          origen,
          EstadoTramite.INGRESADO,
          AccionMovimiento.OBSERVAR,
        ),
      ).toBe(false);
    });
  });

  describe('INTERNO_EXTERNO', () => {
    const origen = OrigenTramite.INTERNO_EXTERNO;

    it('should allow SOLICITAR_INTERVENCION_EXTERNA from INGRESADO', () => {
      expect(
        TransicionValidatorService.puedeTransicionar(
          origen,
          EstadoTramite.INGRESADO,
          AccionMovimiento.SOLICITAR_INTERVENCION_EXTERNA,
        ),
      ).toBe(true);
    });

    it('should allow SOLICITAR_INTERVENCION_EXTERNA from EN_REVISION', () => {
      expect(
        TransicionValidatorService.puedeTransicionar(
          origen,
          EstadoTramite.EN_REVISION,
          AccionMovimiento.SOLICITAR_INTERVENCION_EXTERNA,
        ),
      ).toBe(true);
    });

    it('should allow RESPONDER_INTERVENCION_EXTERNA from ESPERANDO_EXTERNO', () => {
      expect(
        TransicionValidatorService.puedeTransicionar(
          origen,
          EstadoTramite.ESPERANDO_EXTERNO,
          AccionMovimiento.RESPONDER_INTERVENCION_EXTERNA,
        ),
      ).toBe(true);
    });

    it('should allow TOMAR from ESPERANDO_INTERNO', () => {
      expect(
        TransicionValidatorService.puedeTransicionar(
          origen,
          EstadoTramite.ESPERANDO_INTERNO,
          AccionMovimiento.TOMAR,
        ),
      ).toBe(true);
    });

    it('should not allow TOMAR from INGRESADO (INTERNO_EXTERNO)', () => {
      expect(
        TransicionValidatorService.puedeTransicionar(
          origen,
          EstadoTramite.INGRESADO,
          AccionMovimiento.TOMAR,
        ),
      ).toBe(false);
    });

    it('should not allow DERIVAR from EN_REVISION (INTERNO_EXTERNO)', () => {
      expect(
        TransicionValidatorService.puedeTransicionar(
          origen,
          EstadoTramite.EN_REVISION,
          AccionMovimiento.DERIVAR,
        ),
      ).toBe(false);
    });

    it('should not allow RESPONDER_OBSERVACION from OBSERVADO (INTERNO_EXTERNO)', () => {
      expect(
        TransicionValidatorService.puedeTransicionar(
          origen,
          EstadoTramite.OBSERVADO,
          AccionMovimiento.RESPONDER_OBSERVACION,
        ),
      ).toBe(false);
    });
  });

  describe('EXTERNO_INTERNO', () => {
    const origen = OrigenTramite.EXTERNO_INTERNO;

    it('should allow INGRESAR from BORRADOR', () => {
      expect(
        TransicionValidatorService.puedeTransicionar(
          origen,
          EstadoTramite.BORRADOR,
          AccionMovimiento.INGRESAR,
        ),
      ).toBe(true);
    });

    it('should allow OBSERVAR from EN_REVISION', () => {
      expect(
        TransicionValidatorService.puedeTransicionar(
          origen,
          EstadoTramite.EN_REVISION,
          AccionMovimiento.OBSERVAR,
        ),
      ).toBe(true);
    });

    it('should allow RESPONDER_OBSERVACION from OBSERVADO', () => {
      expect(
        TransicionValidatorService.puedeTransicionar(
          origen,
          EstadoTramite.OBSERVADO,
          AccionMovimiento.RESPONDER_OBSERVACION,
        ),
      ).toBe(true);
    });

    it('should allow CERRAR from CANCELADO', () => {
      expect(
        TransicionValidatorService.puedeTransicionar(
          origen,
          EstadoTramite.CANCELADO,
          AccionMovimiento.CERRAR,
        ),
      ).toBe(true);
    });

    it('should not allow SOLICITAR_INTERVENCION_EXTERNA from EN_REVISION (EXTERNO_INTERNO)', () => {
      expect(
        TransicionValidatorService.puedeTransicionar(
          origen,
          EstadoTramite.EN_REVISION,
          AccionMovimiento.SOLICITAR_INTERVENCION_EXTERNA,
        ),
      ).toBe(false);
    });

    it('should not allow DERIVAR from any state (EXTERNO_INTERNO)', () => {
      expect(
        TransicionValidatorService.puedeTransicionar(
          origen,
          EstadoTramite.EN_REVISION,
          AccionMovimiento.DERIVAR,
        ),
      ).toBe(false);
    });
  });

  describe('accionesDisponibles', () => {
    it('should return available actions for BORRADOR INTERNO_INTERNO', () => {
      const acciones = TransicionValidatorService.accionesDisponibles(
        OrigenTramite.INTERNO_INTERNO,
        EstadoTramite.BORRADOR,
      );
      expect(acciones).toContain(AccionMovimiento.INGRESAR);
      expect(acciones).toContain(AccionMovimiento.CANCELAR);
      expect(acciones).not.toContain(AccionMovimiento.APROBAR);
    });

    it('should return empty array for CERRADO', () => {
      const acciones = TransicionValidatorService.accionesDisponibles(
        OrigenTramite.INTERNO_INTERNO,
        EstadoTramite.CERRADO,
      );
      expect(acciones).toEqual([]);
    });

    it('should return RESPONDER_OBSERVACION for OBSERVADO EXTERNO_INTERNO', () => {
      const acciones = TransicionValidatorService.accionesDisponibles(
        OrigenTramite.EXTERNO_INTERNO,
        EstadoTramite.OBSERVADO,
      );
      expect(acciones).toContain(AccionMovimiento.RESPONDER_OBSERVACION);
      expect(acciones).toContain(AccionMovimiento.CANCELAR);
    });
  });
});
