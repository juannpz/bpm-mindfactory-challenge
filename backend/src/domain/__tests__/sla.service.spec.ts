/// <reference types="jest" />

import { SlaService } from '@domain/services/sla.service';

describe('SlaService', () => {
  describe('calcularVencimiento', () => {
    it('should add slaHoras to the creation date', () => {
      const fecha = new Date('2026-06-16T10:00:00Z');
      const vencimiento = SlaService.calcularVencimiento(fecha, 48);
      expect(vencimiento.getTime()).toBe(
        new Date('2026-06-18T10:00:00Z').getTime(),
      );
    });

    it('should handle zero hours SLA', () => {
      const fecha = new Date('2026-06-16T10:00:00Z');
      const vencimiento = SlaService.calcularVencimiento(fecha, 0);
      expect(vencimiento.getTime()).toBe(fecha.getTime());
    });

    it('should handle SLA that crosses day boundary', () => {
      const fecha = new Date('2026-06-16T22:00:00Z');
      const vencimiento = SlaService.calcularVencimiento(fecha, 4);
      expect(vencimiento.getTime()).toBe(
        new Date('2026-06-17T02:00:00Z').getTime(),
      );
    });

    it('should not mutate the original date', () => {
      const fecha = new Date('2026-06-16T10:00:00Z');
      const original = fecha.getTime();
      SlaService.calcularVencimiento(fecha, 24);
      expect(fecha.getTime()).toBe(original);
    });
  });

  describe('estaVencido', () => {
    it('should return true when SLA has expired', () => {
      const fecha = new Date(Date.now() - 72 * 60 * 60 * 1000);
      expect(SlaService.estaVencido(fecha, 48)).toBe(true);
    });

    it('should return false when SLA has not expired', () => {
      const fecha = new Date(Date.now() - 1 * 60 * 60 * 1000);
      expect(SlaService.estaVencido(fecha, 48)).toBe(false);
    });

    it('should return false for future creation date', () => {
      const fecha = new Date(Date.now() + 24 * 60 * 60 * 1000);
      expect(SlaService.estaVencido(fecha, 48)).toBe(false);
    });

    it('should return true when SLA has just expired', () => {
      const fecha = new Date(Date.now() - 49 * 60 * 60 * 1000);
      expect(SlaService.estaVencido(fecha, 48)).toBe(true);
    });
  });

  describe('tiempoRestante', () => {
    it('should return positive hours when SLA has time left', () => {
      const fecha = new Date(Date.now() - 12 * 60 * 60 * 1000);
      const restante = SlaService.tiempoRestante(fecha, 48);
      expect(restante).toBeGreaterThan(30);
      expect(restante).toBeLessThan(40);
    });

    it('should return 0 when SLA has expired', () => {
      const fecha = new Date(Date.now() - 72 * 60 * 60 * 1000);
      expect(SlaService.tiempoRestante(fecha, 48)).toBe(0);
    });

    it('should return full SLA hours for just-created tramite', () => {
      const fecha = new Date();
      const restante = SlaService.tiempoRestante(fecha, 24);
      expect(restante).toBeGreaterThan(23);
      expect(restante).toBeLessThanOrEqual(24);
    });
  });
});
