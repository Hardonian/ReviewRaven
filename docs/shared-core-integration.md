# Shared-Core Integration

ReviewRaven integrates five shared packages that provide cross-cutting functionality. This document describes each package, what it provides, and how ReviewRaven uses it.

## Packages

### @reviewraven/shared-core

**Purpose:** Core utilities, shared types, and base abstractions.

**Provides:**
- Common TypeScript types (`Verdict`, `Signal`, `AnalysisResult`, `ProductData`)
- URL parsing and normalization utilities
- Hash functions for privacy-safe URL identification
- Base error types and error-handling utilities

**Used by ReviewRaven for:**
- Type definitions across the analysis pipeline
- URL hashing before any diagnostic event emission
- Standardized error handling in scraper and analyzer modules

### @reviewraven/shared-intelligence

**Purpose:** Signal detection engine and scoring logic.

**Provides:**
- Base signal registry and signal evaluation framework
- Generic signal definitions (rating anomalies, volume checks, language patterns)
- Score aggregation and verdict calculation
- Category-specific weighting rules

**Used by ReviewRaven for:**
- Core signal evaluation pipeline
- Score-to-verdict mapping (BUY / CAUTION / AVOID)
- Signal weighting and confidence calculation

**Extensions:** ReviewRaven adds domain-specific signals (SIG-R001 through SIG-R008) that extend the shared-intelligence base signals. See [review-signals.md](review-signals.md).

### @reviewraven/shared-diagnostics

**Purpose:** Event tracking, CRM integration, and observability.

**Provides:**
- Diagnostic event emission API
- CRM event schema and validation
- Session tracking utilities
- Privacy-safe event payloads (no raw URLs, no PII)

**Used by ReviewRaven for:**
- Emitting analyze lifecycle events (started, completed, failed)
- Tracking cache hits/misses
- Recording verdict outcomes and risk levels
- Share-click attribution

See [diagnostics.md](diagnostics.md) for the full event catalog.

### @reviewraven/shared-cost-control

**Purpose:** Request cost tracking, caching, and budget enforcement.

**Provides:**
- Per-request cost accounting
- Per-domain cost bucket tracking
- Cache hit/miss recording
- Retry cost tracking
- Scraper/fetch cost visibility

**Used by ReviewRaven for:**
- Tracking cost of each URL analysis
- Enforcing per-domain rate and cost limits
- Recording cache behavior for performance monitoring
- Visibility into scraper costs per platform

See [cost-controls.md](cost-controls.md) for details.

### @reviewraven/shared-infra

**Purpose:** Infrastructure configuration, deployment, and environment management.

**Provides:**
- Environment variable schemas and validation
- Deployment configuration templates
- Health check endpoints
- Logging configuration

**Used by ReviewRaven for:**
- Environment validation at startup
- Standardized logging across services
- Health check endpoint for monitoring

## Integration Points

```
ReviewRaven App
  |
  +-- shared-core (types, URL hashing, errors)
  |
  +-- shared-intelligence (signal evaluation, scoring)
  |     |
  |     +-- ReviewRaven extensions (SIG-R001 to SIG-R008)
  |
  +-- shared-diagnostics (events, sessions, CRM)
  |
  +-- shared-cost-control (cost tracking, caching, retries)
  |
  +-- shared-infra (config, logging, health checks)
```

## Removed Duplicated Logic

The following previously duplicated logic has been removed from ReviewRaven and replaced with shared package equivalents:

- URL parsing and domain extraction -> `@reviewraven/shared-core`
- Score aggregation and verdict calculation -> `@reviewraven/shared-intelligence`
- Event emission and session tracking -> `@reviewraven/shared-diagnostics`
- Cost accounting and cache tracking -> `@reviewraven/shared-cost-control`
- Environment validation -> `@reviewraven/shared-infra`
