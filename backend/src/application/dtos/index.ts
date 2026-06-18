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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Prioridad, OrigenTramite, VisibilidadComentario } from '@domain/enums';

export class CrearTramiteDto {
  @ApiProperty({
    example: 'uuid-tipo-tramite',
    description: 'ID del tipo de trámite',
  })
  @IsString()
  tipoTramiteId!: string;

  @ApiProperty({
    example: 'Solicitud de alta de proveedor',
    description: 'Título del trámite',
  })
  @IsString()
  titulo!: string;

  @ApiProperty({
    example: 'Se solicita alta de proveedor para el área de compras',
    description: 'Descripción detallada',
  })
  @IsString()
  descripcion!: string;

  @ApiProperty({
    enum: Prioridad,
    example: Prioridad.MEDIA,
    description: 'Prioridad del trámite',
  })
  @IsEnum(Prioridad)
  prioridad!: Prioridad;

  @ApiPropertyOptional({
    example: 'uuid-area-destino',
    description: 'ID del área destino',
  })
  @IsOptional()
  @IsString()
  areaDestinoId?: string;

  @ApiPropertyOptional({
    example: 'uuid-usuario-externo',
    description:
      'ID del usuario externo vinculado (obligatorio para INTERNO_EXTERNO)',
  })
  @IsOptional()
  @IsString()
  usuarioExternoId?: string;

  @ApiProperty({
    enum: OrigenTramite,
    example: OrigenTramite.INTERNO_INTERNO,
    description: 'Origen del trámite',
  })
  @IsEnum(OrigenTramite)
  origen!: OrigenTramite;
}

export class MagicLinkRequestDto {
  @ApiProperty({
    example: 'externo1@test.com',
    description: 'Correo electrónico para recibir el magic link',
  })
  @IsEmail()
  email!: string;
}

export class MagicLinkVerifyDto {
  @ApiProperty({
    example: 'a1b2c3...',
    description: 'Token del magic link recibido por email',
  })
  @IsString()
  @IsNotEmpty()
  token!: string;
}

export class ActualizarTramiteDto {
  @ApiPropertyOptional({
    example: 'Título actualizado',
    description: 'Nuevo título del trámite',
  })
  @IsOptional()
  @IsString()
  titulo?: string;

  @ApiPropertyOptional({
    example: 'Descripción actualizada',
    description: 'Nueva descripción del trámite',
  })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiPropertyOptional({
    enum: Prioridad,
    example: Prioridad.ALTA,
    description: 'Nueva prioridad del trámite',
  })
  @IsOptional()
  @IsEnum(Prioridad)
  prioridad?: Prioridad;
}

export class AsignarTramiteDto {
  @ApiProperty({
    example: 'uuid-usuario-interno',
    description: 'ID del usuario interno a asignar',
  })
  @IsString()
  usuarioId!: string;

  @ApiPropertyOptional({
    example: 'uuid-area',
    description: 'ID del área a asignar (opcional)',
  })
  @IsOptional()
  @IsString()
  areaId?: string;
}

export class DerivarTramiteDto {
  @ApiProperty({
    example: 'uuid-area-destino',
    description: 'ID del área destino',
  })
  @IsString()
  areaDestinoId!: string;

  @ApiPropertyOptional({
    example: 'Derivado para revisión',
    description: 'Comentario opcional de la derivación',
  })
  @IsOptional()
  @IsString()
  comentario?: string;
}

export class ObservarTramiteDto {
  @ApiProperty({
    example: 'Falta documentación del proveedor',
    description: 'Motivo de la observación',
  })
  @IsString()
  comentario!: string;
}

export class ResponderObservacionDto {
  @ApiProperty({
    example: 'Documentación adjuntada correctamente',
    description: 'Respuesta a la observación',
  })
  @IsString()
  comentario!: string;
}

export class SolicitarIntervencionExternaDto {
  @ApiProperty({
    example: 'uuid-usuario-externo',
    description: 'ID del usuario externo',
  })
  @IsString()
  usuarioExternoId!: string;

  @ApiPropertyOptional({
    example: 'Se requiere revisión del contrato',
    description: 'Comentario opcional',
  })
  @IsOptional()
  @IsString()
  comentario?: string;
}

export class ResponderIntervencionExternaDto {
  @ApiPropertyOptional({
    example: 'Contrato revisado, adjunto informe',
    description: 'Respuesta del externo',
  })
  @IsOptional()
  @IsString()
  comentario?: string;
}

export class AprobarTramiteDto {
  @ApiPropertyOptional({
    example: 'Todo correcto, se aprueba',
    description: 'Comentario opcional de aprobación',
  })
  @IsOptional()
  @IsString()
  comentario?: string;
}

export class RechazarTramiteDto {
  @ApiProperty({
    example: 'No cumple con los requisitos mínimos',
    description: 'Motivo del rechazo',
  })
  @IsString()
  motivo!: string;
}

export class CrearComentarioDto {
  @ApiProperty({
    example: 'Revisar la documentación adjunta',
    description: 'Contenido del comentario',
  })
  @IsString()
  mensaje!: string;

  @ApiProperty({
    enum: VisibilidadComentario,
    example: VisibilidadComentario.INTERNA,
    description: 'Visibilidad del comentario',
  })
  @IsEnum(VisibilidadComentario)
  visibilidad!: VisibilidadComentario;
}

export class RegistroExternoDto {
  @ApiProperty({
    example: 'Juan Pérez',
    description: 'Nombre completo',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  nombre!: string;

  @ApiProperty({
    example: 'juan@example.com',
    description: 'Correo electrónico',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'Contraseña (6-60 caracteres)',
    minLength: 6,
    maxLength: 60,
  })
  @IsString()
  @MinLength(6)
  @MaxLength(60)
  password!: string;

  @ApiProperty({
    example: 'DNI-12345678',
    description: 'Documento de identidad',
  })
  @IsString()
  documento!: string;

  @ApiProperty({
    example: 'Empresa S.A.',
    description: 'Organización a la que pertenece',
  })
  @IsString()
  organizacion!: string;
}

export class LoginExternoDto {
  @ApiProperty({
    example: 'externo1@test.com',
    description: 'Correo electrónico registrado',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Password123!', description: 'Contraseña' })
  @IsNotEmpty()
  @IsString()
  password!: string;
}

export class InternalLoginDto {
  @ApiProperty({
    example: 'mock-admin-001',
    description: 'Azure Object ID del usuario interno (mock o real)',
  })
  @IsString()
  azureObjectId!: string;
}

export class CrearAreaDto {
  @ApiProperty({ example: 'Recursos Humanos', description: 'Nombre del área' })
  @IsString()
  nombre!: string;

  @ApiProperty({ example: 'RH', description: 'Código único del área' })
  @IsString()
  codigo!: string;
}

export class ActualizarAreaDto {
  @ApiPropertyOptional({
    example: 'Recursos Humanos',
    description: 'Nuevo nombre del área',
  })
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiPropertyOptional({ example: 'RH', description: 'Nuevo código del área' })
  @IsOptional()
  @IsString()
  codigo?: string;

  @ApiPropertyOptional({ example: true, description: 'Área activa o inactiva' })
  @IsOptional()
  @IsBoolean()
  activa?: boolean;
}

export class CrearTipoTramiteDto {
  @ApiProperty({
    example: 'SOLICITUD_ALTA_PROVEEDOR',
    description: 'Código único del tipo de trámite',
  })
  @IsString()
  codigo!: string;

  @ApiProperty({
    example: 'Solicitud de Alta de Proveedor',
    description: 'Nombre del tipo de trámite',
  })
  @IsString()
  nombre!: string;

  @ApiProperty({
    example: 'Trámite para dar de alta un nuevo proveedor en el sistema',
    description: 'Descripción del tipo de trámite',
  })
  @IsString()
  descripcion!: string;

  @ApiProperty({
    example: false,
    description: 'Indica si requiere intervención de usuario externo',
  })
  @IsBoolean()
  requiereExterno!: boolean;

  @ApiProperty({
    example: true,
    description:
      'Indica si un usuario externo puede iniciar este tipo de trámite',
  })
  @IsBoolean()
  permiteInicioExterno!: boolean;

  @ApiProperty({
    example: 48,
    description: 'Horas de SLA para resolución',
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  slaHoras!: number;

  @ApiPropertyOptional({
    example: 'uuid-area-inicial',
    description: 'ID del área inicial asignada por defecto',
  })
  @IsOptional()
  @IsString()
  areaInicialId?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Indica si el tipo de trámite está activo',
  })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
