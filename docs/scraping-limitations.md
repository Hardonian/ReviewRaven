# Scraping Limitations

## Blocked Sites

Some platforms employ anti-bot measures (CAPTCHAs, rate limiting, JavaScript challenges). When blocked:
- The scraper will detect the block and return partial data if available
- If no data can be extracted, the verdict will be **UNKNOWN**
- We do not solve CAPTCHAs or bypass security measures

## Partial Data

In some cases, only limited product data is available (e.g., title and rating but no review text).
- **Verdicts on Partial Data**: The confidence score will be lowered, and the limitations section will note which data was unavailable
- Signal analysis requiring specific data (review snippets, timestamps, verified badges) will return "insufficient data" rather than producing false signals

## UNKNOWN Verdict Explanation

A verdict of **UNKNOWN** is returned when:
1. The platform blocks the HTTP request entirely
2. The response contains a CAPTCHA or bot challenge page
3. The response is too small to contain meaningful product data
4. The product has fewer than 5 reviews (insufficient statistical significance)
5. The page structure has changed and the scraper no longer recognizes the data format

## What We Do NOT Do

- No CAPTCHA solving
- No headless browser execution
- No proxy rotation or IP farming
- No execution of arbitrary JavaScript
- No login or authentication to e-commerce sites

## Graceful Degradation

The system is designed to always return a verdict, even with partial data:
- If some data is available, analysis proceeds with a lower confidence score
- Limitations are clearly communicated to the user
- Next steps are provided to help the user make an informed decision
