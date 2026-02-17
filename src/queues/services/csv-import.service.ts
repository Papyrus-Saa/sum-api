import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';
import { parse } from 'csv-parse/sync';

interface CsvRow {
  size: string;
  loadIndex?: number;
  speedIndex?: string;
}

type CsvImportJobPayload = {
  rows: CsvRow[];
  timestamp: string;
};

type CsvImportJobResult = unknown;

@Injectable()
export class CsvImportService {
  private readonly logger = new Logger(CsvImportService.name);

  constructor(
    @InjectQueue('csv-import')
    private readonly csvQueue: Queue<CsvImportJobPayload, CsvImportJobResult>,
  ) {}

  async addImportJob(rows: CsvRow[]): Promise<string> {
    this.logger.log(`Adding CSV import job with ${rows.length} rows`);

    const job = await this.csvQueue.add(
      'import',
      {
        rows,
        timestamp: new Date().toISOString(),
      },
      {
        attempts: 3, // Retry up to 3 times
        backoff: {
          type: 'exponential',
          delay: 2000, // Start with 2s, then 4s, then 8s
        },
        removeOnComplete: {
          age: 86400, // Keep successful jobs for 24 hours
          count: 100, // Keep last 100 successful jobs
        },
        removeOnFail: {
          age: 172800, // Keep failed jobs for 48 hours
          count: 200, // Keep last 200 failed jobs
        },
      },
    );

    if (!job.id) {
      throw new InternalServerErrorException(
        'Failed to create job: no job ID returned',
      );
    }

    return job.id;
  }

  async getJobStatus(jobId: string): Promise<{
    id: string;
    state: string;
    progress: unknown;
    result?: unknown;
    failedReason?: string;
  }> {
    const job = await this.csvQueue.getJob(jobId);

    if (!job) {
      throw new NotFoundException(`Job ${jobId} not found`);
    }

    const state = await job.getState();
    const progress = job.progress;
    const result = job.returnvalue;
    const failedReason = job.failedReason;

    return {
      id: job.id || jobId,
      state,
      progress,
      result,
      failedReason,
    };
  }

  async getActiveJobs(): Promise<
    Array<Job<CsvImportJobPayload, CsvImportJobResult>>
  > {
    return this.csvQueue.getActive();
  }

  async getCompletedJobs(
    limit = 10,
  ): Promise<Array<Job<CsvImportJobPayload, CsvImportJobResult>>> {
    return this.csvQueue.getCompleted(0, limit - 1);
  }

  async getFailedJobs(
    limit = 10,
  ): Promise<Array<Job<CsvImportJobPayload, CsvImportJobResult>>> {
    return this.csvQueue.getFailed(0, limit - 1);
  }

  parseCsvContent(content: string): CsvRow[] {
    const records = parse(content, {
      columns: (header: string[]) => header.map((h) => h.trim().toLowerCase()),
      skip_empty_lines: true,
      trim: true,
    }) as unknown as Array<Record<string, string>>;

    if (!records.length) {
      throw new BadRequestException(
        'CSV must contain at least a header and one data row',
      );
    }

    const rows: CsvRow[] = [];

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const size = record.size;

      if (!size) {
        throw new BadRequestException(
          `Row ${i + 2}: Missing "size" column value`,
        );
      }

      const row: CsvRow = { size };
      const loadIndexValue = record.loadindex;
      const speedIndexValue = record.speedindex;

      if (loadIndexValue) {
        const parsed = parseInt(loadIndexValue, 10);
        if (Number.isNaN(parsed)) {
          throw new BadRequestException(`Row ${i + 2}: Invalid loadIndex`);
        }
        row.loadIndex = parsed;
      }

      if (speedIndexValue) {
        row.speedIndex = speedIndexValue;
      }

      rows.push(row);
    }

    return rows;
  }
}
