import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { DocumentoUseCases } from '@application/use-cases';
import { AuthGuard } from '../guards';
import { CurrentUser } from '../decorators';

@Controller('tramites/:id/documentos')
@UseGuards(AuthGuard)
export class DocumentoController {
  constructor(private readonly documentoUseCases: DocumentoUseCases) {}

  @Post()
  async subir(
    @Param('id') tramiteId: string,
    @Req() req: FastifyRequest,
    @CurrentUser() user: { id: string; tipo: string },
  ) {
    const file = await req.file();
    if (!file) throw new Error('Archivo requerido');
    const buffer = await file.toBuffer();
    return this.documentoUseCases.subir(
      tramiteId,
      {
        originalname: file.filename,
        buffer,
        mimetype: file.mimetype,
        size: buffer.length,
      },
      user.tipo,
      user.id,
    );
  }

  @Get()
  async listar(
    @Param('id') tramiteId: string,
    @CurrentUser() user: { id: string; tipo: string },
  ) {
    return this.documentoUseCases.listar(tramiteId, user.tipo, user.id);
  }

  @Get(':documentoId')
  async obtener(@Param('documentoId') documentoId: string) {
    const doc = await this.documentoUseCases.obtener(documentoId);
    if (!doc) throw new Error('Documento no encontrado');
    return doc;
  }

  @Delete(':documentoId')
  async eliminar(@Param('documentoId') documentoId: string) {
    await this.documentoUseCases.eliminar(documentoId);
    return { message: 'Documento eliminado' };
  }
}
