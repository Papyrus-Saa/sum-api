import { AdminService } from './admin.service';
import { TireNormalizer } from '../../catalog/domain/tire-normalizer';

interface MockTireVariant {
  loadIndex: number | null;
  speedIndex: string | null;
}

interface MockTireSize {
  sizeRaw: string;
  sizeNormalized: string;
  tireVariants: MockTireVariant[];
}

interface MockTireCode {
  id: string;
  codePublic: string;
  tireSize: MockTireSize;
}

interface MockPrisma {
  tireCode: {
    findMany: jest.Mock<Promise<MockTireCode[]>>;
  };
}

interface MockCache {
  del: jest.Mock<Promise<void>>;
}

describe('AdminService', () => {
  const makePrisma = (): MockPrisma => ({
    tireCode: {
      findMany: jest.fn<Promise<MockTireCode[]>, []>(),
    },
  });

  const makeCache = (): MockCache => ({
    del: jest.fn<Promise<void>, []>(),
  });

  it('returns mappings with optional variants', async () => {
    const prisma = makePrisma();
    const cache = makeCache();
    const service = new AdminService(
      prisma as unknown as never,
      new TireNormalizer(),
      cache as unknown as never,
    );

    prisma.tireCode.findMany.mockResolvedValue([
      {
        id: 'code-1',
        codePublic: '100',
        tireSize: {
          sizeRaw: '205/55R16',
          sizeNormalized: '205/55R16',
          tireVariants: [
            { loadIndex: 91, speedIndex: 'V' },
            { loadIndex: null, speedIndex: null },
          ],
        },
      },
    ]);

    const result = await service.listMappings();

    expect(result).toEqual([
      {
        id: 'code-1',
        codePublic: '100',
        sizeRaw: '205/55R16',
        sizeNormalized: '205/55R16',
        variants: [
          { loadIndex: 91, speedIndex: 'V' },
          { loadIndex: undefined, speedIndex: undefined },
        ],
      },
    ]);
  });
});
