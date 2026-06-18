import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import multipart from '@fastify/multipart';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from '@presentation/filters';

async function bootstrap() {
  const fastifyAdapter = new FastifyAdapter();
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    fastifyAdapter,
  );

  app.enableCors({
    origin: process.env.FRONTEND_URL?.split(',').map((s) => s.trim()) ?? [
      'http://localhost:3000',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Mock-User-Id'],
    credentials: true,
  });

  await app.register(multipart, {
    limits: { fileSize: 10 * 1024 * 1024 },
  });

  const config = new DocumentBuilder()
    .setTitle('BPM Trámites de Oficina')
    .setDescription('API para gestión de trámites de oficina')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  app.setGlobalPrefix('api');

  await app.listen(process.env.API_PORT ?? 3001, '0.0.0.0');
}
void bootstrap();
