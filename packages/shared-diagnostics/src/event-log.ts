// Migration note: Vended from WarrantyWeasel shared-diagnostics v1.0.0
// Support-safe event logs - no raw URLs, no PII

import { DiagnosticEvent, DiagnosticEventType } from './types';
import { hashUrlForDiagnostics, extractDomain } from '@reviewraven/shared-core';

const eventLog: DiagnosticEvent[] = [];

export function logEvent(
  type: DiagnosticEventType,
  url: string,
  options?: { verdict?: string; confidence?: number; degraded?: boolean; metadata?: Record<string, unknown> }
): DiagnosticEvent {
  const event: DiagnosticEvent = {
    id: generateId(),
    type,
    timestamp: new Date().toISOString(),
    hashedUrl: hashUrlForDiagnostics(url),
    domain: extractDomain(url),
    verdict: options?.verdict,
    confidence: options?.confidence,
    degraded: options?.degraded || false,
    metadata: sanitizeMetadata(options?.metadata),
  };
  eventLog.push(event);
  return event;
}

export function getEvents(limit = 100): DiagnosticEvent[] {
  return eventLog.slice(-limit);
}

export function getEventsByDomain(domain: string): DiagnosticEvent[] {
  return eventLog.filter(e => e.domain === domain);
}

export function getEventsByType(type: DiagnosticEventType): DiagnosticEvent[] {
  return eventLog.filter(e => e.type === type);
}

export function getUnknownRate(domain: string): number {
  const domainEvents = getEventsByDomain(domain);
  if (domainEvents.length === 0) return 0;
  const unknownCount = domainEvents.filter(e => e.verdict === 'UNKNOWN').length;
  return unknownCount / domainEvents.length;
}

function sanitizeMetadata(metadata?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!metadata) return undefined;
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (key.toLowerCase().includes('url') || key.toLowerCase().includes('link')) {
      sanitized[key] = typeof value === 'string' ? hashUrlForDiagnostics(value) : value;
    } else if (key.toLowerCase().includes('email') || key.toLowerCase().includes('name') || key.toLowerCase().includes('ip')) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}
