import { Module } from '@nestjs/common';
import { AdminService } from './services/admin.service';
import { AdminController } from './controllers/admin.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CatalogModule } from '../catalog/catalog.module';

@Module({
  imports: [PrismaModule, CatalogModule],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule { }
