import { Module } from '@nestjs/common';
import { LookupService } from './services/lookup.service';
import { LookupController } from './controllers/lookup.controller';
import { CatalogModule } from '../catalog/catalog.module';

@Module({
  imports: [CatalogModule],
  providers: [LookupService],
  controllers: [LookupController],
})
export class LookupModule { }
