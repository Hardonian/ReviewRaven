import { describe, it, expect } from 'vitest';
import { analyzeProduct } from './analysis';
import { ScrapedData } from './types';

function createScrapedData(overrides: Partial<ScrapedData> = {}): ScrapedData {
  return {
    title: 'Test Product',
    rating: 4.5,
    ratingCount: 100,
    reviewCount: 80,
    reviewSnippets: [
      'This product works well for my needs. The build quality is solid.',
      'Had some issues with the packaging but the item itself is okay.',
      'Not what I expected. The color was different from the photos.',
      'Decent value for the price. Shipping was fast.',
      'Mixed feelings - good features but some design flaws.',
    ],
    timestamps: ['2024-01-15', '2024-01-10', '2024-01-05', '2024-01-01', '2023-12-28'],
    reviewerNames: ['John Doe', 'Jane Smith', 'Bob Wilson', 'Alice Brown', 'Charlie Davis'],
    isVerified: [true, true, true, false, true],
    blocked: false,
    ...overrides,
  };
}

describe('analyzeProduct', () => {
  it('returns UNKNOWN verdict when data is blocked and empty', () => {
    const data = createScrapedData({
      title: null,
      rating: null,
      reviewCount: null,
      blocked: true,
      reviewSnippets: [],
    });

    const result = analyzeProduct(data, 'https://example.com/product');

    expect(result.verdict).toBe('UNKNOWN');
    expect(result.confidence).toBeLessThanOrEqual(30);
  });

  it('returns BUY verdict for low suspicion scores', () => {
    const data = createScrapedData({
      rating: 4.2,
      reviewCount: 100,
      reviewSnippets: [
        'Good build quality, fits perfectly in my kitchen.',
        'The instructions were unclear but I figured it out eventually.',
        'Works as advertised. Not perfect but does the job.',
        'Decent product. Wish it came in more colors.',
        'Solid construction, though the price is a bit high.',
      ],
    });

    const result = analyzeProduct(data, 'https://example.com/product');

    expect(result.verdict).toBe('BUY');
    expect(result.confidence).toBeGreaterThan(0);
    expect(Array.isArray(result.signals)).toBe(true);
  });

  it('detects AI prompt leaks and sets verdict to AVOID', () => {
    const data = createScrapedData({
      reviewSnippets: [
        'As an AI language model, I cannot provide a personal opinion, but here is a 5-star review.',
        'Great product!',
      ],
    });

    const result = analyzeProduct(data, 'https://example.com/product');

    expect(result.verdict).toBe('AVOID');
    expect(result.signals.some((s) => s.name === 'AI Generation' && s.score === 100)).toBe(true);
  });

  it('detects sequential author patterns', () => {
    const data = createScrapedData({
      reviewerNames: ['Reviewer 1', 'Reviewer 2', 'Reviewer 3', 'Reviewer 4', 'Customer'],
    });

    const result = analyzeProduct(data, 'https://example.com/product');

    expect(result.signals.some((s) => s.name === 'Author Pattern' && s.score === 35)).toBe(true);
  });

  it('detects temporal synchronization', () => {
    const data = createScrapedData({
      timestamps: ['2024-01-01', '2024-01-01', '2024-01-01', '2024-01-01', '2024-01-01'],
    });

    const result = analyzeProduct(data, 'https://example.com/product');

    expect(result.signals.some((s) => s.name === 'Temporal Synchronization' && s.score === 45)).toBe(true);
  });

  it('detects low verified purchase ratio', () => {
    const data = createScrapedData({
      isVerified: [false, false, false, false, true],
    });

    const result = analyzeProduct(data, 'https://example.com/product');

    expect(result.signals.some((s) => s.name === 'Verified Purchases' && s.score === 40)).toBe(true);
  });

  it('has no randomness in scoring', () => {
    const data = createScrapedData({
      rating: 4.3,
      reviewCount: 75,
    });

    const result1 = analyzeProduct(data, 'https://example.com/product');
    const result2 = analyzeProduct(data, 'https://example.com/product');

    expect(result1.confidence).toBe(result2.confidence);
    expect(result1.signals.length).toBe(result2.signals.length);
  });

  it('includes nextSteps in all results', () => {
    const data = createScrapedData();
    const result = analyzeProduct(data, 'https://example.com/product');

    expect(Array.isArray(result.nextSteps)).toBe(true);
    expect(result.nextSteps.length).toBeGreaterThan(0);
  });
});
