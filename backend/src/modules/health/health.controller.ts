// src/modules/health/health.controller.ts
// ================================================================
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { Publico } from '../../common/decorators/roles.decorator';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @Publico()
  @ApiOperation({ summary: 'Estado de salud del sistema (usado por Docker healthcheck y monitoreo)' })
  async health() {
    return this.healthService.checkHealth();
  }
}
