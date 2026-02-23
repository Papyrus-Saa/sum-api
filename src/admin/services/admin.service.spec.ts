import { AdminService } from './admin.service';
import type { Cache } from 'cache-manager';
import { TireNormalizer } from '../../catalog/domain/tire-normalizer';
import { PrismaService } from '../../prisma/prisma.service';

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
    findMany: jest.Mock<Promise<MockTireCode[]>, []>;
  };
}

interface MockCache {
  del: jest.Mock<Promise<void>, [string]>;
}

describe('AdminService', () => {
  const makePrisma = (): MockPrisma => ({
    tireCode: {
      findMany: jest.fn<Promise<MockTireCode[]>, []>(),
    },
  });

  const makeCache = (): MockCache => ({
    del: jest.fn<Promise<void>, [string]>(),
  });

  it('returns mappings with optional variants', async () => {
    const prismaMock = makePrisma();
    const prisma = prismaMock as unknown as PrismaService;
    const cache = makeCache() as unknown as Cache;
    const service = new AdminService(prisma, new TireNormalizer(), cache);

    prismaMock.tireCode.findMany.mockResolvedValue([
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
