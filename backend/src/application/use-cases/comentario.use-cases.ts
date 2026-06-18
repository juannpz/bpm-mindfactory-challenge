import { Injectable, Inject } from '@nestjs/common';
import { ComentarioTramite } from '@domain/entities';
import { TipoUsuario } from '@domain/enums';
import { v4 as uuid } from 'uuid';
import { CrearComentarioDto } from '../dtos';
import { mapComentarioToResponse, ComentarioResponse } from '../dtos/responses';
import { COMENTARIO_REPOSITORY } from '../ports/tokens';
import type { IComentarioRepository } from '../ports/comentario.repository.port';

@Injectable()
export class ComentarioUseCases {
  constructor(
    @Inject(COMENTARIO_REPOSITORY)
    private readonly comentarioRepo: IComentarioRepository,
  ) {}

  async crear(
    tramiteId: string,
    dto: CrearComentarioDto,
    autorTipo: string,
    autorId: string,
  ): Promise<ComentarioResponse> {
    const c = ComentarioTramite.create({
      id: uuid(),
      tramiteId,
      mensaje: dto.mensaje,
      visibilidad: dto.visibilidad,
      autorTipo: autorTipo as TipoUsuario,
      autorId,
      fecha: new Date(),
    });
    const created = await this.comentarioRepo.create(c);
    return mapComentarioToResponse(created);
  }

  async listar(
    tramiteId: string,
    usuarioTipo: string,
  ): Promise<ComentarioResponse[]> {
    const comentarios = await this.comentarioRepo.findByTramiteId(tramiteId);
    return comentarios
      .filter((c) => c.esVisiblePara(usuarioTipo as TipoUsuario))
      .map(mapComentarioToResponse);
  }
}
