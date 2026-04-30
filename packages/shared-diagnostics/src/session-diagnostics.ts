// Migration note: Vended from WarrantyWeasel shared-diagnostics v1.0.0
// Session diagnostics manager

import { DiagnosticEvent, DiagnosticSession, DiagnosticEventType, IssueTimelineEntry } from './types';
import { hashUrlForDiagnostics, extractDomain } from '@reviewraven/shared-core';

const sessions = new Map<string, DiagnosticSession>();

export function createSession(url: string): DiagnosticSession {
  const sessionId = crypto.randomUUID ? crypto.randomUUID() : generateId();
  const hashedUrl = hashUrlForDiagnostics(url);
  const domain = extractDomain(url);
  const session: DiagnosticSession = {
    sessionId,
    hashedUrl,
    domain,
    events: [],
    startedAt: new Date().toISOString(),
    status: 'in_progress',
  };
  sessions.set(sessionId, session);
  return session;
}

export function recordEvent(
  type: DiagnosticEventType,
  url: string,
  options?: { verdict?: string; confidence?: number; degraded?: boolean; metadata?: Record<string, unknown> },
  sessionId?: string
): DiagnosticEvent {
  if (sessionId) {
    const session = sessions.get(sessionId);
    if (session) {
      const event: DiagnosticEvent = {
        id: generateId(),
        type,
        timestamp: new Date().toISOString(),
        hashedUrl: session.hashedUrl,
        domain: session.domain,
        verdict: options?.verdict,
        confidence: options?.confidence,
        degraded: options?.degraded || false,
        metadata: options?.metadata,
      };
      session.events.push(event);
      return event;
    }
  }
  return createOrphanEvent(type, url, options);
}

export function completeSession(sessionId: string, status: 'completed' | 'failed'): void {
  const session = sessions.get(sessionId);
  if (session) {
    session.completedAt = new Date().toISOString();
    session.status = status;
  }
}

export function getSession(sessionId: string): DiagnosticSession | undefined {
  return sessions.get(sessionId);
}

export function getTimeline(sessionId: string): IssueTimelineEntry[] {
  const session = sessions.get(sessionId);
  if (!session) return [];
  return session.events.map(e => ({
    timestamp: e.timestamp,
    event: e.type,
    severity: e.degraded ? 'warn' : 'info',
    hashedUrl: e.hashedUrl,
    domain: e.domain,
  }));
}

function createOrphanEvent(
  type: DiagnosticEventType,
  url: string,
  options?: { verdict?: string; confidence?: number; degraded?: boolean; metadata?: Record<string, unknown> }
): DiagnosticEvent {
  return {
    id: generateId(),
    type,
    timestamp: new Date().toISOString(),
    hashedUrl: hashUrlForDiagnostics(url),
    domain: extractDomain(url),
    verdict: options?.verdict,
    confidence: options?.confidence,
    degraded: options?.degraded || false,
    metadata: options?.metadata,
  };
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}
