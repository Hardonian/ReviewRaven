# Diagnostics

ReviewRaven uses `@reviewraven/shared-diagnostics` for event tracking, CRM integration, and observability. This document describes the diagnostic events, privacy guarantees, and session tracking.

## CRM Events

All events are emitted through the shared-diagnostics event API. Events follow a standardized schema with typed payloads.

### Lifecycle Events

| Event | Trigger | Payload |
| --- | --- | --- |
| `analyze_started` | URL analysis begins | `{ hashed_url, domain, session_id, timestamp }` |
| `analyze_completed` | Analysis returns a verdict | `{ hashed_url, domain, verdict, score, confidence, session_id, duration_ms }` |
| `analyze_failed` | Analysis throws an error | `{ hashed_url, domain, error_type, session_id, retry_count }` |

### Verdict Events

| Event | Trigger | Payload |
| --- | --- | --- |
| `unknown_result` | Verdict is UNKNOWN | `{ hashed_url, domain, reason, session_id }` |
| `degraded_result` | Verdict returned with low confidence (<0.5) | `{ hashed_url, domain, verdict, confidence, session_id }` |
| `high_risk_result` | Verdict is AVOID | `{ hashed_url, domain, score, signals_triggered, session_id }` |

### Cache Events

| Event | Trigger | Payload |
| --- | --- | --- |
| `cache_hit` | Analysis result served from cache | `{ hashed_url, domain, cache_age_ms, session_id }` |
| `cache_miss` | No cached result found, full analysis required | `{ hashed_url, domain, session_id }` |

### Domain Events

| Event | Trigger | Payload |
| --- | --- | --- |
| `domain_blocked` | Domain is on the blocked list | `{ hashed_url, domain, session_id }` |
| `unsupported_domain` | Domain is not a supported store | `{ hashed_url, domain, session_id }` |

### User Action Events

| Event | Trigger | Payload |
| --- | --- | --- |
| `share_clicked` | User clicks share on result card | `{ hashed_url, verdict, session_id, share_method }` |

## Privacy Guarantees

All diagnostic events enforce the following privacy constraints:

### No Raw URLs

URLs are never included in event payloads. All URLs are hashed using a one-way hash function before emission. The hash is deterministic (same URL produces same hash) but irreversible.

### No PII

No personally identifiable information is included in any diagnostic event. This includes:
- IP addresses
- User agent strings
- Email addresses
- Account identifiers
- Geographic location

### Hashed URLs Only

The only URL-related data in events is a SHA-256 hash of the normalized URL. This allows correlation of events for the same product without exposing the actual URL.

## Session Tracking

Each analysis session is assigned a unique session ID at the start of the `analyze_started` event. The session ID:

- Is a UUID v4 generated client-side
- Persists across all events for a single URL analysis
- Is not linked to any user identity
- Expires after 24 hours
- Is reset on page reload

### Session Event Flow

```
analyze_started
  |
  +-- cache_hit -> (return cached result) -> analyze_completed
  |
  +-- cache_miss
        |
        +-- domain_blocked -> unknown_result
        |
        +-- unsupported_domain -> unknown_result
        |
        +-- (full analysis)
              |
              +-- analyze_completed
                    |
                    +-- high_risk_result (if AVOID)
                    +-- degraded_result (if low confidence)
                    +-- unknown_result (if UNKNOWN)
```

## Event Schema

All events conform to the shared-diagnostics event schema:

```typescript
interface DiagnosticEvent {
  event_name: string;
  session_id: string;
  timestamp: string; // ISO 8601
  payload: Record<string, unknown>;
}
```

Events are validated against the schema before emission. Invalid events are dropped and logged locally.
