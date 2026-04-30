// Migration note: Vended from WarrantyWeasel shared-intelligence v1.0.0
// Scoring engine - calculates risk score from weighted signals

import { SignalDetail } from '@reviewraven/shared-core';

export interface ScoringResult {
  totalRiskScore: number;
  signalStrength: number;
  adjustedSignals: SignalDetail[];
}

export interface CategoryAdjustment {
  signalId: string;
  weightModifier: number;
}

export function calculateScore(
  signals: SignalDetail[],
  categoryAdjustments: CategoryAdjustment[] = []
): ScoringResult {
  let totalRiskScore = 0;
  let signalStrength = 0;
  const adjustedSignals: SignalDetail[] = [];

  for (const sig of signals) {
    let weight = sig.weight;

    const rule = categoryAdjustments.find(r => r.signalId === sig.id);
    if (rule) {
      weight *= rule.weightModifier;
    }

    const adjusted: SignalDetail = { ...sig, weight };
    adjustedSignals.push(adjusted);

    if (weight < 0) {
      totalRiskScore += Math.abs(weight);
    } else {
      totalRiskScore -= weight;
    }
    signalStrength += Math.abs(weight);
  }

  totalRiskScore = Math.max(0, Math.min(100, totalRiskScore));

  return {
    totalRiskScore,
    signalStrength,
    adjustedSignals,
  };
}

export function determineVerdict(
  riskScore: number,
  blocked: boolean,
  degraded: boolean,
  reviewSnippetsLength: number,
  hasUltimateSuspicion: boolean
): 'BUY' | 'CAUTION' | 'AVOID' | 'UNKNOWN' {
  if ((blocked || degraded) && reviewSnippetsLength === 0) {
    return 'UNKNOWN';
  }
  if (hasUltimateSuspicion) {
    return 'AVOID';
  }
  if (riskScore <= 30) {
    return 'BUY';
  }
  if (riskScore <= 60) {
    return 'CAUTION';
  }
  return 'AVOID';
}
