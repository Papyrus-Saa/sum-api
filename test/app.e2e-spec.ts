/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-return */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';

const request = require('supertest');
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { requestIdMiddleware } from '../src/common/middleware/request-id.middleware';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let seedCodePublic = '100';

  jest.setTimeout(20000);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(requestIdMiddleware);
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

    await prisma.$executeRawUnsafe(
      "SELECT setval('tire_code_seq', 100, false);",
    );

    const tireSize = await prisma.tireSize.create({
      data: {
        sizeRaw: '205/55R16',
        sizeNormalized: '205/55R16',
        width: 205,
        aspectRatio: 55,
        rimDiameter: 16,
      },
    });

    const tireCode = await prisma.tireCode.create({
      data: {
        tireSizeId: tireSize.id,
      },
    });
    seedCodePublic = tireCode.codePublic;

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
      await prisma.$disconnect();
    }
    if (app) {
      await app.close();
    }
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!!!');
  });

  it('/ (GET) includes x-request-id header', async () => {
    const response = await request(app.getHttpServer()).get('/').expect(200);

    expect(response.headers['x-request-id']).toBeDefined();
    expect(response.headers['x-request-id']).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('GET /api/v1/lookup?code=100 returns size', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/lookup?code=${seedCodePublic}`)
      .expect(200);

    expect(response.body).toMatchObject({
      code: seedCodePublic,
      sizeNormalized: '205/55R16',
      sizeRaw: '205/55R16',
    });
  });

  it('GET /api/v1/lookup?size=205/55 r16 returns size', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/lookup?size=205/55%20r16')
      .expect(200);

    expect(response.body).toMatchObject({
      code: seedCodePublic,
      sizeNormalized: '205/55R16',
      sizeRaw: '205/55R16',
    });
  });

  it('GET /api/v1/lookup?code=100&li=91&si=V returns variant', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/lookup?code=${seedCodePublic}&li=91&si=V`)
      .expect(200);

    expect(response.body).toMatchObject({
      code: seedCodePublic,
      variant: { loadIndex: 91, speedIndex: 'V' },
    });
  });

  it('POST /api/v1/admin/mappings creates mapping with auto-generated code', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/admin/mappings')
      .send({ sizeRaw: '215/60R16', loadIndex: 95, speedIndex: 'H' })
      .expect(201);

    expect(response.body).toMatchObject({
      codePublic: expect.any(String),
      sizeNormalized: '215/60R16',
    });
  });

  it('POST /api/v1/admin/mappings generates consecutive codes', async () => {
    const first = await request(app.getHttpServer())
      .post('/api/v1/admin/mappings')
      .send({ sizeRaw: '235/55R18' })
      .expect(201);

    const second = await request(app.getHttpServer())
      .post('/api/v1/admin/mappings')
      .send({ sizeRaw: '245/45R18' })
      .expect(201);

    const firstCode = parseInt(first.body.codePublic, 10);
    const secondCode = parseInt(second.body.codePublic, 10);

    expect(secondCode).toBe(firstCode + 1);
  });

  it('POST /api/v1/admin/mappings rejects duplicate size', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/admin/mappings')
      .send({ sizeRaw: '205/55R16' })
      .expect(409);
  });
});
