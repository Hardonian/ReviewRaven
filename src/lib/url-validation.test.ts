import { describe, it, expect } from 'vitest';
import { validateUrl } from './url-validation';

describe('validateUrl', () => {
  it('rejects empty input', () => {
    const result = validateUrl('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('URL is required');
  });

  it('rejects whitespace-only input', () => {
    const result = validateUrl('   ');
    expect(result.valid).toBe(false);
  });

  it('accepts valid Amazon URL', () => {
    const result = validateUrl('https://www.amazon.com/dp/B08N5WRWNW');
    expect(result.valid).toBe(true);
    expect(result.isAllowedHost).toBe(true);
    expect(result.host).toContain('amazon.com');
  });

  it('accepts valid Walmart URL', () => {
    const result = validateUrl('https://www.walmart.com/ip/123456');
    expect(result.valid).toBe(true);
    expect(result.isAllowedHost).toBe(true);
  });

  it('accepts valid Best Buy URL', () => {
    const result = validateUrl('https://www.bestbuy.com/site/12345.p');
    expect(result.valid).toBe(true);
    expect(result.isAllowedHost).toBe(true);
  });

  it('adds https:// if missing', () => {
    const result = validateUrl('www.amazon.com/dp/B08N5WRWNW');
    expect(result.valid).toBe(true);
    expect(result.url?.startsWith('https://')).toBe(true);
  });

  it('rejects http:// URLs', () => {
    const result = validateUrl('http://www.amazon.com/dp/B08N5WRWNW');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Only HTTPS URLs are allowed');
  });

  it('rejects localhost URLs', () => {
    const result = validateUrl('https://localhost/product');
    expect(result.valid).toBe(false);
  });

  it('rejects 10.x.x.x IPs', () => {
    const result = validateUrl('https://10.0.0.1/product');
    expect(result.valid).toBe(false);
  });

  it('rejects 172.16.x.x IPs', () => {
    const result = validateUrl('https://172.16.0.1/product');
    expect(result.valid).toBe(false);
  });

  it('rejects 172.31.x.x IPs', () => {
    const result = validateUrl('https://172.31.255.255/product');
    expect(result.valid).toBe(false);
  });

  it('rejects 192.168.x.x IPs', () => {
    const result = validateUrl('https://192.168.1.1/product');
    expect(result.valid).toBe(false);
  });

  it('rejects 127.x.x.x IPs', () => {
    const result = validateUrl('https://127.0.0.1/product');
    expect(result.valid).toBe(false);
  });

  it('rejects invalid URL format', () => {
    const result = validateUrl('not a url at all');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid URL format');
  });

  it('rejects unsupported hosts', () => {
    const result = validateUrl('https://www.target.com/product');
    expect(result.valid).toBe(true);
    expect(result.isAllowedHost).toBe(false);
  });

  it('handles Amazon subdomains', () => {
    const result = validateUrl('https://www.amazon.co.uk/dp/B08N5WRWNW');
    expect(result.valid).toBe(true);
    expect(result.isAllowedHost).toBe(true);
  });
});
