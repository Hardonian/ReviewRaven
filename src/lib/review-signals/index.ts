// ReviewRaven-specific review signal extensions
// These extend shared-intelligence signals with review-domain-specific detectors

import { SignalDefinition, SignalRegistry, createSignalRegistry } from '@reviewraven/shared-intelligence';

export const reviewSpecificSignals: SignalDefinition[] = [
  { id: 'SIG-R001', name: 'Review_Timing_Anomaly', type: 'SUSPICIOUS', weight: -30, description: 'Reviews posted at unusual hours in bulk.', category: 'review' },
  { id: 'SIG-R002', name: 'Rating_Skew_Extreme', type: 'SUSPICIOUS', weight: -25, description: 'Rating distribution heavily skewed to 5 or 1 stars only.', category: 'review' },
  { id: 'SIG-R003', name: 'Language_Repetition', type: 'SUSPICIOUS', weight: -20, description: 'Identical or near-identical phrases across multiple reviews.', category: 'review' },
  { id: 'SIG-R004', name: 'Verified_Purchase_Absence', type: 'SUSPICIOUS', weight: -35, description: 'No verified purchase badges on any recent reviews.', category: 'review' },
  { id: 'SIG-R005', name: 'Sentiment_Text_Mismatch', type: 'SUSPICIOUS', weight: -25, description: 'Star rating contradicts review text sentiment.', category: 'review' },
  { id: 'SIG-R006', name: 'Reviewer_Diversity_Low', type: 'SUSPICIOUS', weight: -20, description: 'Reviewers share naming patterns or profile characteristics.', category: 'review' },
  { id: 'SIG-R007', name: 'Suspicious_Burst', type: 'SUSPICIOUS', weight: -40, description: 'Review volume spike inconsistent with product lifecycle.', category: 'review' },
  { id: 'SIG-R008', name: 'Category_Normalization_Fail', type: 'SUSPICIOUS', weight: -15, description: 'Review patterns inconsistent with product category norms.', category: 'review' },
];

export function createReviewRavenRegistry(): SignalRegistry {
  const registry = createSignalRegistry();
  for (const signal of reviewSpecificSignals) {
    registry.register(signal);
  }
  return registry;
}

export function getReviewSignals(): SignalDefinition[] {
  return [...reviewSpecificSignals];
}
