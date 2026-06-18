import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();
      const message =
        typeof response === 'object' && response !== null
          ? ((response as { message?: string | string[] }).message ??
            exception.message)
          : exception.message;

      return reply.status(status).send({
        statusCode: status,
        message: Array.isArray(message) ? message : [message],
        error: exception.name,
      });
    }

    if (exception instanceof Error) {
      const msg = exception.message.toLowerCase();
      let status: number;

      if (msg.includes('no encontrado') || msg.includes('not found')) {
        status = HttpStatus.NOT_FOUND;
      } else if (
        msg.includes('no autorizado') ||
        msg.includes('no tiene permiso') ||
        msg.includes('forbidden') ||
        msg.includes('no permitido')
      ) {
        status = HttpStatus.FORBIDDEN;
      } else if (
        msg.includes('no se puede') ||
        msg.includes('solo trámites') ||
        msg.includes('solo se puede') ||
        msg.includes('ya fue tomado') ||
        msg.includes('solo en') ||
        msg.includes('deben editarse') ||
        msg.includes('deben eliminarse') ||
        msg.includes('solo usuarios')
      ) {
        status = HttpStatus.UNPROCESSABLE_ENTITY;
      } else if (
        msg.includes('credenciales inválidas') ||
        msg.includes('token') ||
        msg.includes('no autenticado')
      ) {
        status = HttpStatus.UNAUTHORIZED;
      } else {
        status = HttpStatus.INTERNAL_SERVER_ERROR;
      }

      return reply.status(status).send({
        statusCode: status,
        message: [exception.message],
        error: exception.name,
      });
    }

    return reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: ['Error interno del servidor'],
      error: 'InternalServerError',
    });
  }
}
