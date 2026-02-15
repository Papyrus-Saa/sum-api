# SUM API

Backend for TireCode lookup and admin operations.

A modular NestJS backend that manages universal tire size to public code mappings with strong domain rules, structured error handling, and production-ready architecture.

## Overview

SUM API powers the TireCode system.

Core idea: one tire size maps to exactly one public code (1:1 relationship).

Example:

```
205/55R16 <-> 100
```

The API supports:

- Lookup by public code
- Lookup by tire size
- Optional LI/SI (load index / speed index)
- Admin management of mappings
- Swagger documentation
- Health monitoring endpoint

## Architecture

- Modular monolith (NestJS)
- Domain-driven structure
- PostgreSQL + Prisma ORM
- Layered architecture:
  - controllers
  - services (use-cases)
  - domain (pure business rules)
  - repositories (database access)
- Centralized error handling
- Environment-based configuration

## Domain Rules

- One tire size maps to exactly one public code (1:1).
- A public code is immutable once assigned.
- Tire variants (LI/SI) are optional extensions of a base tire size.
- All size inputs must be normalized before lookup.
- Speed index (SI) must be a single letter (e.g., V, W, H).

## Data Integrity

Enforced at database level via Prisma migrations:

- UNIQUE(size_normalized)
- UNIQUE(code_public)
- UNIQUE(tire_size_id) in tire_codes
- Composite UNIQUE(tire_size_id, load_index, speed_index) in tire_variants

These constraints guarantee consistency and prevent duplicate mappings.

## API Design and Error Handling

All API responses follow a structured error format:

```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "Email is invalid",
    "details": {},
    "requestId": "optional-trace-id"
  }
}
```

Features:

- Centralized HTTP exception filter
- Standardized error codes
- Predictable response structure
- Request ID support for tracing
- Separation of validation errors and internal errors

## API Documentation (Swagger)

Interactive API documentation is available via Swagger.

Local:

```
http://localhost:8080/api/docs
```

Swagger includes:

- Public lookup endpoints
- Admin endpoints
- Validation rules
- Request and response examples

## Admin Module

The system includes an authenticated admin module.

Features:

- Create tire mappings
- Update mappings
- Delete mappings (optional soft delete)
- Create tire variants (LI/SI)
- Role-based access control (admin)
- Validation on all inputs

Authentication is handled via JWT. All admin actions are validated and logged.

## Endpoints

Health:

```
GET /health
```

Response:

```json
{ "status": "ok" }
```

## Requirements

- Node.js 20+
- PostgreSQL 14+

## Run dev in 5 lines

```bash
cp .env.example .env
npm install
npm run start:dev
# new terminal
curl http://localhost:8080/health
```

## Environment

- DATABASE_URL = PostgreSQL connection string
- PORT = server port (defaults to 8080)

Environment variables are validated at startup. Never commit secrets.

## Scripts

- npm run start:dev
- npm run build
- npm run start:prod
- npm run test
- npm run lint

## Structure

```
src/
  catalog/      # Tire sizes, codes, variants
  prisma/       # Database access layer
  common/       # Filters, errors, interceptors
  health/       # Readiness endpoints
```

## Scalability Strategy

The system is currently built as a modular monolith. Planned evolution if traffic increases:

- Extract search service if lookup traffic grows significantly
- Extract import service for heavy CSV processing
- Introduce Redis caching layer for high-frequency lookups
- Horizontal scaling behind load balancer
- Add search logs for usage analytics

## License

This project is private and not licensed for redistribution.
