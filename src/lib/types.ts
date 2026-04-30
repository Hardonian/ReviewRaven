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

export interface AnalysisResult {
  verdict: 'BUY' | 'CAUTION' | 'AVOID' | 'UNKNOWN';
  confidence: number;
  reasons: string[];
  signals: SignalDetail[];
  limitations: string[];
}

export interface SignalDetail {
  name: string;
  score: number;
  description: string;
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
