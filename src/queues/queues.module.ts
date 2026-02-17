import { Module } from '@nestjs/common';
import { BullModule, getQueueToken } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CsvImportProcessor } from './processors/csv-import.processor';
import { CsvImportService } from './services/csv-import.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CatalogModule } from '../catalog/catalog.module';

const isTest =
  process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;

interface TestJob {
  id: string;
  name: string;
  data: unknown;
  returnvalue: unknown;
  failedReason: string | undefined;
  progress: number;
  getState: () => Promise<string>;
}

// Simple in-memory job store for testing
const testJobs = new Map<string, TestJob>();
let testJobCounter = 0;

const testQueueProvider = {
  provide: getQueueToken('csv-import'),
  useValue: {
    add: (name: string, data: unknown): Promise<TestJob> => {
      const jobId = `test-job-${++testJobCounter}`;
      const job: TestJob = {
        id: jobId,
        name,
        data,
        returnvalue: undefined,
        failedReason: undefined,
        progress: 0,
        getState: () => Promise.resolve('waiting'),
      };
      testJobs.set(jobId, job);
      return Promise.resolve(job);
    },
    getJob: (jobId: string): Promise<TestJob | null> =>
      Promise.resolve(testJobs.get(jobId) || null),
    getActive: (): Promise<TestJob[]> => Promise.resolve([]),
    getCompleted: (): Promise<TestJob[]> => Promise.resolve([]),
    getFailed: (): Promise<TestJob[]> => Promise.resolve([]),
  },
};

const queueImports = isTest
  ? [PrismaModule, CatalogModule]
  : [
      BullModule.forRootAsync({
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          connection: {
            host: configService.get('REDIS_HOST', 'redis'),
            port: configService.get('REDIS_PORT', 6379),
          },
        }),
        inject: [ConfigService],
      }),
      BullModule.registerQueue({
        name: 'csv-import',
      }),
      PrismaModule,
      CatalogModule,
    ];

const queueProviders = isTest
  ? [CsvImportService, testQueueProvider]
  : [CsvImportProcessor, CsvImportService];

@Module({
  imports: queueImports,
  providers: queueProviders,
  exports: [CsvImportService],
})
export class QueuesModule {}
