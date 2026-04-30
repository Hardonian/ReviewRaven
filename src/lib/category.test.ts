import { describe, it, expect } from 'vitest';
import { detectCategory, getCategoryWeights } from './category';

describe('detectCategory', () => {
  it('detects electronics from title', () => {
    expect(detectCategory('Wireless Bluetooth Headphones', 'https://amazon.com/dp/B001')).toBe('electronics');
  });

  it('detects apparel from title', () => {
    expect(detectCategory('Running Shoes for Men', 'https://walmart.com/ip/123')).toBe('apparel');
  });

  it('detects home from title', () => {
    expect(detectCategory('Kitchen Blender 1200W', 'https://amazon.com/dp/B002')).toBe('home');
  });

  it('detects beauty from title', () => {
    expect(detectCategory('Moisturizer Face Cream SPF', 'https://amazon.com/dp/B003')).toBe('beauty');
  });

  it('detects books from title', () => {
    expect(detectCategory('Novel Paperback Edition Bestseller', 'https://amazon.com/dp/B004')).toBe('books');
  });

  it('detects niche from title', () => {
    expect(detectCategory('WordPress Plugin Template', 'https://amazon.com/dp/B005')).toBe('niche');
  });

  it('returns unknown for unclassifiable products', () => {
    expect(detectCategory('Mystery Item X', 'https://amazon.com/dp/B006')).toBe('unknown');
  });

  it('returns unknown when title is null', () => {
    expect(detectCategory(null, 'https://amazon.com/dp/B007')).toBe('unknown');
  });

  it('uses URL hints when title is empty', () => {
    expect(detectCategory('', 'https://amazon.com/gaming-console')).toBe('electronics');
  });
});

describe('getCategoryWeights', () => {
  it('returns weights for electronics', () => {
    const weights = getCategoryWeights('electronics');
    expect(weights.ratingSkewWeight).toBeGreaterThan(1);
    expect(weights.volumeWeight).toBeLessThan(1);
  });

  it('returns weights for apparel', () => {
    const weights = getCategoryWeights('apparel');
    expect(weights.verifiedRatioWeight).toBeGreaterThan(1);
    expect(weights.genericLanguageWeight).toBeLessThan(1);
  });

  it('returns default weights for unknown', () => {
    const weights = getCategoryWeights('unknown');
    expect(weights.ratingSkewWeight).toBe(1.0);
    expect(weights.volumeWeight).toBe(1.0);
  });

  it('returns weights for niche that reduce volume penalty', () => {
    const weights = getCategoryWeights('niche');
    expect(weights.volumeWeight).toBeLessThan(0.5);
  });
});
