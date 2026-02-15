process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres_dev_pass@localhost:5432/sum_api';
