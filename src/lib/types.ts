// Re-export from shared-core for backward compatibility
// Migration note: Local types replaced by shared-core contracts
export type {
  Verdict,
  SignalDetail,
  EvidenceDetail,
  AnalysisResult,
  AnalyzeResponse,
  ErrorEnvelope as ErrorResponse,
  ValidationResult,
} from '@reviewraven/shared-core';

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
