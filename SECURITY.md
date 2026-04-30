# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.1.0   | Yes       |

## Security Features

### SSRF Protection
- Only HTTPS URLs are accepted
- Internal IP ranges are blocked (10.x, 172.16-31.x, 192.168.x, 127.x)
- Localhost access is blocked
- Only allowed e-commerce hosts are processed

### Rate Limiting
- In-memory rate limiting at 5 requests per minute per IP
- Prevents abuse of the scraping engine

### Input Validation
- URL format validation before any processing
- HTML sanitization of scraped content
- No script execution — only static HTML parsing

### Data Handling
- No PII collected or stored
- No cookies or tracking beyond rate limiting
- All analytics are anonymous event counts

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly.

1. Do not open a public issue
2. Contact the maintainer directly
3. Include steps to reproduce and potential impact

We will respond within 48 hours.
