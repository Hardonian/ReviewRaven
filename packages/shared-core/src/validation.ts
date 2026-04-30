// Migration note: Vended from WarrantyWeasel shared-core v1.0.0
// Validation helpers for URLs and inputs

import { ValidationResult } from './types';

export const ALLOWED_HOSTS = [
  'amazon.com', 'amazon.co.uk', 'amazon.de', 'amazon.fr', 'amazon.it', 'amazon.es', 'amazon.ca', 'amazon.com.au', 'amazon.co.jp',
  'walmart.com',
  'bestbuy.com',
];

export const BLOCKED_IP_PATTERNS = [
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^127\./,
  /^0\./,
  /^localhost/,
  /^\[/,
];

export function validateUrl(input: string): ValidationResult {
  const trimmed = input.trim();

  if (!trimmed) {
    return { valid: false, error: 'URL is required', isAllowedHost: false };
  }

  let urlString = trimmed;
  if (!urlString.startsWith('http://') && !urlString.startsWith('https://')) {
    urlString = 'https://' + urlString;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(urlString);
  } catch {
    return { valid: false, error: 'Invalid URL format', isAllowedHost: false };
  }

  if (parsedUrl.protocol !== 'https:') {
    return { valid: false, error: 'Only HTTPS URLs are allowed', isAllowedHost: false };
  }

  const hostname = parsedUrl.hostname.toLowerCase();

  for (const pattern of BLOCKED_IP_PATTERNS) {
    if (pattern.test(hostname)) {
      return { valid: false, error: 'Access to internal or local addresses is not allowed', isAllowedHost: false };
    }
  }

  const isAllowedHost = ALLOWED_HOSTS.some(
    (allowed) => hostname === allowed || hostname.endsWith('.' + allowed)
  );

  return {
    valid: true,
    url: parsedUrl.toString(),
    host: hostname,
    isAllowedHost,
  };
}

export function isAllowedDomain(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return ALLOWED_HOSTS.some(
    (allowed) => normalized === allowed || normalized.endsWith('.' + allowed)
  );
}

export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return 'unknown';
  }
}
