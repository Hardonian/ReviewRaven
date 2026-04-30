// Migration note: Vended from WarrantyWeasel shared-intelligence v1.0.0
// Signal registry - domain-agnostic signal definitions

export interface SignalDefinition {
  id: string;
  name: string;
  type: 'SUSPICIOUS' | 'SAFE';
  weight: number;
  description: string;
  category?: string;
}

export class SignalRegistry {
  private signals: Map<string, SignalDefinition> = new Map();

  register(signal: SignalDefinition): void {
    this.signals.set(signal.id, signal);
  }

  get(id: string): SignalDefinition | undefined {
    return this.signals.get(id);
  }

  getAll(): SignalDefinition[] {
    return Array.from(this.signals.values());
  }

  getByType(type: 'SUSPICIOUS' | 'SAFE'): SignalDefinition[] {
    return this.getAll().filter(s => s.type === type);
  }

  findById(id: string): SignalDefinition | undefined {
    return this.signals.get(id);
  }

  findByName(name: string): SignalDefinition | undefined {
    return this.getAll().find(s => s.name === name);
  }
}

export const sharedSignals: SignalDefinition[] = [
  { id: 'SIG-S001', name: 'Burst_Arrival', type: 'SUSPICIOUS', weight: -40, description: '50+ reviews in < 12 hours.' },
  { id: 'SIG-S002', name: 'Verified_Purchase_Deficit', type: 'SUSPICIOUS', weight: -30, description: 'Ratio of non-verified to verified > 80%.' },
  { id: 'SIG-S003', name: 'Superlative_Clumping', type: 'SUSPICIOUS', weight: -15, description: 'Excessive use of best, perfect, amazing.' },
  { id: 'SIG-S004', name: 'Sentiment_Mismatch', type: 'SUSPICIOUS', weight: -20, description: '5-star rating with neutral or short text.' },
  { id: 'SIG-S005', name: 'Reviewer_Inactivity', type: 'SUSPICIOUS', weight: -10, description: 'User has 1 review total.' },
  { id: 'SIG-S006', name: 'Opening_Identity', type: 'SUSPICIOUS', weight: -25, description: 'Multiple reviews starting with the same phrase.' },
  { id: 'SIG-S008', name: 'Author_Patterns', type: 'SUSPICIOUS', weight: -35, description: 'Sequential naming patterns detected among reviewers.' },
  { id: 'SIG-S009', name: 'Rating_Skew', type: 'SUSPICIOUS', weight: -25, description: 'Rating is unusually high or inconsistent with text.' },
  { id: 'SIG-S010', name: 'Low_Volume_Risk', type: 'SUSPICIOUS', weight: -20, description: 'Insufficient reviews for statistically significant trust.' },
  { id: 'SIG-S012', name: 'Broken_Syntax_High_Rating', type: 'SUSPICIOUS', weight: -10, description: 'Poor grammar in 5-star reviews.' },
  { id: 'SIG-S015', name: 'Incentivized_Disclosure', type: 'SUSPICIOUS', weight: -25, description: 'Mention of receiving product for free/discount.' },
  { id: 'SIG-S019', name: 'Rating_Bimodality', type: 'SUSPICIOUS', weight: -20, description: 'High 5-star and High 1-star, nothing in middle.' },
  { id: 'SIG-S022', name: 'Duplicate_Timestamps', type: 'SUSPICIOUS', weight: -40, description: 'Multiple reviews posted at exact same second.' },
  { id: 'SIG-S024', name: 'Emotional_Extremity', type: 'SUSPICIOUS', weight: -10, description: 'All caps or excessive exclamation marks.' },
  { id: 'SIG-S033', name: 'Cross_Platform_Mirror', type: 'SUSPICIOUS', weight: -45, description: 'Exact text found on other retail sites.' },
  { id: 'SIG-S041', name: 'Format_Errors', type: 'SUSPICIOUS', weight: -50, description: 'Leftover tags like [Product Name].' },
  { id: 'SIG-S099', name: 'Data_Quality_Risk', type: 'SUSPICIOUS', weight: -20, description: 'Minimal product data available for a reliable trust assessment.' },
  { id: 'SIG-S100', name: 'Ultimate_Suspicion', type: 'SUSPICIOUS', weight: -100, description: 'Review text contains prompt injection patterns.' },

  { id: 'SIG-G001', name: 'Verified_Purchase_Verified', type: 'SAFE', weight: 25, description: 'Purchase confirmed by platform.' },
  { id: 'SIG-G002', name: 'Long_Term_User', type: 'SAFE', weight: 20, description: 'Mention of using product for 6+ months.' },
  { id: 'SIG-G003', name: 'Specific_Constructive_Criticism', type: 'SAFE', weight: 15, description: 'Mentions one minor flaw.' },
  { id: 'SIG-G004', name: 'Photo_User_Context', type: 'SAFE', weight: 30, description: 'Image shows product in a real home/use environment.' },
  { id: 'SIG-G005', name: 'Unique_Phrasing', type: 'SAFE', weight: 10, description: 'Natural, non-templated language.' },
  { id: 'SIG-G008', name: 'Comparison_With_Previous_Model', type: 'SAFE', weight: 15, description: 'Detailed contrast with older version.' },
  { id: 'SIG-G015', name: 'Mention_of_Packaging_Issues', type: 'SAFE', weight: 15, description: 'Natural observation about shipping.' },
  { id: 'SIG-G020', name: 'Typo_Presence', type: 'SAFE', weight: 5, description: 'Minor typos suggesting human input.' },
  { id: 'SIG-G027', name: 'Follow_Up_Edit', type: 'SAFE', weight: 30, description: 'Updated review after long-term use.' },
];

export function createSignalRegistry(): SignalRegistry {
  const registry = new SignalRegistry();
  for (const signal of sharedSignals) {
    registry.register(signal);
  }
  return registry;
}
