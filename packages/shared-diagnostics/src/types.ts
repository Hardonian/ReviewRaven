// Migration note: Vended from WarrantyWeasel shared-diagnostics v1.0.0
// Diagnostic CRM records - event types and session tracking

export type DiagnosticEventType =
  | 'analyze_started'
  | 'analyze_completed'
  | 'analyze_failed'
  | 'unknown_result'
  | 'degraded_result'
  | 'high_risk_result'
  | 'cache_hit'
  | 'cache_miss'
  | 'domain_blocked'
  | 'unsupported_domain'
  | 'share_clicked';

export interface DiagnosticEvent {
  id: string;
  type: DiagnosticEventType;
  timestamp: string;
  hashedUrl: string;
  domain: string;
  verdict?: string;
  confidence?: number;
  degraded: boolean;
  metadata?: Record<string, unknown>;
}

export interface DiagnosticSession {
  sessionId: string;
  hashedUrl: string;
  domain: string;
  events: DiagnosticEvent[];
  startedAt: string;
  completedAt?: string;
  status: 'in_progress' | 'completed' | 'failed';
}

export interface IssueTimelineEntry {
  timestamp: string;
  event: string;
  severity: 'info' | 'warn' | 'error';
  hashedUrl?: string;
  domain?: string;
  details?: string;
}
