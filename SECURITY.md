# SECURITY.md - Safety & Infrastructure

## SSRF Protection
The analysis engine uses a strictly isolated proxy layer for all external URL fetching.
- **Allowlist Only**: Only recognized e-commerce domains are processed.
- **IP Rotation**: Prevents tracking of our infrastructure by scraped platforms.

## Scraping Limits
To remain a good citizen of the web:
- We adhere to `robots.txt` where possible.
- Rate limiting is enforced per user session to prevent abuse of our upstream providers.

## Data Storage (Zero Persistence)
- **No PII**: We do not collect names, emails, or IP addresses of our users.
- **No Analysis Logs**: Once a verdict is returned, the raw review data is purged from memory. We only store the deterministic verdict ID for sharing purposes.

## Safe Analysis Claims
We do not perform "hacking" or unauthorized access. We only analyze publicly available data that any consumer could see, but at a scale and speed impossible for a human.
