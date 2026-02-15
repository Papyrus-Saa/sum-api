import { Module } from '@nestjs/common';
import { CatalogService } from './services/catalog.service';
import { TireSizeRepository } from './repositories/tire-size.repository';
import { TireCodeRepository } from './repositories/tire-code.repository';
import { TireVariantRepository } from './repositories/tire-variant.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { TireNormalizer } from './domain/tire-normalizer';

@Module({
  imports: [PrismaModule],
  providers: [
    CatalogService,
    TireSizeRepository,
    TireCodeRepository,
    TireVariantRepository,
    TireNormalizer,
  ],
  exports: [CatalogService, TireNormalizer],
})
export class CatalogModule { }
