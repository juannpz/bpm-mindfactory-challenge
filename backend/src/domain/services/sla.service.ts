export class SlaService {
  static calcularVencimiento(fechaCreacion: Date, slaHoras: number): Date {
    const vencimiento = new Date(fechaCreacion);
    vencimiento.setHours(vencimiento.getHours() + slaHoras);
    return vencimiento;
  }

  static estaVencido(fechaCreacion: Date, slaHoras: number): boolean {
    const vencimiento = SlaService.calcularVencimiento(fechaCreacion, slaHoras);
    return new Date() > vencimiento;
  }

  static tiempoRestante(fechaCreacion: Date, slaHoras: number): number {
    const vencimiento = SlaService.calcularVencimiento(fechaCreacion, slaHoras);
    const ahora = new Date();
    const diffMs = vencimiento.getTime() - ahora.getTime();
    const horas = diffMs / (1000 * 60 * 60);
    return Math.max(0, Math.round(horas * 100) / 100);
  }
}
