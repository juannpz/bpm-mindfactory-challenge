import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DashboardUseCases } from '@application/use-cases';
import { DashboardResponse } from '@application/dtos/responses';
import { InternalAuthGuard } from '../guards';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
@UseGuards(InternalAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardUseCases: DashboardUseCases) {}

  @Get()
  @ApiOperation({
    summary: 'Obtener métricas del dashboard operativo (INTERNO)',
  })
  @ApiResponse({
    status: 200,
    description: 'Métricas del dashboard',
    type: DashboardResponse,
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Solo usuarios internos' })
  async obtener() {
    return this.dashboardUseCases.obtener();
  }
}
