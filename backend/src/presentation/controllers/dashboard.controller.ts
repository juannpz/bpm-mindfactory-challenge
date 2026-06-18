import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardUseCases } from '@application/use-cases';
import { InternalAuthGuard } from '../guards';

@Controller('dashboard')
@UseGuards(InternalAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardUseCases: DashboardUseCases) {}

  @Get()
  async obtener() {
    return this.dashboardUseCases.obtener();
  }
}
