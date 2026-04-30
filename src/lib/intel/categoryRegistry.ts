export interface CategoryRule {
  category: string;
  detectionPatterns: string[];
  adjustments: { signalId: string; weightModifier: number }[];
}

export const categoryRules: CategoryRule[] = [
  {
    category: 'electronics',
    detectionPatterns: ['electronics', 'laptop', 'phone', 'headphone', 'bluetooth', 'console'],
    adjustments: [
      { signalId: 'SIG-S009', weightModifier: 1.2 },
      { signalId: 'SIG-S010', weightModifier: 0.8 },
    ],
  },
  {
    category: 'apparel',
    detectionPatterns: ['shirt', 'shoes', 'pants', 'dress', 'apparel', 'clothing'],
    adjustments: [
      { signalId: 'SIG-S002', weightModifier: 1.5 },
      { signalId: 'SIG-S003', weightModifier: 0.8 },
    ],
  },
  {
    category: 'home',
    detectionPatterns: ['kitchen', 'home', 'furniture', 'blender'],
    adjustments: [],
  },
  {
    category: 'beauty',
    detectionPatterns: ['makeup', 'cream', 'moisturizer', 'beauty', 'serum'],
    adjustments: [],
  },
  {
    category: 'books',
    detectionPatterns: ['book', 'paperback', 'hardcover', 'novel'],
    adjustments: [],
  },
  {
    category: 'niche',
    detectionPatterns: ['plugin', 'template', 'wordpress', 'niche'],
    adjustments: [
      { signalId: 'SIG-S010', weightModifier: 0.4 },
    ],
  },
  {
    category: 'digital',
    detectionPatterns: ['software', 'download', 'digital'],
    adjustments: [
      { signalId: 'SIG-G015', weightModifier: 0 },
    ],
  },
  {
    category: 'tools',
    detectionPatterns: ['drill', 'wrench', 'tool', 'hammer'],
    adjustments: [
      { signalId: 'SIG-G002', weightModifier: 1.5 },
    ],
  },
  {
    category: 'supplements',
    detectionPatterns: ['supplement', 'vitamin', 'protein', 'booster', 'gummies'],
    adjustments: [
      { signalId: 'SIG-S002', weightModifier: 1.8 },
      { signalId: 'SIG-S009', weightModifier: 1.5 },
    ],
  },
];
