import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsEmail,
  IsInt,
  IsNotEmpty,
  Min,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Prioridad, OrigenTramite, VisibilidadComentario } from '@domain/enums';

export class CrearTramiteDto {
  @IsString() tipoTramiteId!: string;
  @IsString() titulo!: string;
  @IsString() descripcion!: string;
  @IsEnum(Prioridad) prioridad!: Prioridad;
  @IsOptional() @IsString() areaDestinoId?: string;
  @IsOptional() @IsString() usuarioExternoId?: string;
  @IsEnum(OrigenTramite) origen!: OrigenTramite;
}

export class ActualizarTramiteDto {
  @IsOptional() @IsString() titulo?: string;
  @IsOptional() @IsString() descripcion?: string;
  @IsOptional() @IsEnum(Prioridad) prioridad?: Prioridad;
}

export class AsignarTramiteDto {
  @IsString() usuarioId!: string;
  @IsOptional() @IsString() areaId?: string;
}

export class DerivarTramiteDto {
  @IsString() areaDestinoId!: string;
  @IsOptional() @IsString() comentario?: string;
}

export class ObservarTramiteDto {
  @IsString() comentario!: string;
}

export class ResponderObservacionDto {
  @IsString() comentario!: string;
}

export class SolicitarIntervencionExternaDto {
  @IsString() usuarioExternoId!: string;
  @IsOptional() @IsString() comentario?: string;
}

export class ResponderIntervencionExternaDto {
  @IsOptional() @IsString() comentario?: string;
}

export class AprobarTramiteDto {
  @IsOptional() @IsString() comentario?: string;
}

export class RechazarTramiteDto {
  @IsString() motivo!: string;
}

export class CrearComentarioDto {
  @IsString() mensaje!: string;
  @IsEnum(VisibilidadComentario) visibilidad!: VisibilidadComentario;
}

export class RegistroExternoDto {
  @IsString() @MaxLength(200) nombre!: string;
  @IsEmail() email!: string;
  @IsString() @MinLength(6) @MaxLength(60) password!: string;
  @IsString() documento!: string;
  @IsString() organizacion!: string;
}

export class LoginExternoDto {
  @IsEmail() email!: string;
  @IsNotEmpty() @IsString() password!: string;
}

export class CrearAreaDto {
  @IsString() nombre!: string;
  @IsString() codigo!: string;
}

export class ActualizarAreaDto {
  @IsOptional() @IsString() nombre?: string;
  @IsOptional() @IsString() codigo?: string;
  @IsOptional() @IsBoolean() activa?: boolean;
}

export class CrearTipoTramiteDto {
  @IsString() codigo!: string;
  @IsString() nombre!: string;
  @IsString() descripcion!: string;
  @IsBoolean() requiereExterno!: boolean;
  @IsBoolean() permiteInicioExterno!: boolean;
  @IsInt() @Min(1) slaHoras!: number;
  @IsOptional() @IsString() areaInicialId?: string;
  @IsOptional() @IsBoolean() activo?: boolean;
}
