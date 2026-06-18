export class SlaHoras {
  private readonly value: number;

  constructor(value: number) {
    if (!SlaHoras.isValid(value)) {
      throw new Error(`SLA inválido: ${value} horas. Debe ser positivo.`);
    }
    this.value = value;
  }

  static isValid(value: number): boolean {
    return Number.isInteger(value) && value > 0;
  }

  toNumber(): number {
    return this.value;
  }

  equals(other: SlaHoras): boolean {
    return this.value === other.value;
  }
}
