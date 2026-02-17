import { Module } from '@nestjs/common';
import { LookupService } from './services/lookup.service';
import { SuggestionsService } from './services/suggestions.service';
import { LookupController } from './controllers/lookup.controller';
import { CatalogModule } from '../catalog/catalog.module';
import { ObservabilityModule } from '../observability/observability.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [CatalogModule, ObservabilityModule, PrismaModule],
  providers: [LookupService, SuggestionsService],
  controllers: [LookupController],
})
export class LookupModule {}
