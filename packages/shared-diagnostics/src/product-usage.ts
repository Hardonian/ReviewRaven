// Migration note: Vended from WarrantyWeasel shared-diagnostics v1.0.0
// Product usage diagnostics

export interface ProductUsageRecord {
  hashedUrl: string;
  domain: string;
  category: string;
  verdict: string;
  confidence: number;
  signalsDetected: number;
  degraded: boolean;
  timestamp: string;
  cacheHit: boolean;
  fetchAttempts: number;
  retries: number;
}

const usageRecords: ProductUsageRecord[] = [];

export function recordProductUsage(record: ProductUsageRecord): void {
  usageRecords.push(record);
}

export function getProductUsageStats(domain: string): {
  totalAnalyses: number;
  avgConfidence: number;
  unknownRate: number;
  cacheHitRate: number;
  avgFetchAttempts: number;
} {
  const domainRecords = usageRecords.filter(r => r.domain === domain);
  if (domainRecords.length === 0) {
    return { totalAnalyses: 0, avgConfidence: 0, unknownRate: 0, cacheHitRate: 0, avgFetchAttempts: 0 };
  }

  const totalAnalyses = domainRecords.length;
  const avgConfidence = domainRecords.reduce((sum, r) => sum + r.confidence, 0) / totalAnalyses;
  const unknownRate = domainRecords.filter(r => r.verdict === 'UNKNOWN').length / totalAnalyses;
  const cacheHitRate = domainRecords.filter(r => r.cacheHit).length / totalAnalyses;
  const avgFetchAttempts = domainRecords.reduce((sum, r) => sum + r.fetchAttempts, 0) / totalAnalyses;

  return { totalAnalyses, avgConfidence, unknownRate, cacheHitRate, avgFetchAttempts };
}
