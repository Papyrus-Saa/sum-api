# SUM API

Backend for TireCode lookup and admin operations.

## Requirements

- Node.js 20+
- PostgreSQL 14+

## Run dev in 5 lines

```bash
cp .env.example .env
npm install
npm run start:dev
# new terminal
curl http://localhost:3000/health
```

## Environment

- `DATABASE_URL` = PostgreSQL connection string

## Scripts

- `npm run start:dev`
- `npm run test`
- `npm run lint`

## Architecture

- Modular monolith (NestJS)
- Domain-driven: pure logic in `domain/`, use-cases in `services/`
- PostgreSQL + Prisma with adapter-pg

## Endpoints

- `GET /health` -> `{ status: "ok" }`

## Structure

- `src/catalog` tire and code mappings
- `src/prisma` database access layer
- `src/common` shared filters, errors, interceptors
- `src/health` readiness endpoints
