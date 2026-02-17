import { Module } from '@nestjs/common';
import { AdminService } from './services/admin.service';
import { AdminController } from './controllers/admin.controller';
import { AnalyticsController } from './controllers/analytics.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CatalogModule } from '../catalog/catalog.module';
import { QueuesModule } from '../queues/queues.module';
import { ObservabilityModule } from '../observability/observability.module';

@Module({
  imports: [PrismaModule, CatalogModule, QueuesModule, ObservabilityModule],
  providers: [AdminService],
  controllers: [AdminController, AnalyticsController],
})
export class AdminModule {}
