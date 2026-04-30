export interface CategoryRule {
  category: string;
  adjustments: { signalId: string; weightModifier: number }[];
}

export const categoryRules: CategoryRule[] = [
  {
    category: 'electronics',
    adjustments: [
      { signalId: 'SIG-S001', weightModifier: 0.5 }, // Bursts are common in tech releases
      { signalId: 'SIG-G008', weightModifier: 1.5 }, // Comparison with previous models is high signal
    ],
  },
  {
    category: 'supplements',
    adjustments: [
      { signalId: 'SIG-S002', weightModifier: 1.8 }, // Verified purchase is CRITICAL for health
      { signalId: 'SIG-S003', weightModifier: 1.5 }, // Generic superlatives are very suspicious
      { signalId: 'SIG-S015', weightModifier: 1.3 }, // Incentivized disclosure is common/risky
    ],
  },
  {
    category: 'beauty',
    adjustments: [
      { signalId: 'SIG-G004', weightModifier: 1.4 }, // Photo context is very strong safety signal
      { signalId: 'SIG-S003', weightModifier: 1.2 }, // Watch for hyperbole
    ],
  },
  {
    category: 'tools',
    adjustments: [
      { signalId: 'SIG-G002', weightModifier: 1.5 }, // Long term use is great
      { signalId: 'SIG-G015', weightModifier: 0.8 }, // Packaging matters less for tools
    ],
  },
  {
    category: 'apparel',
    adjustments: [
      { signalId: 'SIG-G004', weightModifier: 1.3 }, // Photos showing fit are high value
      { signalId: 'SIG-S008', weightModifier: 1.2 }, // Coordinated drops often use fake names
    ],
  },
  {
    category: 'home goods',
    adjustments: [
      { signalId: 'SIG-G015', weightModifier: 1.2 }, // Packaging matters for fragile home goods
    ],
  },
  {
    category: 'digital',
    adjustments: [
      { signalId: 'SIG-G015', weightModifier: 0 }, // Packaging issues don't make sense
      { signalId: 'SIG-S033', weightModifier: 1.5 }, // Cross-platform mirroring is common in digital piracy/scams
    ],
  },
];
