export interface ScrapedData {
  title: string | null;
  rating: number | null;
  ratingCount: number | null;
  reviewCount: number | null;
  reviewSnippets: string[];
  timestamps: string[];
  reviewerNames: string[];
  isVerified: boolean[];
  blocked: boolean;
  degraded?: boolean;
  failureReason?: string;
  category?: string;
}

export interface SignalDetail {
  name: string;
  weight: number;
  explanation: string;
  score?: number; // legacy alias
  description?: string; // legacy alias
}

export interface EvidenceDetail {
  signal: string;
  signalId?: string; // legacy alias
  snippet: string;
  source: string;
}

export interface AnalysisResult {
  verdict: 'BUY' | 'CAUTION' | 'AVOID' | 'UNKNOWN';
  confidence: number;
  confidenceExplanation: string;
  reasons: string[];
  signals: SignalDetail[];
  evidence: EvidenceDetail[];
  limitations: string[];
  nextSteps?: string[];
  degraded?: boolean;
}

export interface AnalyzeResponse {
  ok: true;
  data: {
    url: string;
    title: string | null;
    result: AnalysisResult;
  };
}

export interface ErrorResponse {
  ok: false;
  code: string;
  message: string;
  retryable: boolean;
  degraded?: boolean;
}
