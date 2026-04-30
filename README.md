# ReviewRaven

> Watch the patterns, detect the deception.

ReviewRaven is a single-function B2C app that analyzes product URLs and returns a trust verdict based on review-trust signals.

**Paste a product URL -> receive BUY / CAUTION / AVOID / UNKNOWN based on review-trust signals.**

## What it does

1. Paste a product link (Amazon, Walmart, or Best Buy)
2. Get a trust verdict: **BUY**, **CAUTION**, **AVOID**, or **UNKNOWN**
3. See the reasoning behind the verdict

## What it does NOT do

- No accounts required
- No dashboards
- No affiliate links or spam
- No claims of fraud -- only "suspicious patterns" and "low trust signals"

## Supported stores

- Amazon (all regional domains)
- Walmart
- Best Buy

## Architecture

ReviewRaven is built on a shared-core architecture. Duplicated logic has been extracted into shared packages used across products:

| Package | Purpose |
| --- | --- |
| `@reviewraven/shared-core` | Core utilities, types, and base abstractions |
| `@reviewraven/shared-intelligence` | Signal detection engine and scoring logic |
| `@reviewraven/shared-diagnostics` | Event tracking, CRM integration, and observability |
| `@reviewraven/shared-cost-control` | Request cost tracking, caching, and budget enforcement |
| `@reviewraven/shared-infra` | Infrastructure configuration, deployment, and environment management |

See [docs/shared-core-integration.md](docs/shared-core-integration.md) for details.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run lint
npm run typecheck
npm run build
```

## Test

```bash
npm run test
```

## Verdict thresholds

| Score | Verdict | Meaning |
| --- | --- | --- |
| 0-30 | BUY | No significant suspicious patterns detected |
| 31-60 | CAUTION | Moderate concern -- review patterns warrant scrutiny |
| 61-100 | AVOID | High concern -- multiple suspicious patterns detected |
| -- | UNKNOWN | Insufficient data to produce a reliable verdict |

## Documentation

- [Shared-Core Integration](docs/shared-core-integration.md)
- [Review Signals](docs/review-signals.md)
- [Diagnostics](docs/diagnostics.md)
- [Cost Controls](docs/cost-controls.md)
- [Go-Live Report](docs/release/go-live-report.md)

## License

See [LICENSE](LICENSE).
