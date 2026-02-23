import { AdminService } from './admin.service';
import { TireNormalizer } from '../../catalog/domain/tire-normalizer';

describe('AdminService', () => {
  const makePrisma = () => ({
    tireCode: {
      findMany: jest.fn(),
    },
  });

  const makeCache = () => ({
    del: jest.fn(),
  });

  it('returns mappings with optional variants', async () => {
    const prisma = makePrisma();
    const cache = makeCache();
    const service = new AdminService(
      prisma as any,
      new TireNormalizer(),
      cache as any,
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
