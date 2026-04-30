// Scraper using shared domain adapters and infra
// Replaces ad-hoc scraper logic with adapter pattern

import { ScrapedData } from '@reviewraven/shared-intelligence';
import { getAdapterForUrl } from './adapters';
import { recordCost } from '@reviewraven/shared-cost-control';
import { extractDomain } from '@reviewraven/shared-core';
import { isCircuitOpen, recordSuccess, recordFailure } from '@reviewraven/shared-infra';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const FETCH_TIMEOUT_MS = 10000;

function timeoutSignal(ms: number): AbortController {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller;
}

export async function scrapeProduct(url: string): Promise<ScrapedData> {
  const baseData: ScrapedData = {
    title: null, rating: null, ratingCount: null, reviewCount: null,
    reviewSnippets: [], timestamps: [], reviewerNames: [], isVerified: [], blocked: false,
  };

  const domain = extractDomain(url);
  const adapter = getAdapterForUrl(url);

  if (isCircuitOpen(domain)) {
    return { ...baseData, blocked: true, degraded: true, failureReason: 'Circuit breaker open for domain' };
  }

  const startTime = Date.now();

  try {
    const controller = timeoutSignal(FETCH_TIMEOUT_MS);
    recordCost({ domain, type: 'fetch', costMs: 0 });

    let response: Response;
    try {
      response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        redirect: 'manual',
      });
    } catch (fetchError) {
      const elapsed = Date.now() - startTime;
      recordCost({ domain, type: 'fetch', costMs: elapsed });
      recordFailure(domain);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return { ...baseData, blocked: true, degraded: true, failureReason: 'Request timeout' };
      }
      return { ...baseData, blocked: true, degraded: true, failureReason: 'Network error' };
    }

    if (response.status >= 400) {
      const elapsed = Date.now() - startTime;
      recordCost({ domain, type: 'fetch', costMs: elapsed });
      recordFailure(domain);
      return { ...baseData, blocked: true, degraded: true, failureReason: `HTTP ${response.status}` };
    }

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      recordFailure(domain);
      return { ...baseData, blocked: true, degraded: true, failureReason: 'Redirect detected' };
    }

    const html = await response.text();
    const elapsed = Date.now() - startTime;
    recordCost({ domain, type: 'fetch', costMs: elapsed });

    if (!html || html.length < 500) {
      recordFailure(domain);
      return { ...baseData, blocked: true, degraded: true, failureReason: 'Response too small' };
    }

    if (adapter.isBlocked(html)) {
      const reason = adapter.getBlockedReason(html) || 'Unknown block';
      recordFailure(domain);
      const partial = await adapter.extract(html, url);
      return { ...baseData, ...partial, blocked: true, degraded: true, failureReason: reason };
    }

    const partial = await adapter.extract(html, url);
    recordSuccess(domain);
    return { ...baseData, ...partial };
  } catch {
    recordFailure(domain);
    return { ...baseData, blocked: true, degraded: true, failureReason: 'Unexpected error' };
  }
}
