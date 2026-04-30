# ReviewGhost

> Before you buy it, ghost the fake reviews.

ReviewGhost is a single-function B2C app that analyzes product URLs and returns a trust verdict based on review patterns.

## What it does

1. Paste a product link (Amazon, Walmart, or Best Buy)
2. Get a trust verdict: **BUY**, **CAUTION**, or **AVOID**
3. See the reasoning behind the verdict

## What it does NOT do

- No accounts required
- No dashboards
- No affiliate links or spam
- No claims of fraud — only "suspicious patterns" and "low trust signals"

## Supported stores

- Amazon (all regional domains)
- Walmart
- Best Buy

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
|-------|---------|---------|
| 0–30 | BUY | No significant suspicious patterns detected |
| 31–60 | CAUTION | Moderate concern — review patterns warrant scrutiny |
| 61–100 | AVOID | High concern — multiple suspicious patterns detected |

## License

See [LICENSE](LICENSE).
