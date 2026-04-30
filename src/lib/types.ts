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
}

export interface SignalDetail {
  id?: string;
  name: string;
  score: number;
  description: string;
}

export interface Evidence {
  signalId: string;
  snippet: string;
  source: string;
}

export interface AnalysisResult {
  verdict: 'BUY' | 'CAUTION' | 'AVOID' | 'UNKNOWN';
  confidence: number;
  confidenceExplanation?: string;
  reasons: string[];
  signals: SignalDetail[];
  evidence?: Evidence[];
  limitations: string[];
  nextSteps: string[];
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
}
