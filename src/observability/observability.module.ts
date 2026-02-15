import { Module } from '@nestjs/common';
import { LoggingService } from './services/logging.service';
import { HealthService } from './services/health.service';

@Module({
  providers: [LoggingService, HealthService],
  exports: [LoggingService, HealthService],
})
export class ObservabilityModule { }
