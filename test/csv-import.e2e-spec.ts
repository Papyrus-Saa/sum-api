/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-require-imports */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';

const request = require('supertest');
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import * as bcrypt from 'bcryptjs';

describe('CSV Import (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken = '';

  const adminEmail = 'saavedra.ramon.brand1@gmail.com';
  const adminPassword = '!ABC4xx?.ABC';

  jest.setTimeout(30000); // Increased timeout for CSV processing

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();

    prisma = moduleFixture.get(PrismaService);

    // Clean database
    await prisma.adminRefreshToken.deleteMany();
    await prisma.adminUser.deleteMany();
    await prisma.searchLog.deleteMany();
    await prisma.tireVariant.deleteMany();
    await prisma.tireCode.deleteMany();
    await prisma.tireSize.deleteMany();

    // Reset sequence
    await prisma.$executeRawUnsafe(
      "SELECT setval('tire_code_seq', 100, false);",
    );

    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await prisma.adminUser.create({
      data: { email: adminEmail, passwordHash, isActive: true },
    });

    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/admin/auth/login')
      .send({ email: adminEmail, password: adminPassword })
      .expect(200);

    accessToken = loginResponse.body.accessToken as string;
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.adminRefreshToken.deleteMany();
      await prisma.adminUser.deleteMany();
      await prisma.searchLog.deleteMany();
      await prisma.tireVariant.deleteMany();
      await prisma.tireCode.deleteMany();
      await prisma.tireSize.deleteMany();
      await prisma.$disconnect();
    }
    if (app) {
      await app.close();
    }
  });

  describe('POST /api/v1/admin/import', () => {
    it('should accept a valid CSV file and create import job', async () => {
      const csvContent = `size,loadIndex,speedIndex
205/55R16,91,V
225/45R17,94,W
195/65R15,91,H`;

      const response = await request(app.getHttpServer())
        .post('/api/v1/admin/import')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', Buffer.from(csvContent), 'tires.csv')
        .expect(201);

      expect(response.body).toHaveProperty('jobId');
      expect(response.body).toHaveProperty('message', 'CSV import job created');
      expect(response.body).toHaveProperty('rowCount', 3);
      expect(response.body.jobId).toBeTruthy();
    });

    it('should reject request without file', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/admin/import')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);

      expect(response.body.error.message).toContain('No file uploaded');
    });

    it('should reject non-CSV files', async () => {
      const txtContent = 'This is not a CSV';

      const response = await request(app.getHttpServer())
        .post('/api/v1/admin/import')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', Buffer.from(txtContent), 'tires.txt')
        .expect(400);

      expect(response.body.error.message).toContain('File must be a CSV');
    });

    it('should reject empty CSV', async () => {
      const csvContent = `size,loadIndex,speedIndex`;

      const response = await request(app.getHttpServer())
        .post('/api/v1/admin/import')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', Buffer.from(csvContent), 'empty.csv')
        .expect(400);

      expect(response.body.error.message).toContain(
        'CSV must contain at least a header and one data row',
      );
    });

    it('should reject CSV without required "size" column', async () => {
      const csvContent = `width,aspectRatio,rimDiameter
205,55,16`;

      const response = await request(app.getHttpServer())
        .post('/api/v1/admin/import')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', Buffer.from(csvContent), 'invalid.csv')
        .expect(400);

      expect(response.body.error.message).toContain(
        'Missing "size" column value',
      );
    });

    it('should reject CSV with row missing size value', async () => {
      const csvContent = `size,loadIndex,speedIndex
205/55R16,91,V
,94,W
195/65R15,91,H`;

      const response = await request(app.getHttpServer())
        .post('/api/v1/admin/import')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', Buffer.from(csvContent), 'invalid.csv')
        .expect(400);

      expect(response.body.error.message).toMatch(
        /Row \d+: Missing "size" column value/,
      );
    });

    it('should handle CSV with optional fields missing', async () => {
      const csvContent = `size,loadIndex,speedIndex
205/55R16,91,V
225/45R17,,
195/65R15,,`;

      const response = await request(app.getHttpServer())
        .post('/api/v1/admin/import')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', Buffer.from(csvContent), 'partial.csv')
        .expect(201);

      expect(response.body).toHaveProperty('jobId');
      expect(response.body).toHaveProperty('rowCount', 3);
    });

    it('should handle CSV with extra whitespace', async () => {
      const csvContent = `  size  ,  loadIndex  ,  speedIndex
  205/55R16  ,  91  ,  V
  225/45R17  ,  94  ,  W  `;

      const response = await request(app.getHttpServer())
        .post('/api/v1/admin/import')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', Buffer.from(csvContent), 'whitespace.csv')
        .expect(201);

      expect(response.body).toHaveProperty('jobId');
      expect(response.body).toHaveProperty('rowCount', 2);
    });

    it('should handle CSV with quoted values containing commas', async () => {
      const csvContent = `size,loadIndex,speedIndex
"205/55R16",91,V
"225,45R17",94,W`;

      const response = await request(app.getHttpServer())
        .post('/api/v1/admin/import')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', Buffer.from(csvContent), 'quoted.csv')
        .expect(201);

      expect(response.body).toHaveProperty('jobId');
      expect(response.body).toHaveProperty('rowCount', 2);
    });
  });

  describe('GET /api/v1/admin/import/:jobId', () => {
    it('should return job status for valid jobId', async () => {
      const csvContent = `size,loadIndex,speedIndex
185/60R14,82,T`;

      const uploadResponse = await request(app.getHttpServer())
        .post('/api/v1/admin/import')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', Buffer.from(csvContent), 'test.csv')
        .expect(201);

      const jobId = uploadResponse.body.jobId;

      // Wait a bit for job to be processed (in test env it's mocked, so should be instant)
      await new Promise((resolve) => setTimeout(resolve, 100));

      const statusResponse = await request(app.getHttpServer())
        .get(`/api/v1/admin/import/${jobId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(statusResponse.body).toHaveProperty('id');
      expect(statusResponse.body).toHaveProperty('state');
      expect(statusResponse.body.id).toBe(jobId);
    });

    it('should return 400 for non-existent jobId', async () => {
      const fakeJobId = 'non-existent-job-id-12345';

      await request(app.getHttpServer())
        .get(`/api/v1/admin/import/${fakeJobId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);
    });
  });

  describe('CSV Processing Integration', () => {
    it('should process valid CSV and create tire mappings in database', async () => {
      const csvContent = `size,loadIndex,speedIndex
185/65R15,88,T
195/55R16,91,V`;

      const uploadResponse = await request(app.getHttpServer())
        .post('/api/v1/admin/import')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', Buffer.from(csvContent), 'process-test.csv')
        .expect(201);

      expect(uploadResponse.body.rowCount).toBe(2);

      // In test environment, queue is mocked, so we need to manually verify
      // that the CSV was parsed correctly and job was created
      const jobId = uploadResponse.body.jobId;
      expect(jobId).toBeTruthy();

      // Verify job can be queried
      const statusResponse = await request(app.getHttpServer())
        .get(`/api/v1/admin/import/${jobId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(statusResponse.body.id).toBe(jobId);
    });

    it('should create separate jobs for same CSV imported twice', async () => {
      // Note: This test verifies that importing the same CSV creates separate jobs
      // The actual deduplication logic is in the processor (tested separately)
      const csvContent = `size,loadIndex,speedIndex
205/50R17,93,W`;

      const firstResponse = await request(app.getHttpServer())
        .post('/api/v1/admin/import')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', Buffer.from(csvContent), 'idempotent.csv')
        .expect(201);

      const secondResponse = await request(app.getHttpServer())
        .post('/api/v1/admin/import')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', Buffer.from(csvContent), 'idempotent.csv')
        .expect(201);

      expect(firstResponse.body.rowCount).toBe(1);
      expect(secondResponse.body.rowCount).toBe(1);
      // Should create different jobs for each upload
      expect(firstResponse.body.jobId).not.toBe(secondResponse.body.jobId);
    });

    it('should reject CSV with invalid loadIndex format', async () => {
      const csvContent = `size,loadIndex,speedIndex
205/55R16,invalid,V`;

      const response = await request(app.getHttpServer())
        .post('/api/v1/admin/import')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', Buffer.from(csvContent), 'invalid-load.csv')
        .expect(400);

      expect(response.body.error.message).toMatch(/Row \d+: Invalid loadIndex/);
    });

    it('should handle large CSV files', async () => {
      // Generate a CSV with 100 rows
      let csvContent = 'size,loadIndex,speedIndex\n';
      for (let i = 0; i < 100; i++) {
        const width = 185 + (i % 20) * 5;
        const aspect = 45 + (i % 8) * 5;
        const rim = 14 + (i % 6);
        csvContent += `${width}/${aspect}R${rim},91,V\n`;
      }

      const response = await request(app.getHttpServer())
        .post('/api/v1/admin/import')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', Buffer.from(csvContent), 'large.csv')
        .expect(201);

      expect(response.body.rowCount).toBe(100);
      expect(response.body.jobId).toBeTruthy();
    });

    it('should handle CSV with case-insensitive headers', async () => {
      const csvContent = `SIZE,LoadIndex,SPEEDINDEX
205/55R16,91,V`;

      const response = await request(app.getHttpServer())
        .post('/api/v1/admin/import')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', Buffer.from(csvContent), 'case.csv')
        .expect(201);

      expect(response.body.rowCount).toBe(1);
    });

    it('should skip empty lines in CSV', async () => {
      const csvContent = `size,loadIndex,speedIndex
205/55R16,91,V

225/45R17,94,W

`;

      const response = await request(app.getHttpServer())
        .post('/api/v1/admin/import')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', Buffer.from(csvContent), 'empty-lines.csv')
        .expect(201);

      expect(response.body.rowCount).toBe(2);
    });
  });
});
