export interface CategoryRule {
  category: string;
  detectionPatterns: string[];
  adjustments: { signalId: string; weightModifier: number }[];
}

export const categoryRules: CategoryRule[] = [
  {
    category: 'electronics',
    detectionPatterns: ['phone', 'laptop', 'tablet', 'headphone', 'speaker', 'camera', 'monitor', 'keyboard', 'mouse', 'charger', 'cable', 'usb', 'bluetooth', 'wireless', 'smart', 'tv', 'audio', 'electronics', 'gaming', 'console', 'controller'],
    adjustments: [
      { signalId: 'SIG-S001', weightModifier: 0.5 },
      { signalId: 'SIG-G008', weightModifier: 1.5 },
    ],
  },
  {
    category: 'supplements',
    detectionPatterns: ['cream', 'lotion', 'serum', 'moisturizer', 'shampoo', 'conditioner', 'skincare', 'beauty', 'cosmetic', 'soap', 'supplement', 'vitamin', 'protein', 'health'],
    adjustments: [
      { signalId: 'SIG-S002', weightModifier: 1.8 },
      { signalId: 'SIG-S003', weightModifier: 1.5 },
      { signalId: 'SIG-S015', weightModifier: 1.3 },
    ],
  },
  {
    category: 'beauty',
    detectionPatterns: ['makeup', 'lipstick', 'foundation', 'mascara', 'perfume', 'cologne', 'beauty', 'razor'],
    adjustments: [
      { signalId: 'SIG-G004', weightModifier: 1.4 },
      { signalId: 'SIG-S003', weightModifier: 1.2 },
    ],
  },
  {
    category: 'tools',
    detectionPatterns: ['tool', 'gadget', 'hammer', 'drill', 'saw', 'wrench', 'hardware'],
    adjustments: [
      { signalId: 'SIG-G002', weightModifier: 1.5 },
      { signalId: 'SIG-G015', weightModifier: 0.8 },
    ],
  },
  {
    category: 'apparel',
    detectionPatterns: ['shirt', 'pants', 'dress', 'shoe', 'sneaker', 'jacket', 'hoodie', 'sock', 'hat', 'cap', 'belt', 'bag', 'backpack', 'watch', 'jewelry', 'ring', 'necklace', 'bracelet', 'apparel', 'clothing', 'wear', 'fashion'],
    adjustments: [
      { signalId: 'SIG-G004', weightModifier: 1.3 },
      { signalId: 'SIG-S008', weightModifier: 1.2 },
    ],
  },
  {
    category: 'home',
    detectionPatterns: ['furniture', 'table', 'chair', 'lamp', 'bed', 'mattress', 'pillow', 'blanket', 'curtain', 'rug', 'kitchen', 'pan', 'pot', 'blender', 'vacuum', 'cleaner', 'home', 'decor'],
    adjustments: [
      { signalId: 'SIG-G015', weightModifier: 1.2 },
    ],
  },
  {
    category: 'digital',
    detectionPatterns: ['software', 'plugin', 'extension', 'template', 'ebook', 'course', 'tutorial', 'screenshot', 'digital', 'download'],
    adjustments: [
      { signalId: 'SIG-G015', weightModifier: 0 },
      { signalId: 'SIG-S033', weightModifier: 1.5 },
    ],
  },
];
