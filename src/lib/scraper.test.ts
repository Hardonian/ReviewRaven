import { describe, it, expect } from 'vitest';
import { scrapeProduct } from './scraper';
import { beforeEach, afterEach, vi } from 'vitest';

describe('scraper', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns blocked state when fetch fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));

    const result = await scrapeProduct('https://www.amazon.com/dp/B08N5WRWNW');

    expect(result.blocked).toBe(true);
    expect(result.title).toBe(null);
    expect(result.rating).toBe(null);
  });

  it('returns blocked state on redirect', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      status: 301,
      text: () => Promise.resolve(''),
    } as Response);

    const result = await scrapeProduct('https://www.amazon.com/dp/B08N5WRWNW');

    expect(result.blocked).toBe(true);
  });

  it('returns blocked state on 403/404', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      status: 403,
      text: () => Promise.resolve(''),
    } as Response);

    const result = await scrapeProduct('https://www.amazon.com/dp/B08N5WRWNW');

    expect(result.blocked).toBe(true);
  });

  it('returns blocked state when response is too small', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      status: 200,
      text: () => Promise.resolve('<html></html>'),
    } as Response);

    const result = await scrapeProduct('https://www.amazon.com/dp/B08N5WRWNW');

    expect(result.blocked).toBe(true);
  });

  it('extracts product title from meta tags', async () => {
    const html = `<html>
      <head>
        <meta property="og:title" content="Test Product Name" />
      </head>
      <body></body>
    </html>`;

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      status: 200,
      text: () => Promise.resolve('<html>' + html + ' '.repeat(600) + '</html>'),
    } as Response);

    const result = await scrapeProduct('https://www.amazon.com/dp/B08N5WRWNW');

    expect(result.blocked).toBe(false);
    expect(result.title).toBe('Test Product Name');
  });

  it('extracts rating from JSON-LD', async () => {
    const html = `<html>
      <head><meta property="og:title" content="Test Product" /></head>
      <body>
        <script type="application/ld+json">
        {"aggregateRating":{"ratingValue":"4.5","ratingCount":"1234","reviewCount":"567"}}
        </script>
      </body>
    </html>`;

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      status: 200,
      text: () => Promise.resolve('<html>' + html + ' '.repeat(600) + '</html>'),
    } as Response);

    const result = await scrapeProduct('https://www.amazon.com/dp/B08N5WRWNW');

    expect(result.rating).toBe(4.5);
    expect(result.ratingCount).toBe(1234);
    expect(result.reviewCount).toBe(567);
  });

  it('detects captcha and returns blocked', async () => {
    const html = `<html><body><div id="captcha">Please verify you are human</div></body></html>`;

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      status: 200,
      text: () => Promise.resolve('<html>' + html + ' '.repeat(600) + '</html>'),
    } as Response);

    const result = await scrapeProduct('https://www.amazon.com/dp/B08N5WRWNW');

    expect(result.blocked).toBe(true);
  });

  it('handles timeout gracefully', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      () => new Promise((_, reject) => setTimeout(() => reject(new DOMException('', 'AbortError')), 50))
    );

    const result = await scrapeProduct('https://www.amazon.com/dp/B08N5WRWNW');

    expect(result.blocked).toBe(true);
  });
});
