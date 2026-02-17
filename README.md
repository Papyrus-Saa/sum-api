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

## Current Capabilities

- Rate limiting: 20 requests/10s burst + 60 requests/minute steady
- Redis cache via Keyv (TTL 1 hour)
- BullMQ background jobs for CSV imports
- 1:1 code-size relationship with auto-generated, immutable public codes
- Swagger docs at /api
- Search analytics and logging (all lookups tracked for insights)
- GDPR-compliant IP hashing

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
- Request ID tracing and structured logging

## Observability

The system includes comprehensive observability features for monitoring and debugging:

**Request Tracing:**
- Every request gets a unique UUID (requestId)
- RequestId is returned in response header: `x-request-id`
- RequestId is included in error responses for correlation
- Enables end-to-end request tracking across logs

**Structured Logging:**
- JSON-formatted logs with consistent structure
- Request logs include: method, url, ip, userAgent, requestId
- Response logs include: statusCode, duration, requestId
- Error logs distinguish between 4xx (warnings) and 5xx (errors)
- All logs are timestamped with ISO 8601 format

**Log Examples:**
```json
// Incoming request
{
  "type": "request",
  "requestId": "ea733e95-065f-411c-a981-d6d59cc2f0db",
  "method": "GET",
  "url": "/api/v1/lookup?code=100",
  "ip": "::1",
  "userAgent": "curl/8.7.1"
}

// Successful response
{
  "type": "response",
  "requestId": "ea733e95-065f-411c-a981-d6d59cc2f0db",
  "statusCode": 200,
  "duration": "5ms"
}

// Exception
{
  "type": "exception",
  "requestId": "82d1948b-40b1-482a-bff4-8feb10104fa5",
  "method": "GET",
  "path": "/health",
  "statusCode": 404,
  "message": "Cannot GET /health"
}
```

## Domain Rules

- One tire size maps to exactly one public code (1:1).
- Public codes are automatically generated and immutable.
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

## Analytics & Search Logging

The system automatically logs all search queries for analytics and insights.

**Features:**

- **Automatic logging**: Every lookup is tracked (code, size, success/failure)
- **Privacy-first**: IP addresses are hashed with SHA-256 (GDPR compliant)
- **Real-time analytics**: Success rates, query types, trending searches
- **Performance metrics**: Track which searches are most common

**Analytics Endpoints:**

```
GET /api/v1/admin/analytics/overview?days=7
GET /api/v1/admin/analytics/top-searches?limit=10&days=7
```

**Example Analytics Response:**

```json
{
  "totalSearches": 1250,
  "successfulSearches": 1100,
  "failedSearches": 150,
  "successRate": "88.00%",
  "searchesByType": [
    { "type": "code", "count": 650 },
    { "type": "size", "count": 600 }
  ],
  "recentSearches": [
    {
      "query": "205/55R16",
      "queryType": "size",
      "resultFound": true,
      "createdAt": "2026-02-16T14:30:00.000Z"
    }
  ]
}
```

**Use Cases:**

- Identify most searched tire sizes for inventory planning
- Track search success rates to improve data coverage
- Detect patterns in failed searches (missing tire codes)
- Monitor API usage trends over time

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
- npm run test:e2e
- npm run lint

## Testing

The project includes comprehensive e2e (end-to-end) integration tests:

**Run all e2e tests:**
```bash
npm run test:e2e
```

**Run specific test suite:**
```bash
npm run test:e2e -- csv-import.e2e-spec.ts
```

**Test Coverage:**
- 24 e2e tests (7 app + 17 CSV import)
- CSV import validation (format, headers, data types)
- API endpoint validation (lookup, admin operations)
- Error handling and edge cases
- Large file processing (100+ rows)

**Test Environment:**
- Uses in-memory mocks for Redis and BullMQ (no external dependencies)
- Tests run sequentially to avoid database conflicts
- Automatic database cleanup after each suite
- 30s timeout for import processing tests

Tests verify:
- CSV parsing with csv-parse library
- Transaction atomicity
- Cache invalidation (both code and size lookups)
- Auto-generated sequential tire codes
- Duplicate detection and error handling

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
- Expand caching and queueing as needed for scale
- Horizontal scaling behind load balancer
- Add search logs for usage analytics

## License

This project is private and not licensed for redistribution.
