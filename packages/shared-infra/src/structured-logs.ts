// Migration note: Vended from WarrantyWeasel shared-infra v1.0.0
// Structured logging

import { hashUrlForDiagnostics, extractDomain } from '@reviewraven/shared-core';

export interface StructuredLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  service: string;
  event: string;
  hashedUrl?: string;
  domain?: string;
  durationMs?: number;
  metadata?: Record<string, unknown>;
}

export function structuredLog(
  level: StructuredLog['level'],
  service: string,
  event: string,
  options?: { url?: string; durationMs?: number; metadata?: Record<string, unknown> }
): StructuredLog {
  const log: StructuredLog = {
    timestamp: new Date().toISOString(),
    level,
    service,
    event,
  };

  if (options?.url) {
    log.hashedUrl = hashUrlForDiagnostics(options.url);
    log.domain = extractDomain(options.url);
  }

  if (options?.durationMs !== undefined) {
    log.durationMs = options.durationMs;
  }

  if (options?.metadata) {
    log.metadata = options.metadata;
  }

  console.log(JSON.stringify(log));
  return log;
}
