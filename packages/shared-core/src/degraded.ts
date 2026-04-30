// Migration note: Vended from WarrantyWeasel shared-core v1.0.0
// Degraded state model for tracking partial failure scenarios

import { DegradedState } from './types';

export function createDegradedState(
  degraded: boolean,
  reason: string,
  fallbackAvailable: boolean,
  attemptedPaths: string[],
  blockedAt?: string
): DegradedState {
  return {
    degraded,
    reason,
    fallbackAvailable,
    attemptedPaths,
    blockedAt: blockedAt || new Date().toISOString(),
  };
}

export function isDegraded(state: DegradedState): boolean {
  return state.degraded;
}

export function hasFallback(state: DegradedState): boolean {
  return state.fallbackAvailable;
}
