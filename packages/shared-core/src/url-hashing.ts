// Migration note: Vended from WarrantyWeasel shared-core v1.0.0
// Normalized URL hashing for cache keys and diagnostic references

import crypto from 'crypto';

export function normalizeUrl(input: string): string {
  try {
    const url = new URL(input);
    url.hash = '';
    url.searchParams.sort();
    const paramsToRemove = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref', 'fbclid', 'gclid'];
    for (const param of paramsToRemove) {
      url.searchParams.delete(param);
    }
    return url.toString().toLowerCase();
  } catch {
    return input.toLowerCase().trim();
  }
}

export function hashNormalizedUrl(input: string): string {
  const normalized = normalizeUrl(input);
  return crypto.createHash('sha256').update(normalized).digest('hex').substring(0, 16);
}

export function hashUrlForDiagnostics(input: string): string {
  const normalized = normalizeUrl(input);
  return crypto.createHash('sha256').update(normalized).digest('hex').substring(0, 12);
}
