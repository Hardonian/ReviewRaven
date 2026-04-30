# MODEL_SPEC.md - ReviewGhost Intelligence Layer

## Product Definition
ReviewGhost is a deterministic signal analysis engine. It does not "guess" if a review is real; it measures the statistical probability that a review set deviates from organic consumer behavior.

## Constraints
- **No Natural Language Generation (NLG)**: Verdicts must be based on hard-coded signal thresholds, not generative AI hallucination.
- **Time Sensitivity**: Recent review spikes carry higher weight than historical data.
- **Platform Neutrality**: Logic must adapt to different platform review structures (e.g., Amazon verified vs. unverified).

## Signal Categories
1. **Temporal Signals**: Volume spikes in short durations.
2. **Linguistic Signals**: Repetitive phrasing across different accounts.
3. **Account Signals**: Reviewer history diversity and account age.
4. **Metadata Signals**: Discrepancies between star ratings and text sentiment.

## Verdict Logic
| Score Range | Verdict | Actionable Advice |
|-------------|---------|-------------------|
| 0.0 - 0.2   | BUY     | Patterns appear organic. Proceed with standard caution. |
| 0.2 - 0.5   | CAUTION | Minor suspicious patterns detected. Read 3-star reviews. |
| 0.5 - 1.0   | AVOID   | High concentration of low-trust signals. Likely manipulated. |
| N/A         | UNKNOWN | Insufficient data or blocked access. |

## Edge Cases
- **Incentivized Reviews**: Often contain specific disclosure phrases; these are flagged as CAUTION signals.
- **Review Merging**: When a brand merges a new product into an old listing to inherit reviews.

## Non-Goals
- We are not a price tracker.
- We are not a product recommendation engine (we don't tell you *what* to buy, only if the reviews are trustworthy).
- We do not store user PII or product history.
