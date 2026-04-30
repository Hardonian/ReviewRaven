# Scraping Limitations

## Blocked Sites

Some platforms employ aggressive anti-bot measures. While our engine uses proxy rotation, the following conditions may cause analysis failure:
- **Captchas**: We do not solve captchas; the result will return as **UNKNOWN**.
- **Geographic Blocks**: Some products are only visible in specific regions.

## Partial Data

In some cases, we can only retrieve the first 100 reviews. 
- **Verdicts on Partial Data**: The confidence score will be lowered, and the user will be notified that the analysis is based on a sample.

## UNKNOWN Verdict Explanation

A verdict of **UNKNOWN** is returned when:
1. The platform blocks the request.
2. The product has fewer than 5 reviews (insufficient statistical significance).
3. The data format has changed and the scraper requires an update.
