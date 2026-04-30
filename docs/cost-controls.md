# Cost Controls

ReviewRaven uses `@reviewraven/shared-cost-control` for request cost tracking, caching, and budget enforcement. This document describes the cost control mechanisms.

## Request Cost Tracking

Every URL analysis incurs a measurable cost. Costs are tracked per request and aggregated per session.

### Cost Components

| Component | Description | Unit |
| --- | --- | --- |
| Fetch cost | HTTP request to product page | credits |
| Parse cost | DOM parsing and data extraction | credits |
| Analysis cost | Signal evaluation and scoring | credits |
| Total cost | Sum of all components | credits |

Each cost component is recorded in the request cost object:

```typescript
interface RequestCost {
  fetch_cost: number;
  parse_cost: number;
  analysis_cost: number;
  total_cost: number;
  timestamp: string;
}
```

## Per-Domain Cost Buckets

Costs are tracked per domain using cost buckets. Each supported domain has its own bucket:

| Domain | Bucket Key |
| --- | --- |
| Amazon (all regions) | `amazon` |
| Walmart | `walmart` |
| Best Buy | `bestbuy` |

Each bucket tracks:
- Total credits consumed in the current window
- Number of requests made
- Average cost per request
- Cache hit rate

### Bucket Limits

Buckets enforce configurable limits:
- Maximum credits per time window
- Maximum requests per time window
- Cooldown period when limits are reached

When a bucket reaches its limit, subsequent requests for that domain are rejected with a rate-limit response until the window resets.

## Cache Hit/Miss Tracking

Cache behavior is tracked alongside cost metrics:

| Metric | Description |
| --- | --- |
| Cache hits | Number of requests served from cache |
| Cache misses | Number of requests requiring full analysis |
| Cache hit rate | hits / (hits + misses) |
| Average cache age | Mean age of cached results served |
| Cost saved | Estimated credits saved by cache hits |

Cache hits bypass the full analysis pipeline, reducing cost to near-zero. Cache misses incur the full cost of fetch, parse, and analysis.

## Retry Cost Tracking

When a request fails and is retried, each retry incurs additional cost. Retry costs are tracked separately:

| Metric | Description |
| --- | --- |
| Retry count | Number of retries for a request |
| Retry cost | Total credits consumed by retries |
| Retry success rate | Percentage of retries that succeeded |

Retry costs are attributed to the same domain bucket as the original request.

## Scraper/Fetch Cost Visibility

The cost control system provides visibility into scraper and fetch costs per platform:

### Per-Platform Cost Breakdown

| Platform | Avg Fetch Cost | Avg Parse Cost | Avg Total Cost |
| --- | --- | --- | --- |
| Amazon | tracked | tracked | tracked |
| Walmart | tracked | tracked | tracked |
| Best Buy | tracked | tracked | tracked |

Costs vary by platform due to differences in page size, DOM complexity, and anti-bot measures.

### Cost Monitoring

Cost metrics are emitted as diagnostic events and available through:
- Real-time cost dashboard (internal)
- Per-session cost summary in analysis results
- Aggregated cost reports per time window

## Cost Enforcement

The cost control system enforces limits at multiple levels:

1. **Per-request:** Rejects requests that would exceed the per-request cost cap
2. **Per-domain:** Rejects requests when domain bucket is exhausted
3. **Per-session:** Rejects requests when session cost budget is exceeded
4. **Global:** Rejects requests when global cost budget is exceeded

When a limit is enforced, the system returns an appropriate error response and emits a diagnostic event.
