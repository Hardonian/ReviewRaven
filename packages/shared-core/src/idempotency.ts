// Migration note: Vended from WarrantyWeasel shared-core v1.0.0
// Idempotency helpers for deduplicating requests

import { IdempotencyKey } from './types';

const IDEMPOTENCY_TTL_MS = 300_000; // 5 minutes

export function generateIdempotencyKey(input: string): IdempotencyKey {
  return {
    key: hashString(input),
    expiresAt: Date.now() + IDEMPOTENCY_TTL_MS,
  };
}

export function isIdempotencyKeyValid(key: IdempotencyKey): boolean {
  return Date.now() < key.expiresAt;
}

function hashString(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}
