export class DocumentoIdentidad {
  private readonly value: string;

  constructor(value: string) {
    if (!DocumentoIdentidad.isValid(value)) {
      throw new Error(`Documento de identidad inválido: ${value}`);
    }
    this.value = value.replace(/\D/g, '');
  }

  static isValid(value: string): boolean {
    const cleaned = value.replace(/\D/g, '');
    return cleaned.length >= 7 && cleaned.length <= 11;
  }

  toString(): string {
    return this.value;
  }

  equals(other: DocumentoIdentidad): boolean {
    return this.value === other.value;
  }
}
