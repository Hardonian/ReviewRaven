# Review Signals

ReviewRaven analyzes multiple signals to detect suspicious review patterns. These signals extend the base signals provided by `@reviewraven/shared-intelligence`.

## Shared-Intelligence Base Signals

The shared-intelligence package provides generic signal detection:

| Signal ID | Name | Description |
| --- | --- | --- |
| SIG-001 | Rating Anomaly | Detects unusually high or low average ratings |
| SIG-002 | Volume Check | Evaluates whether review count is sufficient for analysis |
| SIG-003 | Language Pattern | Detects stock phrases common in manufactured reviews |
| SIG-004 | Review Diversity | Measures variation in review length and phrasing |
| SIG-005 | Keyword Density | Detects promotional language patterns |
| SIG-006 | Data Quality | Assesses completeness of available product data |

## ReviewRaven-Specific Signals (SIG-R001 to SIG-R008)

ReviewRaven extends the shared-intelligence signals with domain-specific signals tailored to e-commerce review analysis.

### SIG-R001: Rating Distribution Skew

Detects if the distribution of star ratings is unnaturally concentrated at 5 stars. Authentic products typically show a spread across 2-5 stars. A distribution with >80% five-star ratings triggers this signal.

**Extends:** SIG-001 (Rating Anomaly)

### SIG-R002: Review Burst Detection

Identifies clusters of reviews posted within a short time window. A burst of 10+ reviews within 24 hours on a product with otherwise sparse review history is flagged.

**Extends:** SIG-002 (Volume Check)

### SIG-R003: Stock Phrase Concentration

Measures the concentration of known stock phrases in review text. Phrases include "Great product!", "Love it!", "Highly recommend", "Exactly as described", "Fast shipping", "Best purchase", "Five stars". A concentration above 30% triggers this signal.

**Extends:** SIG-003 (Language Pattern)

### SIG-R004: Review Length Uniformity

Detects when reviews have suspiciously similar lengths. Authentic reviews vary significantly in word count. If >60% of reviews fall within a 10-word range, this signal fires.

**Extends:** SIG-004 (Review Diversity)

### SIG-R005: Promotional Keyword Density

Measures density of promotional language: calls-to-action ("Buy now!", "Get yours!"), superlatives in all caps ("AMAZING!!!", "PERFECT!!!"), and repeated exclamation marks. Density above threshold triggers this signal.

**Extends:** SIG-005 (Keyword Density)

### SIG-R006: Verified Purchase Ratio

Compares the ratio of verified vs. unverified reviews. A low verified purchase ratio (<40%) on a product with many reviews is a low trust signal.

**New:** ReviewRaven-specific, no shared-intelligence base.

### SIG-R007: Reviewer History Pattern

Analyzes whether reviewers have a pattern of only leaving 5-star reviews across multiple products. Reviewers with 90%+ five-star history contribute to this signal.

**New:** ReviewRaven-specific, no shared-intelligence base.

### SIG-R008: Cross-Platform Consistency

Compares the product's rating and review patterns across multiple platforms (e.g., Amazon vs. Walmart). Significant discrepancies (>1.5 star difference) trigger this signal.

**New:** ReviewRaven-specific, no shared-intelligence base.

## Signal Weighting

Signals are weighted according to category-specific rules. Not all signals carry equal weight:

| Signal | Weight | Category |
| --- | --- | --- |
| SIG-R001 | 0.15 | Rating |
| SIG-R002 | 0.10 | Volume |
| SIG-R003 | 0.20 | Language |
| SIG-R004 | 0.10 | Diversity |
| SIG-R005 | 0.15 | Language |
| SIG-R006 | 0.10 | Verification |
| SIG-R007 | 0.10 | Reviewer |
| SIG-R008 | 0.10 | Cross-platform |

## False Positive Mitigation

- No single signal determines the verdict
- All signals are weighted according to category-specific rules
- Confidence score reflects data limitations
- UNKNOWN verdict is used when data is insufficient

## What We Do NOT Claim

- We do not identify specific fake reviews
- We do not accuse sellers of fraud
- We do not make legal claims about product quality
- We report "suspicious patterns" and "low trust signals" only
