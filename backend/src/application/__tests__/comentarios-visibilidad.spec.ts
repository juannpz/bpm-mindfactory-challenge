/// <reference types="jest" />

import { ComentarioUseCases } from '@application/use-cases/comentario.use-cases';
import type { IComentarioRepository } from '@application/ports/comentario.repository.port';
import { ComentarioTramite } from '@domain/entities';
import { TipoUsuario, VisibilidadComentario } from '@domain/enums';
import { mockRepo } from './test-helpers';

const mockComentarioRepo = mockRepo<IComentarioRepository>({
  create: jest.fn(),
  findByTramiteId: jest.fn(),
});

function makeComentario(visibilidad: VisibilidadComentario) {
  return ComentarioTramite.create({
    id: 'c-001',
    tramiteId: 't-001',
    mensaje: 'Comentario de prueba',
    visibilidad,
    autorTipo: TipoUsuario.INTERNO,
    autorId: 'u-001',
    fecha: new Date(),
  });
}

describe('ComentarioUseCases', () => {
  let useCases: ComentarioUseCases;

  beforeEach(() => {
    jest.clearAllMocks();
    useCases = new ComentarioUseCases(mockComentarioRepo);
  });

  describe('crear()', () => {
    it('should create a comment with INTERNA visibilidad', async () => {
      mockComentarioRepo.create.mockImplementation((c: ComentarioTramite) =>
        Promise.resolve(c),
      );

      const response = await useCases.crear(
        't-001',
        { mensaje: 'Test', visibilidad: VisibilidadComentario.INTERNA },
        TipoUsuario.INTERNO,
        'u-001',
      );

      expect(mockComentarioRepo.create).toHaveBeenCalledTimes(1);
      const createdComment: ComentarioTramite =
        mockComentarioRepo.create.mock.calls[0][0];
      expect(createdComment.visibilidad).toBe(VisibilidadComentario.INTERNA);
      expect(createdComment.mensaje).toBe('Test');
      expect(createdComment.autorTipo).toBe(TipoUsuario.INTERNO);

      expect(response.visibilidad).toBe(VisibilidadComentario.INTERNA);
      expect(response.mensaje).toBe('Test');
      expect(response.id).toBe(createdComment.id);
      expect(response.tramiteId).toBe('t-001');
    });

    it('should create a comment with EXTERNA visibilidad', async () => {
      mockComentarioRepo.create.mockImplementation((c: ComentarioTramite) =>
        Promise.resolve(c),
      );

      const response = await useCases.crear(
        't-001',
        {
          mensaje: 'Mensaje externo',
          visibilidad: VisibilidadComentario.EXTERNA,
        },
        TipoUsuario.EXTERNO,
        'ext-001',
      );

      expect(mockComentarioRepo.create).toHaveBeenCalledTimes(1);
      const createdComment: ComentarioTramite =
        mockComentarioRepo.create.mock.calls[0][0];
      expect(createdComment.visibilidad).toBe(VisibilidadComentario.EXTERNA);
      expect(createdComment.autorTipo).toBe(TipoUsuario.EXTERNO);

      expect(response.visibilidad).toBe(VisibilidadComentario.EXTERNA);
    });
  });

  describe('listar()', () => {
    it('should filter comments by visibilidad for INTERNO user', async () => {
      const c1 = makeComentario(VisibilidadComentario.INTERNA);
      const c2 = makeComentario(VisibilidadComentario.EXTERNA);
      const c3 = makeComentario(VisibilidadComentario.TODOS);
      mockComentarioRepo.findByTramiteId.mockResolvedValue([c1, c2, c3]);

      const response = await useCases.listar('t-001', TipoUsuario.INTERNO);

      expect(mockComentarioRepo.findByTramiteId).toHaveBeenCalledWith('t-001');
      expect(response.length).toBe(2);
      expect(response.map((r) => r.visibilidad)).toEqual(
        expect.arrayContaining([
          VisibilidadComentario.INTERNA,
          VisibilidadComentario.TODOS,
        ]),
      );
    });

    it('should filter comments by visibilidad for EXTERNO user', async () => {
      const c1 = makeComentario(VisibilidadComentario.INTERNA);
      const c2 = makeComentario(VisibilidadComentario.EXTERNA);
      const c3 = makeComentario(VisibilidadComentario.TODOS);
      mockComentarioRepo.findByTramiteId.mockResolvedValue([c1, c2, c3]);

      const response = await useCases.listar('t-001', TipoUsuario.EXTERNO);

      expect(response.length).toBe(2);
      expect(response.map((r) => r.visibilidad)).toEqual(
        expect.arrayContaining([
          VisibilidadComentario.EXTERNA,
          VisibilidadComentario.TODOS,
        ]),
      );
    });

    it('should return empty array when no comments match', async () => {
      mockComentarioRepo.findByTramiteId.mockResolvedValue([]);

      const response = await useCases.listar('t-001', TipoUsuario.INTERNO);

      expect(response).toEqual([]);
    });
  });
});
