import { describe, it, expect } from 'vitest';
import { detectCategory, getCategoryAdjustments } from './category';

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

describe('getCategoryAdjustments', () => {
  it('returns adjustments for electronics', () => {
    const adjustments = getCategoryAdjustments('electronics');
    const ratingSkew = adjustments.find(a => a.signalId === 'SIG-S009');
    const volumePenalty = adjustments.find(a => a.signalId === 'SIG-S010');
    expect(ratingSkew?.weightModifier).toBeGreaterThan(1);
    expect(volumePenalty?.weightModifier).toBeLessThan(1);
  });

  it('returns adjustments for apparel', () => {
    const adjustments = getCategoryAdjustments('apparel');
    const verifiedRatio = adjustments.find(a => a.signalId === 'SIG-S002');
    const genericLang = adjustments.find(a => a.signalId === 'SIG-S003');
    expect(verifiedRatio?.weightModifier).toBeGreaterThan(1);
    expect(genericLang?.weightModifier).toBeLessThan(1);
  });

  it('returns empty array for unknown', () => {
    const adjustments = getCategoryAdjustments('unknown');
    expect(adjustments.length).toBe(0);
  });

  it('returns adjustments for niche that reduce volume penalty', () => {
    const adjustments = getCategoryAdjustments('niche');
    const volumePenalty = adjustments.find(a => a.signalId === 'SIG-S010');
    expect(volumePenalty?.weightModifier).toBeLessThan(0.5);
  });
});
