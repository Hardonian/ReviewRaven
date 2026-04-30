// Migration note: Vended from WarrantyWeasel shared-intelligence v1.0.0
// Confidence engine - calculates confidence score with penalties and caps

import { SignalDetail } from '@reviewraven/shared-core';

export interface ConfidenceResult {
  confidence: number;
  explanation: string[];
}

export function calculateConfidence(
  signals: SignalDetail[],
  signalStrength: number,
  blocked: boolean,
  degraded: boolean,
  reviewCount: number | null,
  reviewSnippetsLength: number,
  hasTitle: boolean
): ConfidenceResult {
  const explanation: string[] = [];
  let confidence = signalStrength === 0 ? 0 : signalStrength + 20;

  if (blocked || degraded) {
    confidence -= 40;
    explanation.push('Heavy penalty applied due to degraded data collection.');
  }
  if (!reviewCount || reviewCount < 10) {
    confidence -= 20;
    explanation.push('Penalty applied due to low review volume.');
  }

  if ((blocked && reviewSnippetsLength === 0) || !hasTitle) {
    confidence = Math.min(confidence, 30);
    explanation.push('Confidence capped at 30% due to missing data.');
  } else if (reviewSnippetsLength < 3) {
    confidence = Math.min(confidence, 60);
    explanation.push('Confidence capped at 60% due to partial review data.');
  } else if (signals.length < 2) {
    confidence = Math.min(confidence, 75);
    explanation.push('Confidence capped at 75% due to weak evidence.');
  } else if (signals.length >= 3 && signalStrength > 80) {
    confidence = Math.min(Math.max(confidence, 80), 95);
    explanation.push('Strong multi-signal evidence found.');
  }

  confidence = Math.max(0, Math.min(100, confidence));

  return {
    confidence: Math.round(confidence),
    explanation: explanation.length > 0 ? explanation : ['Analysis complete.'],
  };
}
