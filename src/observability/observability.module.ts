import { Module } from '@nestjs/common';
import { LoggingService } from './services/logging.service';
import { HealthService } from './services/health.service';
import { SearchLogService } from './services/search-log.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [LoggingService, HealthService, SearchLogService],
  exports: [LoggingService, HealthService, SearchLogService],
})
export class ObservabilityModule {}
