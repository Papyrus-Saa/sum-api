import { BadRequestException } from '@nestjs/common';
import { TireNormalizer } from '../../catalog/domain/tire-normalizer';
import { LookupService } from './lookup.service';

const makeCatalogService = () => ({
  getTireCodeByPublicCode: jest.fn(),
  getTireSizeById: jest.fn(),
  getVariantsByTireSizeId: jest.fn(),
  getTireSizeByNormalized: jest.fn(),
  getTireCodeByTireSizeId: jest.fn(),
});

describe('LookupService', () => {
  const tireSize = {
    id: 'size-1',
    sizeRaw: '205/55R16',
    sizeNormalized: '205/55R16',
  };
  const tireCode = {
    id: 'code-1',
    codePublic: '100',
    tireSizeId: 'size-1',
  };
  const variants = [
    { loadIndex: 91, speedIndex: 'V' },
    { loadIndex: 94, speedIndex: 'W' },
  ];

  let catalogService: ReturnType<typeof makeCatalogService>;
  let lookupService: LookupService;

  beforeEach(() => {
    catalogService = makeCatalogService();
    lookupService = new LookupService(
      // Mock object for testing - type safety not applicable in test setup
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      catalogService as any,
      new TireNormalizer(),
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
});
