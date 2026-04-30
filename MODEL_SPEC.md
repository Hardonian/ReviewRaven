# Review Scoring Model Specification

## Overview

ReviewRaven uses a deterministic, rule-based scoring engine powered by shared-intelligence to analyze product review patterns and produce a trust verdict.

## Architecture

The scoring pipeline uses shared packages:
- `@reviewraven/shared-core` - typed result contracts, error envelopes, degraded state model
- `@reviewraven/shared-intelligence` - signal registry, scoring engine, confidence engine, evidence model
- `@reviewraven/shared-diagnostics` - session tracking, event logging, hash-only identifiers
- `@reviewraven/shared-cost-control` - request cost tracking, per-domain buckets
- `@reviewraven/shared-infra` - cache, circuit breaker, rate limiting, structured logs

## Input

The analysis engine receives scraped data:

- Product title
- Average rating (0-5)
- Rating count (number of ratings)
- Review count (number of reviews)
- Review text snippets (up to 5)
- Review timestamps
- Reviewer names
- Verified purchase status

## Signals

ReviewRaven extends shared-intelligence signals with review-specific detectors:

### Shared Base Signals (from shared-intelligence)

| ID | Name | Type | Weight | Description |
| :--- | :--- | :--- | :--- | :--- |
| SIG-S001 | Burst_Arrival | SUSPICIOUS | -40 | 50+ reviews in < 12 hours |
| SIG-S002 | Verified_Purchase_Deficit | SUSPICIOUS | -30 | Non-verified ratio > 80% |
| SIG-S003 | Superlative_Clumping | SUSPICIOUS | -15 | Excessive "best", "perfect", "amazing" |
| SIG-S004 | Sentiment_Mismatch | SUSPICIOUS | -20 | 5-star with neutral text |
| SIG-S006 | Opening_Identity | SUSPICIOUS | -25 | Same starting phrases |
| SIG-S008 | Author_Patterns | SUSPICIOUS | -35 | Sequential reviewer naming |
| SIG-S009 | Rating_Skew | SUSPICIOUS | -25 | Unusually high rating |
| SIG-S010 | Low_Volume_Risk | SUSPICIOUS | -20 | Insufficient reviews |
| SIG-S022 | Duplicate_Timestamps | SUSPICIOUS | -40 | Same timestamp posts |
| SIG-S024 | Emotional_Extremity | SUSPICIOUS | -10 | ALL CAPS or excessive ! |
| SIG-S100 | Ultimate_Suspicion | SUSPICIOUS | -100 | AI prompt leak detected |
| SIG-G001 | Verified_Purchase_Verified | SAFE | 25 | Purchase confirmed |
| SIG-G005 | Unique_Phrasing | SAFE | 10 | Natural language |

### ReviewRaven-Specific Extensions

| ID | Name | Type | Weight | Description |
| :--- | :--- | :--- | :--- | :--- |
| SIG-R001 | Review_Timing_Anomaly | SUSPICIOUS | -30 | Reviews at unusual hours |
| SIG-R002 | Rating_Skew_Extreme | SUSPICIOUS | -25 | Heavily skewed distribution |
| SIG-R003 | Language_Repetition | SUSPICIOUS | -20 | Identical phrases across reviews |
| SIG-R004 | Verified_Purchase_Absence | SUSPICIOUS | -35 | No verified badges |
| SIG-R005 | Sentiment_Text_Mismatch | SUSPICIOUS | -25 | Star vs text contradiction |
| SIG-R006 | Reviewer_Diversity_Low | SUSPICIOUS | -20 | Shared naming patterns |
| SIG-R007 | Suspicious_Burst | SUSPICIOUS | -40 | Volume spike inconsistent with lifecycle |
| SIG-R008 | Category_Normalization_Fail | SUSPICIOUS | -15 | Patterns inconsistent with category |

## Scoring

Total risk score = sum of weighted signals (capped at 0-100).
Negative weights (SUSPICIOUS) add to risk; positive weights (SAFE) reduce risk.

## Verdict Thresholds

| Risk Score | Verdict | Meaning |
| :--- | :--- | :--- |
| 0-30 | BUY | Low suspicion; authentic patterns |
| 31-60 | CAUTION | Moderate suspicion; scrutiny warranted |
| 61-100 | AVOID | High suspicion; multiple concerning patterns |
| N/A | UNKNOWN | Insufficient data or degraded collection |

## Confidence Calculation

Base confidence = signalStrength + 20, with penalties for:
- Degraded scraping: -40
- Low review volume (< 10): -20
- Caps applied based on data completeness (30%, 60%, 75%, 95%)

## Determinism

The scoring engine is fully deterministic. Given the same input data, it will always produce the same output.

## Output Contract

API responses follow the shared-core contract:
```json
{
  "schemaVersion": "1.0.0",
  "ok": true,
  "resultId": "uuid",
  "verdict": "BUY|CAUTION|AVOID|UNKNOWN",
  "confidence": 0-100,
  "confidenceExplanation": "string",
  "reasons": ["string"],
  "signals": [{"id", "name", "type", "weight", "explanation"}],
  "evidence": [{"signalId", "signal", "snippet", "source"}],
  "limitations": ["string"],
  "degraded": boolean,
  "diagnosticsId": "uuid"
}
```

## Legal Guardrails

ReviewRaven never uses: scam, fraud, guaranteed fake, illegal.
Instead uses: suspicious pattern, low trust signal, inconsistent review behavior, unable to verify.
