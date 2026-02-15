import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request = require('supertest');
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

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

    await prisma.searchLog.deleteMany();
    await prisma.tireVariant.deleteMany();
    await prisma.tireCode.deleteMany();
    await prisma.tireSize.deleteMany();

    const tireSize = await prisma.tireSize.create({
      data: {
        sizeRaw: '205/55R16',
        sizeNormalized: '205/55R16',
        width: 205,
        aspectRatio: 55,
        rimDiameter: 16,
      },
    });

    await prisma.tireCode.create({
      data: {
        codePublic: '100',
        tireSizeId: tireSize.id,
      },
    });

    await prisma.tireVariant.create({
      data: {
        tireSizeId: tireSize.id,
        loadIndex: 91,
        speedIndex: 'V',
      },
    });
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.searchLog.deleteMany();
      await prisma.tireVariant.deleteMany();
      await prisma.tireCode.deleteMany();
      await prisma.tireSize.deleteMany();
    }
    if (app) {
      await app.close();
    }
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('GET /api/v1/lookup?code=100 returns size', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/lookup?code=100')
      .expect(200);

    expect(response.body).toMatchObject({
      code: '100',
      sizeNormalized: '205/55R16',
      sizeRaw: '205/55R16',
    });
  });

  it('GET /api/v1/lookup?size=205/55 r16 returns size', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/lookup?size=205/55%20r16')
      .expect(200);

    expect(response.body).toMatchObject({
      code: '100',
      sizeNormalized: '205/55R16',
      sizeRaw: '205/55R16',
    });
  });

  it('GET /api/v1/lookup?code=100&li=91&si=V returns variant', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/lookup?code=100&li=91&si=V')
      .expect(200);

    expect(response.body).toMatchObject({
      code: '100',
      variant: { loadIndex: 91, speedIndex: 'V' },
    });
  });

  it('POST /api/v1/admin/mappings creates mapping', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/admin/mappings')
      .send({ codePublic: '200', sizeRaw: '215/60R16' })
      .expect(201);

    expect(response.body).toMatchObject({
      codePublic: '200',
      sizeNormalized: '215/60R16',
    });
  });

  it('POST /api/v1/admin/mappings rejects duplicate size', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/admin/mappings')
      .send({ codePublic: '201', sizeRaw: '205/55R16' })
      .expect(409);
  });
});
