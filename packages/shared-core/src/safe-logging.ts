// Migration note: Vended from WarrantyWeasel shared-core v1.0.0
// Safe logging that avoids raw URLs and PII

import { SafeLogEntry } from './types';
import { hashUrlForDiagnostics } from './url-hashing';

export function createSafeLogEntry(
  level: SafeLogEntry['level'],
  event: string,
  url?: string,
  details?: Record<string, unknown>
): SafeLogEntry {
  const entry: SafeLogEntry = {
    timestamp: new Date().toISOString(),
    level,
    event,
  };

  if (url) {
    entry.hashedUrl = hashUrlForDiagnostics(url);
    try {
      entry.domain = new URL(url).hostname;
    } catch {
      entry.domain = 'unknown';
    }
  }

  if (details) {
    entry.details = sanitizeDetails(details);
  }

  return entry;
}

function sanitizeDetails(details: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(details)) {
    if (key.toLowerCase().includes('url') || key.toLowerCase().includes('link')) {
      sanitized[key] = typeof value === 'string' ? hashUrlForDiagnostics(value) : value;
    } else if (key.toLowerCase().includes('email') || key.toLowerCase().includes('name')) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export function safeLog(entry: SafeLogEntry): void {
  console.log(JSON.stringify(entry));
}
