import { BadRequestException } from '@nestjs/common';
import { TireNormalizer } from '../../catalog/domain/tire-normalizer';
import { LookupService } from './lookup.service';

interface MockTireVariant {
  loadIndex: number;
  speedIndex: string;
}

interface MockTireSize {
  id: string;
  sizeRaw: string;
  sizeNormalized: string;
}

interface MockTireCode {
  id: string;
  codePublic: string;
  tireSizeId: string;
}

interface MockCatalogService {
  getTireCodeByPublicCode: jest.Mock<Promise<MockTireCode | null>, [string]>;
  getTireSizeById: jest.Mock<Promise<MockTireSize | null>, [string]>;
  getVariantsByTireSizeId: jest.Mock<Promise<MockTireVariant[]>, [string]>;
  getTireSizeByNormalized: jest.Mock<Promise<MockTireSize | null>, [string]>;
  getTireCodeByTireSizeId: jest.Mock<Promise<MockTireCode | null>, [string]>;
}

interface MockSearchLogService {
  logSearch: jest.Mock<Promise<void>, [string, string, boolean]>;
}

interface MockPrisma {
  tireCode: {
    findMany: jest.Mock<Promise<MockTireCode[]>, []>;
  };
}

interface MockCache {
  get: jest.Mock<Promise<string | null>, [string]>;
  set: jest.Mock<Promise<void>, [string, string]>;
}

const makeCatalogService = (): MockCatalogService => ({
  getTireCodeByPublicCode: jest.fn<Promise<MockTireCode | null>, [string]>(),
  getTireSizeById: jest.fn<Promise<MockTireSize | null>, [string]>(),
  getVariantsByTireSizeId: jest.fn<Promise<MockTireVariant[]>, [string]>(),
  getTireSizeByNormalized: jest.fn<Promise<MockTireSize | null>, [string]>(),
  getTireCodeByTireSizeId: jest.fn<Promise<MockTireCode | null>, [string]>(),
});

const makeSearchLogService = (): MockSearchLogService => ({
  logSearch: jest.fn<Promise<void>, [string, string, boolean]>(),
});

const makePrisma = (): MockPrisma => ({
  tireCode: {
    findMany: jest.fn<Promise<MockTireCode[]>, []>(),
  },
});

const makeCache = (): MockCache => ({
  get: jest.fn<Promise<string | null>, [string]>().mockResolvedValue(null),
  set: jest.fn<Promise<void>, [string, string]>(),
});

describe('LookupService', () => {
  const tireSize: MockTireSize = {
    id: 'size-1',
    sizeRaw: '205/55R16',
    sizeNormalized: '205/55R16',
  };
  const tireCode: MockTireCode = {
    id: 'code-1',
    codePublic: '100',
    tireSizeId: 'size-1',
  };
  const variants: MockTireVariant[] = [
    { loadIndex: 91, speedIndex: 'V' },
    { loadIndex: 94, speedIndex: 'W' },
  ];

  let catalogService: MockCatalogService;
  let lookupService: LookupService;
  let searchLogService: MockSearchLogService;
  let prisma: MockPrisma;
  let cache: MockCache;

  beforeEach(() => {
    catalogService = makeCatalogService();
    searchLogService = makeSearchLogService();
    prisma = makePrisma();
    cache = makeCache();
    lookupService = new LookupService(
      catalogService as unknown as never,
      new TireNormalizer(),
      searchLogService as unknown as never,
      prisma as unknown as never,
      cache as unknown as never,
    );
  });

  it('returns variant when li/si are provided for code lookup', async () => {
    catalogService.getTireCodeByPublicCode.mockResolvedValue(tireCode);
    catalogService.getTireSizeById.mockResolvedValue(tireSize);
    catalogService.getVariantsByTireSizeId.mockResolvedValue(variants);

    const result = await lookupService.findByCode('100', { li: '91', si: 'V' });

    expect(result).toEqual({
      code: '100',
      sizeNormalized: '205/55R16',
      sizeRaw: '205/55R16',
      variant: { loadIndex: 91, speedIndex: 'V' },
    });
  });

  it('returns warning when variant is not found', async () => {
    catalogService.getTireCodeByPublicCode.mockResolvedValue(tireCode);
    catalogService.getTireSizeById.mockResolvedValue(tireSize);
    catalogService.getVariantsByTireSizeId.mockResolvedValue(variants);

    const result = await lookupService.findByCode('100', { li: '99', si: 'Z' });

    expect(result).toEqual({
      code: '100',
      sizeNormalized: '205/55R16',
      sizeRaw: '205/55R16',
      warning: 'variant_not_found',
    });
  });

  it('supports inline variant token in size lookup', async () => {
    catalogService.getTireSizeByNormalized.mockResolvedValue(tireSize);
    catalogService.getTireCodeByTireSizeId.mockResolvedValue(tireCode);
    catalogService.getVariantsByTireSizeId.mockResolvedValue(variants);

    const result = await lookupService.findBySize('205/55R16 91V');

    expect(result).toEqual({
      code: '100',
      sizeNormalized: '205/55R16',
      sizeRaw: '205/55R16',
      variant: { loadIndex: 91, speedIndex: 'V' },
    });
  });

  it('throws when only li or si is provided', async () => {
    await expect(
      lookupService.findByCode('100', { li: '91' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      lookupService.findBySize('205/55R16', { si: 'V' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lists public mappings with optional variants', async () => {
    prisma.tireCode.findMany.mockResolvedValue([
      {
        codePublic: '107',
        tireSize: {
          sizeRaw: '265/70R17',
          sizeNormalized: '265/70R17',
          tireVariants: [{ loadIndex: 91, speedIndex: 'V' }],
        },
      },
    ]);

    const result = await lookupService.listMappingsPublic();

    expect(result).toEqual([
      {
        codePublic: '107',
        sizeRaw: '265/70R17',
        sizeNormalized: '265/70R17',
        variants: [{ loadIndex: 91, speedIndex: 'V' }],
      },
    ]);
  });
});
