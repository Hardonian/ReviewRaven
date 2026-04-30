// Migration note: Vended from WarrantyWeasel shared-core v1.0.0
// Adapted for ReviewRaven review-trust analysis domain

export type Verdict = 'BUY' | 'CAUTION' | 'AVOID' | 'UNKNOWN';

export interface SignalDetail {
  id: string;
  name: string;
  type: 'SUSPICIOUS' | 'SAFE';
  weight: number;
  explanation: string;
}

export interface EvidenceDetail {
  signalId: string;
  signal: string;
  snippet: string;
  source: string;
}

export interface AnalysisResult {
  schemaVersion: string;
  resultId: string;
  verdict: Verdict;
  confidence: number;
  confidenceExplanation: string;
  reasons: string[];
  signals: SignalDetail[];
  evidence: EvidenceDetail[];
  limitations: string[];
  nextSteps?: string[];
  degraded: boolean;
  diagnosticsId: string;
}

export interface AnalyzeResponse {
  schemaVersion: string;
  ok: true;
  resultId: string;
  verdict: Verdict;
  confidence: number;
  confidenceExplanation: string;
  reasons: string[];
  signals: SignalDetail[];
  evidence: EvidenceDetail[];
  limitations: string[];
  degraded: boolean;
  diagnosticsId: string;
}

export interface ErrorEnvelope {
  schemaVersion: string;
  ok: false;
  code: string;
  message: string;
  retryable: boolean;
  degraded?: boolean;
  diagnosticsId?: string;
}

export interface DegradedState {
  degraded: boolean;
  reason: string;
  fallbackAvailable: boolean;
  attemptedPaths: string[];
  blockedAt?: string;
}

export interface ValidationResult {
  valid: boolean;
  url?: string;
  error?: string;
  host?: string;
  isAllowedHost: boolean;
}

export interface IdempotencyKey {
  key: string;
  expiresAt: number;
}

export interface SafeLogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  event: string;
  hashedUrl?: string;
  domain?: string;
  details?: Record<string, unknown>;
}
