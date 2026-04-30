import { ScrapedData } from './types';

const DESKTOP_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const MOBILE_USER_AGENT = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1';
const FETCH_TIMEOUT_MS = 10000;
const MAX_CONTENT_LENGTH = 5 * 1024 * 1024; // 5MB limit

function timeoutSignal(ms: number): AbortController {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller;
}

function sanitizeText(text: string): string {
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function extractNumber(text: string | null): number | null {
  if (!text) return null;
  const cleaned = text.replace(/,/g, '').replace(/[^\d.]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function getMetaContent(html: string, selector: string): string | null {
  const match = html.match(new RegExp(`<meta[^>]*(?:name|property)=["']${selector}["'][^>]*content=["']([^"']*)["']`, 'i'));
  if (match) return sanitizeText(match[1]);
  const match2 = html.match(new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*(?:name|property)=["']${selector}["']`, 'i'));
  if (match2) return sanitizeText(match2[1]);
  return null;
}

function extractJsonLd(html: string): any {
  const matches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  if (!matches) return null;
  
  for (const match of matches) {
    const innerMatch = match.match(/>([\s\S]*?)</);
    if (innerMatch) {
      try {
        const data = JSON.parse(innerMatch[1]);
        // simple heuristic to find product
        if (data['@type'] === 'Product' || (Array.isArray(data) && data.some(d => d['@type'] === 'Product'))) {
          return Array.isArray(data) ? data.find(d => d['@type'] === 'Product') : data;
        }
      } catch (e) {
        // parsing failed, try next
      }
    }
  }
  return null;
}

function parseFromHtmlAndJsonLd(html: string, site: string): Partial<ScrapedData> {
  const result: Partial<ScrapedData> = {
    reviewSnippets: [],
    timestamps: [],
    reviewerNames: [],
    isVerified: []
  };

  const jsonLd = extractJsonLd(html);
  
  if (jsonLd) {
    if (jsonLd.name) result.title = sanitizeText(jsonLd.name);
    if (jsonLd.aggregateRating) {
      if (jsonLd.aggregateRating.ratingValue) result.rating = parseFloat(jsonLd.aggregateRating.ratingValue);
      if (jsonLd.aggregateRating.reviewCount) result.reviewCount = parseInt(jsonLd.aggregateRating.reviewCount, 10);
      if (jsonLd.aggregateRating.ratingCount) result.ratingCount = parseInt(jsonLd.aggregateRating.ratingCount, 10);
    }
    
    if (jsonLd.review && Array.isArray(jsonLd.review)) {
      for (const rev of jsonLd.review) {
        if (rev.reviewBody && result.reviewSnippets!.length < 10) {
          result.reviewSnippets!.push(sanitizeText(rev.reviewBody));
          if (rev.datePublished) result.timestamps!.push(rev.datePublished);
          if (rev.author && rev.author.name) result.reviewerNames!.push(sanitizeText(rev.author.name));
          else result.reviewerNames!.push('Unknown');
        }
      }
    }
  }

  // Fallback to DOM parsing
  if (!result.title) result.title = getMetaContent(html, 'og:title') || getMetaContent(html, 'product:name');
  
  // Specific fallbacks
  if (site === 'amazon') {
    if (!result.title) {
       const m = html.match(/<span[^>]*id=["']productTitle["'][^>]*>([\s\S]*?)<\/span>/i);
       if (m) result.title = sanitizeText(m[1]);
    }
    if (!result.rating) {
      const rm = html.match(/"ratingValue"\s*:\s*"([\d.]+)"/i) || html.match(/<span[^>]*class=["'][^"']*a-icon-alt[^"']*["'][^>]*>([\d.]+)\s*out of/i);
      if (rm) result.rating = parseFloat(rm[1]);
    }
    if (!result.reviewCount) {
      const rcm = html.match(/"reviewCount"\s*:\s*"([\d,]+)"/i) || html.match(/<span[^>]*id=["']acrCustomerReviewText["'][^>]*>([\d,]+)\s*ratings/i);
      if (rcm) result.reviewCount = extractNumber(rcm[1]);
    }
    
    if (!result.reviewSnippets || result.reviewSnippets.length === 0) {
      const reviewRegex = /<span[^>]*data-hook=["']review-body["'][^>]*>([\s\S]*?)<\/span>/gi;
      let m: RegExpExecArray | null;
      while ((m = reviewRegex.exec(html)) !== null && result.reviewSnippets!.length < 5) {
        result.reviewSnippets!.push(sanitizeText(m[1]));
      }
    }
  } else if (site === 'walmart' || site === 'bestbuy') {
     if (!result.rating) {
        const ratingMatch = html.match(/"ratingValue"\s*:\s*"?([\d.]+)"?/i);
        if (ratingMatch) result.rating = parseFloat(ratingMatch[1]);
     }
     if (!result.reviewCount) {
        const reviewCountMatch = html.match(/"reviewCount"\s*:\s*"?([\d,]+)"?/i);
        if (reviewCountMatch) result.reviewCount = extractNumber(reviewCountMatch[1]);
     }
  }

  // General fallback for rating
  if (!result.rating) {
     const ratingMatch = html.match(/"ratingValue"\s*:\s*"?([\d.]+)"?/i);
     if (ratingMatch) result.rating = parseFloat(ratingMatch[1]);
  }
  if (!result.reviewCount) {
     const reviewCountMatch = html.match(/"reviewCount"\s*:\s*"?([\d,]+)"?/i);
     if (reviewCountMatch) result.reviewCount = extractNumber(reviewCountMatch[1]);
  }
  if (!result.ratingCount) {
     const ratingCountMatch = html.match(/"ratingCount"\s*:\s*"?([\d,]+)"?/i);
     if (ratingCountMatch) result.ratingCount = extractNumber(ratingCountMatch[1]);
  }

  return result;
}

function detectSite(url: string): string {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    if (hostname.includes('amazon')) return 'amazon';
    if (hostname.includes('walmart')) return 'walmart';
    if (hostname.includes('bestbuy')) return 'bestbuy';
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

interface FetchResult {
  html: string;
  status: number;
  blocked: boolean;
  degraded?: boolean;
  failureReason?: string;
}

async function performFetch(url: string, userAgent: string): Promise<FetchResult> {
  const controller = timeoutSignal(FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': userAgent,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      redirect: 'manual',
    });

    if (response.status === 429) {
      return { html: '', status: 429, blocked: true, failureReason: 'Rate Limit (429)' };
    }
    if (response.status === 403 || response.status === 401) {
      return { html: '', status: response.status, blocked: true, failureReason: 'WAF/Blocked (403)' };
    }
    if ([301, 302, 303, 307, 308].includes(response.status)) {
       // Region redirect or other redirect
       return { html: '', status: response.status, blocked: true, failureReason: 'Redirected' };
    }
    if (response.status >= 400) {
      return { html: '', status: response.status, blocked: true, failureReason: 'HTTP Error ' + response.status };
    }

    const html = await response.text();
    if (!html || html.length < 500) {
      return { html, status: response.status, blocked: true, failureReason: 'Empty 200' };
    }

    if (html.includes('captcha') || html.includes('robot') || html.includes('chk_captcha') || html.includes('hCaptcha')) {
      return { html, status: response.status, blocked: true, failureReason: 'Captcha Detected' };
    }

    return { html, status: 200, blocked: false };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return { html: '', status: 0, blocked: true, failureReason: 'Timeout' };
    }
    return { html: '', status: 0, blocked: true, failureReason: 'Fetch Error' };
  }
}

export async function scrapeProduct(url: string): Promise<ScrapedData> {
  const baseData: ScrapedData = {
    title: null,
    rating: null,
    ratingCount: null,
    reviewCount: null,
    reviewSnippets: [],
    timestamps: [],
    reviewerNames: [],
    isVerified: [],
    blocked: false,
  };

  // Tier 1: Direct Desktop Fetch
  let fetchResult = await performFetch(url, DESKTOP_USER_AGENT);
  
  if (fetchResult.blocked && (fetchResult.status === 403 || fetchResult.failureReason === 'Captcha Detected' || fetchResult.status === 429)) {
    // Tier 2: Mobile UA Fallback
    fetchResult = await performFetch(url, MOBILE_USER_AGENT);
    if (!fetchResult.blocked) {
      fetchResult.degraded = true;
      fetchResult.failureReason = 'Mobile UA Fallback used';
    }
  }

  if (fetchResult.blocked) {
    // Return graceful degradation with blocked true
    return { ...baseData, blocked: true, failureReason: fetchResult.failureReason, degraded: true };
  }

  const site = detectSite(url);
  const parsedData = parseFromHtmlAndJsonLd(fetchResult.html, site);

  // If no title, consider empty listing (FS-50)
  if (!parsedData.title) {
    return { ...baseData, blocked: true, failureReason: 'Inactive or Empty Listing', degraded: true };
  }

  return {
    ...baseData,
    ...parsedData,
    blocked: false,
    degraded: fetchResult.degraded,
    failureReason: fetchResult.failureReason
  };
}
