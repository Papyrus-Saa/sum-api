import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to run the seed script.');
}

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seed() {
  console.log('🌱 Seeding database...');

  // Clear existing data (development only)
  await prisma.searchLog.deleteMany();
  await prisma.tireVariant.deleteMany();
  await prisma.tireCode.deleteMany();
  await prisma.tireSize.deleteMany();

  // Tire sizes with their mappings
  const tireSizes = [
    { sizeRaw: '205/55R16', sizeNormalized: '205/55R16', width: 205, aspectRatio: 55, rimDiameter: 16, code: '100' },
    { sizeRaw: '195/65R15', sizeNormalized: '195/65R15', width: 195, aspectRatio: 65, rimDiameter: 15, code: '101' },
    { sizeRaw: '215/60R16', sizeNormalized: '215/60R16', width: 215, aspectRatio: 60, rimDiameter: 16, code: '102' },
    { sizeRaw: '225/45R17', sizeNormalized: '225/45R17', width: 225, aspectRatio: 45, rimDiameter: 17, code: '103' },
    { sizeRaw: '235/50R18', sizeNormalized: '235/50R18', width: 235, aspectRatio: 50, rimDiameter: 18, code: '104' },
    { sizeRaw: '245/40R18', sizeNormalized: '245/40R18', width: 245, aspectRatio: 40, rimDiameter: 18, code: '105' },
    { sizeRaw: '255/55R19', sizeNormalized: '255/55R19', width: 255, aspectRatio: 55, rimDiameter: 19, code: '106' },
    { sizeRaw: '265/70R17', sizeNormalized: '265/70R17', width: 265, aspectRatio: 70, rimDiameter: 17, code: '107' },
  ];

  for (const { sizeRaw, sizeNormalized, width, aspectRatio, rimDiameter, code } of tireSizes) {
    const tireSize = await prisma.tireSize.create({
      data: {
        sizeRaw,
        sizeNormalized,
        width,
        aspectRatio,
        rimDiameter,
      },
    });

    // Create corresponding tire code
    await prisma.tireCode.create({
      data: {
        codePublic: code,
        tireSizeId: tireSize.id,
      },
    });

    console.log(`✓ Created: ${sizeNormalized} → ${code}`);
  }

  // Add some variants (LI/SI) for specific sizes
  const firstSize = await prisma.tireSize.findUnique({
    where: { sizeNormalized: '205/55R16' },
  });

  if (firstSize) {
    await prisma.tireVariant.create({
      data: {
        tireSizeId: firstSize.id,
        loadIndex: 91,
        speedIndex: 'V',
      },
    });
    console.log('✓ Created variant: 205/55R16 91V');

    await prisma.tireVariant.create({
      data: {
        tireSizeId: firstSize.id,
        loadIndex: 94,
        speedIndex: 'W',
      },
    });
    console.log('✓ Created variant: 205/55R16 94W');
  }

  console.log('\n✅ Seed completed successfully!');
}

seed()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
