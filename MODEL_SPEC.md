# Review Scoring Model Specification

## Overview

ReviewGhost uses a deterministic, rule-based scoring engine to analyze product review patterns and produce a trust verdict.

## Input

The analysis engine receives scraped data:
- Product title
- Average rating (0–5)
- Rating count (number of ratings)
- Review count (number of reviews)
- Review text snippets (up to 5)
- Review timestamps

## Signals

Each signal produces a score from 0–30:

### 1. Rating Distribution
Evaluates whether the average rating is suspiciously high.

| Rating | Score | Rationale |
|--------|-------|-----------|
| ≥ 4.8 | 25 | Unusually high; often indicates inflated reviews |
| 4.5–4.7 | 10 | Above typical authentic range |
| 4.0–4.4 | 0 | Normal range for authentic products |
| < 4.0 | 15 | Low rating suggests genuine dissatisfaction |

### 2. Review Volume
Assesses whether there is enough data to form a reliable judgment.

| Count | Score | Rationale |
|-------|-------|-----------|
| 0 | 20 | No data; cannot assess |
| 1–9 | 15 | Too few reviews for confidence |
| 10–49 | 5 | Moderate data |
| 50+ | 0 | Sufficient data |

### 3. Review Language
Detects generic, templated phrases common in fake reviews.

| Generic Ratio | Score | Rationale |
|---------------|-------|-----------|
| > 60% | 30 | High concentration of stock phrases |
| 30–60% | 15 | Mixed signals |
| < 30% | 0 | Language appears natural |

### 4. Review Diversity
Measures variation in review length and phrasing.

| Metric | Score | Rationale |
|--------|-------|-----------|
| Avg < 8 words | 20 | Unusually short reviews |
| Opening uniqueness < 70% | 25 | Similar review beginnings |
| Otherwise | 0 | Good diversity |

### 5. Keyword Density
Detects promotional language patterns and excessive emphasis.

| Spam Ratio | Score | Rationale |
|------------|-------|-----------|
| > 40% | 25 | High promotional content |
| 20–40% | 10 | Some promotional language |
| < 20% | 0 | Natural language |

### 6. Data Quality
Assesses completeness of available product data.

| Available Fields | Score | Rationale |
|-----------------|-------|-----------|
| 0 | 30 | Minimal data; analysis unreliable |
| 1–2 | 15 | Partial data; limited confidence |
| 3+ | 0 | Comprehensive data |

## Scoring

Total score = sum of all signal scores (capped at 100).

## Verdict Thresholds

| Total Score | Verdict | Meaning |
|-------------|---------|---------|
| 0–30 | BUY | Low suspicion; patterns consistent with authentic reviews |
| 31–60 | CAUTION | Moderate suspicion; some patterns warrant scrutiny |
| 61–100 | AVOID | High suspicion; multiple concerning patterns detected |

## Confidence Calculation

Confidence = max(0, min(100, 100 - (score × 0.5) - (limitations × 10)))

## Determinism

The scoring engine is fully deterministic. Given the same input data, it will always produce the same output. There is no randomness, no AI black box, and no external model dependency.

## Limitations

- Scraping may be blocked by some sites; in this case, verdict is UNKNOWN
- Only visible review snippets are analyzed; full review text may reveal additional patterns
- Timestamp analysis is limited by data availability
- Results should be treated as a heuristic, not a definitive judgment
