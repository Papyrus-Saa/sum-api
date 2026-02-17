# Changelog

## [Unreleased]

### Added
- Project scaffolding with NestJS and TypeScript strict mode
- Prisma ORM with PostgreSQL adapter
- Health endpoint
- Project documentation and environment setup
- Tire size normalization and parsing
- Lookup endpoints (code and size)
- Admin endpoints for mapping management
- CSV import with BullMQ
- Redis caching (Keyv)
- Rate limiting
- Swagger documentation
- E2e integration tests (24 tests total)
  - API endpoint tests (lookup, admin operations)
  - CSV import integration tests (17 tests)
  - Format validation, error handling, edge cases
  - Mocked Redis/BullMQ for test isolation
- Observability improvements
  - Request ID tracing (UUID per request)
  - Structured JSON logging (requests, responses, errors)
  - x-request-id header in all responses
  - Duration tracking for performance monitoring
  - Correlation between logs and errors via requestId
  - Search logging for analytics (all lookups tracked)
- Analytics endpoints
  - GET /api/v1/admin/analytics/overview (search statistics)
  - GET /api/v1/admin/analytics/top-searches (most searched queries)
  - GDPR-compliant IP hashing (SHA-256)
  - Success rate calculation
  - Breakdown by query type (code/size)

### Planned
- CSV import robustness (retry logic, detailed error reporting)
- Search logs integration tests
