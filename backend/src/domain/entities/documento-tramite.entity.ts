import { TipoUsuario } from '../enums';

export interface DocumentoTramiteProps {
  id: string;
  tramiteId: string;
  nombreArchivo: string;
  mimeType: string;
  size: number;
  storageKey: string;
  subidoPorTipo: TipoUsuario;
  subidoPorId: string;
  fechaCarga: Date;
}

export class DocumentoTramite {
  private constructor(
    public readonly id: string,
    public readonly tramiteId: string,
    public readonly nombreArchivo: string,
    public readonly mimeType: string,
    public readonly size: number,
    public readonly storageKey: string,
    public readonly subidoPorTipo: TipoUsuario,
    public readonly subidoPorId: string,
    public readonly fechaCarga: Date,
  ) {}

  static create(props: DocumentoTramiteProps): DocumentoTramite {
    return new DocumentoTramite(
      props.id,
      props.tramiteId,
      props.nombreArchivo,
      props.mimeType,
      props.size,
      props.storageKey,
      props.subidoPorTipo,
      props.subidoPorId,
      props.fechaCarga,
    );
  }
}
