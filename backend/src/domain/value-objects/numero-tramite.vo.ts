export class NumeroTramite {
  private readonly value: string;

  constructor(value: string) {
    if (!NumeroTramite.isValid(value)) {
      throw new Error(`Número de trámite inválido: ${value}`);
    }
    this.value = value;
  }

  static isValid(value: string): boolean {
    return /^TRAM-\d{4}-\d{5}$/.test(value);
  }

  static generate(anio: number, secuencial: number): NumeroTramite {
    return new NumeroTramite(
      `TRAM-${anio}-${String(secuencial).padStart(5, '0')}`,
    );
  }

  toString(): string {
    return this.value;
  }

  equals(other: NumeroTramite): boolean {
    return this.value === other.value;
  }
}
