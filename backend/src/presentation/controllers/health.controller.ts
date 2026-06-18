import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../decorators';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @Public()
  @ApiOperation({ summary: 'Health check del servicio' })
  @ApiResponse({
    status: 200,
    description: 'Servicio operativo',
    schema: {
      example: {
        status: 'ok',
        timestamp: '2026-06-18T12:00:00.000Z',
        uptime: 3600,
      },
    },
  })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
