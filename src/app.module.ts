import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './config/configuration';
import { validationSchema } from './config/validation';
import { PrismaModule } from './prisma/prisma.module';
import { CatalogModule } from './catalog/catalog.module';
import { LookupModule } from './lookup/lookup.module';
import { AdminModule } from './admin/admin.module';
import { ObservabilityModule } from './observability/observability.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
      validationOptions: {
        abortEarly: false,
        convert: true,
      },
    }),
    PrismaModule,
    CatalogModule,
    LookupModule,
    AdminModule,
    ObservabilityModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
