import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { DocumentoUseCases } from '@application/use-cases';
import { DocumentoResponse } from '@application/dtos/responses';
import { AuthGuard } from '../guards';
import { CurrentUser } from '../decorators';

@ApiTags('Documentos')
@ApiBearerAuth()
@Controller('tramites/:id/documentos')
@UseGuards(AuthGuard)
export class DocumentoController {
  constructor(private readonly documentoUseCases: DocumentoUseCases) {}

  @Post()
  @ApiOperation({ summary: 'Subir documento a un trámite' })
  @ApiParam({
    name: 'id',
    description: 'ID del trámite',
    example: 'uuid-tramite',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Archivo a subir',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Documento subido',
    type: DocumentoResponse,
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 422, description: 'Archivo requerido o inválido' })
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
  @ApiOperation({
    summary: 'Listar documentos del trámite (filtrado por visibilidad)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del trámite',
    example: 'uuid-tramite',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de documentos',
    type: [DocumentoResponse],
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async listar(
    @Param('id') tramiteId: string,
    @CurrentUser() user: { id: string; tipo: string },
  ) {
    return this.documentoUseCases.listar(tramiteId, user.tipo, user.id);
  }

  @Get(':documentoId')
  @ApiOperation({ summary: 'Obtener metadatos de un documento' })
  @ApiParam({
    name: 'id',
    description: 'ID del trámite',
    example: 'uuid-tramite',
  })
  @ApiParam({
    name: 'documentoId',
    description: 'ID del documento',
    example: 'uuid-documento',
  })
  @ApiResponse({
    status: 200,
    description: 'Metadatos del documento',
    type: DocumentoResponse,
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'Documento no encontrado' })
  async obtener(@Param('documentoId') documentoId: string) {
    const doc = await this.documentoUseCases.obtener(documentoId);
    if (!doc) throw new Error('Documento no encontrado');
    return doc;
  }

  @Delete(':documentoId')
  @ApiOperation({ summary: 'Eliminar documento' })
  @ApiParam({
    name: 'id',
    description: 'ID del trámite',
    example: 'uuid-tramite',
  })
  @ApiParam({
    name: 'documentoId',
    description: 'ID del documento',
    example: 'uuid-documento',
  })
  @ApiResponse({ status: 200, description: 'Documento eliminado' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'Documento no encontrado' })
  async eliminar(@Param('documentoId') documentoId: string) {
    await this.documentoUseCases.eliminar(documentoId);
    return { message: 'Documento eliminado' };
  }
}
