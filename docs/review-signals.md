# Review Signals

ReviewGhost analyzes multiple signals to detect suspicious review patterns.

## Signals Detected

### 1. Rating Distribution

- Checks if average rating is unusually high
- Authentic products typically have ratings between 3.8–4.5
- Near-perfect ratings (4.8+) often indicate review manipulation

### 2. Review Volume

- Products with very few reviews have insufficient data
- A minimum of 10+ reviews is needed for reasonable confidence
- Higher review counts improve analysis reliability

### 3. Review Language

- Detects stock phrases common in fake reviews:
  - "Great product!" / "Love it!" / "Highly recommend"
  - "Exactly as described" / "Fast shipping"
  - "Best purchase" / "Five stars"
- High concentration of these phrases is a low trust signal

### 4. Review Diversity

- Authentic reviews vary in length and phrasing
- Fake reviews often share similar openings or structure
- Measures uniqueness of review beginnings and average word count

### 5. Keyword Density

- Detects promotional language patterns:
  - Excessive calls-to-action ("Buy now!", "Get yours!")
  - Superlatives in all caps ("AMAZING!!!", "PERFECT!!!")
  - Repeated exclamation marks
- High promotional content suggests manufactured reviews

### 6. Data Quality

- Assesses completeness of available product data
- Missing title, rating, or review counts reduce confidence
- Partial data leads to more cautious verdicts

## False Positive Mitigation

- No single signal determines the verdict
- All signals are weighted equally
- Confidence score reflects data limitations
- UNKNOWN verdict is used when data is insufficient

## What We Do NOT Claim

- We do not identify specific fake reviews
- We do not accuse sellers of fraud
- We do not make legal claims about product quality
- We report "suspicious patterns" and "low trust signals" only
