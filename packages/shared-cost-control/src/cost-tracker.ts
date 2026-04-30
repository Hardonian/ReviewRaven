// Migration note: Vended from WarrantyWeasel shared-cost-control v1.0.0
// Request cost tracking and per-domain cost buckets

export interface CostEntry {
  id: string;
  domain: string;
  type: 'fetch' | 'retry' | 'cache_miss' | 'blocked_domain' | 'analyzer_runtime';
  costMs: number;
  timestamp: string;
}

export interface DomainCostBucket {
  domain: string;
  fetchAttempts: number;
  retries: number;
  cacheMisses: number;
  blockedDomainEvents: number;
  totalCostMs: number;
  unknownCount: number;
  totalAnalyses: number;
}

const costEntries: CostEntry[] = [];
const domainBuckets = new Map<string, DomainCostBucket>();

export function recordCost(entry: Omit<CostEntry, 'id' | 'timestamp'>): CostEntry {
  const costEntry: CostEntry = {
    ...entry,
    id: generateId(),
    timestamp: new Date().toISOString(),
  };
  costEntries.push(costEntry);
  updateDomainBucket(entry.domain, entry.type, entry.costMs);
  return costEntry;
}

export function getDomainBucket(domain: string): DomainCostBucket | undefined {
  return domainBuckets.get(domain);
}

export function getAllBuckets(): Map<string, DomainCostBucket> {
  return new Map(domainBuckets);
}

export function incrementUnknown(domain: string): void {
  const bucket = domainBuckets.get(domain);
  if (bucket) {
    bucket.unknownCount++;
  }
}

export function incrementAnalysis(domain: string): void {
  const bucket = domainBuckets.get(domain);
  if (bucket) {
    bucket.totalAnalyses++;
  }
}

export function getUnknownRate(domain: string): number {
  const bucket = domainBuckets.get(domain);
  if (!bucket || bucket.totalAnalyses === 0) return 0;
  return bucket.unknownCount / bucket.totalAnalyses;
}

function updateDomainBucket(domain: string, type: CostEntry['type'], costMs: number): void {
  let bucket = domainBuckets.get(domain);
  if (!bucket) {
    bucket = {
      domain,
      fetchAttempts: 0,
      retries: 0,
      cacheMisses: 0,
      blockedDomainEvents: 0,
      totalCostMs: 0,
      unknownCount: 0,
      totalAnalyses: 0,
    };
    domainBuckets.set(domain, bucket);
  }

  switch (type) {
    case 'fetch':
      bucket.fetchAttempts++;
      break;
    case 'retry':
      bucket.retries++;
      break;
    case 'cache_miss':
      bucket.cacheMisses++;
      break;
    case 'blocked_domain':
      bucket.blockedDomainEvents++;
      break;
  }
  bucket.totalCostMs += costMs;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}
