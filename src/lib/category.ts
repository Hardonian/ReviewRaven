export type ProductCategory = 'electronics' | 'apparel' | 'niche' | 'home' | 'beauty' | 'books' | 'unknown';

export interface CategoryWeights {
  ratingSkewWeight: number;
  volumeWeight: number;
  genericLanguageWeight: number;
  diversityWeight: number;
  keywordSpamWeight: number;
  temporalSyncWeight: number;
  verifiedRatioWeight: number;
  authorPatternWeight: number;
  promptLeakWeight: number;
  dataQualityWeight: number;
}

const CATEGORY_WEIGHTS: Record<ProductCategory, CategoryWeights> = {
  electronics: {
    ratingSkewWeight: 1.2,
    volumeWeight: 0.5,
    genericLanguageWeight: 1.1,
    diversityWeight: 1.1,
    keywordSpamWeight: 1.2,
    temporalSyncWeight: 0.8,
    verifiedRatioWeight: 0.8,
    authorPatternWeight: 1.0,
    promptLeakWeight: 1.5,
    dataQualityWeight: 1.0,
  },
  apparel: {
    ratingSkewWeight: 0.8,
    volumeWeight: 0.6,
    genericLanguageWeight: 0.7,
    diversityWeight: 0.8,
    keywordSpamWeight: 0.9,
    temporalSyncWeight: 1.0,
    verifiedRatioWeight: 1.2,
    authorPatternWeight: 1.0,
    promptLeakWeight: 1.5,
    dataQualityWeight: 1.0,
  },
  niche: {
    ratingSkewWeight: 1.0,
    volumeWeight: 0.3,
    genericLanguageWeight: 1.2,
    diversityWeight: 1.2,
    keywordSpamWeight: 1.3,
    temporalSyncWeight: 1.2,
    verifiedRatioWeight: 1.5,
    authorPatternWeight: 1.2,
    promptLeakWeight: 1.5,
    dataQualityWeight: 1.2,
  },
  home: {
    ratingSkewWeight: 1.0,
    volumeWeight: 0.7,
    genericLanguageWeight: 1.0,
    diversityWeight: 1.0,
    keywordSpamWeight: 1.0,
    temporalSyncWeight: 1.0,
    verifiedRatioWeight: 1.0,
    authorPatternWeight: 1.0,
    promptLeakWeight: 1.5,
    dataQualityWeight: 1.0,
  },
  beauty: {
    ratingSkewWeight: 1.1,
    volumeWeight: 0.6,
    genericLanguageWeight: 0.9,
    diversityWeight: 0.9,
    keywordSpamWeight: 1.1,
    temporalSyncWeight: 1.1,
    verifiedRatioWeight: 1.3,
    authorPatternWeight: 1.1,
    promptLeakWeight: 1.5,
    dataQualityWeight: 1.0,
  },
  books: {
    ratingSkewWeight: 0.9,
    volumeWeight: 0.5,
    genericLanguageWeight: 1.0,
    diversityWeight: 1.1,
    keywordSpamWeight: 0.8,
    temporalSyncWeight: 1.0,
    verifiedRatioWeight: 1.0,
    authorPatternWeight: 1.0,
    promptLeakWeight: 1.5,
    dataQualityWeight: 1.0,
  },
  unknown: {
    ratingSkewWeight: 1.0,
    volumeWeight: 1.0,
    genericLanguageWeight: 1.0,
    diversityWeight: 1.0,
    keywordSpamWeight: 1.0,
    temporalSyncWeight: 1.0,
    verifiedRatioWeight: 1.0,
    authorPatternWeight: 1.0,
    promptLeakWeight: 1.5,
    dataQualityWeight: 1.0,
  },
};

export function detectCategory(title: string | null, url: string): ProductCategory {
  const titleLower = (title || '').toLowerCase();
  const urlLower = url.toLowerCase();
  const combined = titleLower + ' ' + urlLower;

  const electronicsPatterns = [
    'phone', 'laptop', 'tablet', 'headphone', 'speaker', 'camera', 'monitor',
    'keyboard', 'mouse', 'charger', 'cable', 'usb', 'bluetooth', 'wireless',
    'smart', 'tv', 'audio', 'electronics', 'gaming', 'console', 'controller',
  ];
  const apparelPatterns = [
    'shirt', 'pants', 'dress', 'shoe', 'sneaker', 'jacket', 'hoodie', 'sock',
    'hat', 'cap', 'belt', 'bag', 'backpack', 'watch', 'jewelry', 'ring',
    'necklace', 'bracelet', 'apparel', 'clothing', 'wear', 'fashion',
  ];
  const homePatterns = [
    'furniture', 'table', 'chair', 'lamp', 'bed', 'mattress', 'pillow',
    'blanket', 'curtain', 'rug', 'kitchen', 'pan', 'pot', 'blender',
    'vacuum', 'cleaner', 'home', 'decor',
  ];
  const beautyPatterns = [
    'cream', 'lotion', 'serum', 'moisturizer', 'shampoo', 'conditioner',
    'makeup', 'lipstick', 'foundation', 'mascara', 'perfume', 'cologne',
    'skincare', 'beauty', 'cosmetic', 'soap', 'razor',
  ];
  const nichePatterns = [
    'software', 'plugin', 'extension', 'template', 'ebook', 'course',
    'tutorial', 'screenshot', 'tool', 'gadget', 'niche', 'specialty',
  ];
  const bookPatterns = [
    'book', 'novel', 'paperback', 'hardcover', 'kindle', 'edition',
    'author', 'chapter', 'read', 'reading', 'bestseller',
  ];

  if (electronicsPatterns.some((p) => combined.includes(p))) return 'electronics';
  if (apparelPatterns.some((p) => combined.includes(p))) return 'apparel';
  if (homePatterns.some((p) => combined.includes(p))) return 'home';
  if (beautyPatterns.some((p) => combined.includes(p))) return 'beauty';
  if (nichePatterns.some((p) => combined.includes(p))) return 'niche';
  if (bookPatterns.some((p) => combined.includes(p))) return 'books';

  return 'unknown';
}

export function getCategoryWeights(category: ProductCategory): CategoryWeights {
  return CATEGORY_WEIGHTS[category];
}
