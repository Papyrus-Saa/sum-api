/**
 * Prisma 7 Configuration
 *
 * Database connection URL for Prisma CLI (migrate, generate, studio)
 * Runtime connection uses @prisma/adapter-pg in PrismaService
 *
 * See: https://pris.ly/d/config-datasource
 */

module.exports = {
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
};
