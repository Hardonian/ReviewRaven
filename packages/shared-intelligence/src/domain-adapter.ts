// Migration note: Vended from WarrantyWeasel shared-core v1.0.0
// Domain adapter interface - contract for platform-specific scrapers

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

export interface DomainAdapter {
  domain: string;
  extract(html: string, url: string): Promise<Partial<ScrapedData>>;
  isBlocked(html: string): boolean;
  getBlockedReason(html: string): string | null;
}

export interface DomainAdapterRegistry {
  register(adapter: DomainAdapter): void;
  getForUrl(url: string): DomainAdapter;
  getFallback(): DomainAdapter;
  getAll(): DomainAdapter[];
}
