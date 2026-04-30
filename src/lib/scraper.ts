import { ScrapedData } from './types';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const FETCH_TIMEOUT_MS = 10000;

function timeoutSignal(ms: number): AbortController {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller;
}

function sanitizeText(text: string): string {
  return text
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

function extractAmazonData(html: string): Partial<ScrapedData> {
  const result: Partial<ScrapedData> = {};
  const title = getMetaContent(html, 'og:title') || getMetaContent(html, 'product:name') || (() => {
    const m = html.match(/<span[^>]*id=["']productTitle["'][^>]*>([\s\S]*?)<\/span>/i);
    return m ? sanitizeText(m[1]) : null;
  })();
  if (title) result.title = title;
  const ratingMatch = html.match(/"ratingValue"\s*:\s*"([\d.]+)"/i);
  if (ratingMatch) result.rating = parseFloat(ratingMatch[1]);
  const ratingCountMatch = html.match(/"ratingCount"\s*:\s*"([\d,]+)"/i);
  if (ratingCountMatch) result.ratingCount = extractNumber(ratingCountMatch[1]);
  const reviewCountMatch = html.match(/"reviewCount"\s*:\s*"([\d,]+)"/i);
  if (reviewCountMatch) result.reviewCount = extractNumber(reviewCountMatch[1]);
  const reviewSnippets: string[] = [];
  const reviewRegex = /<span[^>]*data-hook=["']review-body["'][^>]*>([\s\S]*?)<\/span>/gi;
  let m: RegExpExecArray | null;
  while ((m = reviewRegex.exec(html)) !== null && reviewSnippets.length < 5) {
    const text = sanitizeText(m[1]);
    if (text) reviewSnippets.push(text);
  }
  if (reviewSnippets.length > 0) result.reviewSnippets = reviewSnippets;
  const timestamps: string[] = [];
  const tsRegex = /<span[^>]*data-hook=["']review-date["'][^>]*>([\s\S]*?)<\/span>/gi;
  let ts: RegExpExecArray | null;
  while ((ts = tsRegex.exec(html)) !== null && timestamps.length < 10) {
    const text = sanitizeText(ts[1]);
    if (text) timestamps.push(text);
  }
  if (timestamps.length > 0) result.timestamps = timestamps;
  const reviewerNames: string[] = [];
  const nameRegex = /<span[^>]*class=["']a-profile-name["'][^>]*>([\s\S]*?)<\/span>/gi;
  let name: RegExpExecArray | null;
  while ((name = nameRegex.exec(html)) !== null && reviewerNames.length < 10) {
    const text = sanitizeText(name[1]);
    if (text) reviewerNames.push(text);
  }
  if (reviewerNames.length > 0) result.reviewerNames = reviewerNames;
  const isVerified: boolean[] = [];
  const verifiedRegex = /<span[^>]*data-hook=["']avp-badge["'][^>]*>([\s\S]*?)<\/span>/gi;
  let verified: RegExpExecArray | null;
  while ((verified = verifiedRegex.exec(html)) !== null && isVerified.length < 10) {
    const text = sanitizeText(verified[1]);
    isVerified.push(text.toLowerCase().includes('verified purchase'));
  }
  if (isVerified.length > 0) result.isVerified = isVerified;
  return result;
}

function extractWalmartData(html: string): Partial<ScrapedData> {
  const result: Partial<ScrapedData> = {};
  const title = getMetaContent(html, 'og:title');
  if (title) result.title = title;
  const ratingMatch = html.match(/"ratingValue"\s*:\s*([\d.]+)/i);
  if (ratingMatch) result.rating = parseFloat(ratingMatch[1]);
  const reviewCountMatch = html.match(/"reviewCount"\s*:\s*([\d,]+)/i);
  if (reviewCountMatch) result.reviewCount = extractNumber(reviewCountMatch[1]);
  return result;
}

function extractBestBuyData(html: string): Partial<ScrapedData> {
  const result: Partial<ScrapedData> = {};
  const title = getMetaContent(html, 'og:title');
  if (title) result.title = title;
  const ratingMatch = html.match(/"ratingValue"\s*:\s*([\d.]+)/i);
  if (ratingMatch) result.rating = parseFloat(ratingMatch[1]);
  const reviewCountMatch = html.match(/"reviewCount"\s*:\s*([\d,]+)/i);
  if (reviewCountMatch) result.reviewCount = extractNumber(reviewCountMatch[1]);
  return result;
}

function detectSite(url: string): string {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    if (hostname.includes('amazon')) return 'amazon';
    if (hostname.includes('walmart')) return 'walmart';
    if (hostname.includes('bestbuy')) return 'bestbuy';
    return 'unknown';
  } catch { return 'unknown'; }
}

export async function scrapeProduct(url: string): Promise<ScrapedData> {
  const baseData: ScrapedData = {
    title: null, rating: null, ratingCount: null, reviewCount: null,
    reviewSnippets: [], timestamps: [], reviewerNames: [], isVerified: [], blocked: false,
  };
  try {
    const controller = timeoutSignal(FETCH_TIMEOUT_MS);
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
      if (fetchError instanceof Error && fetchError.name === 'AbortError') { return { ...baseData, blocked: true }; }
      return { ...baseData, blocked: true };
    }
    if (response.status >= 400) { return { ...baseData, blocked: true }; }
    if ([301, 302, 303, 307, 308].includes(response.status)) { return { ...baseData, blocked: true }; }
    const html = await response.text();
    if (!html || html.length < 500) { return { ...baseData, blocked: true }; }
    if (html.includes('captcha') || html.includes('robot') || html.includes('chk_captcha')) {
      const partial = extractGenericData(html);
      return { ...baseData, ...partial, blocked: true };
    }
    const site = detectSite(url);
    let partial: Partial<ScrapedData>;
    switch (site) {
      case 'amazon': partial = extractAmazonData(html); break;
      case 'walmart': partial = extractWalmartData(html); break;
      case 'bestbuy': partial = extractBestBuyData(html); break;
      default: partial = extractGenericData(html);
    }
    return { ...baseData, ...partial };
  } catch { return { ...baseData, blocked: true }; }
}

function extractGenericData(html: string): Partial<ScrapedData> {
  const result: Partial<ScrapedData> = {};
  const title = getMetaContent(html, 'og:title') || getMetaContent(html, 'product:name');
  if (title) result.title = title;
  const ratingMatch = html.match(/"ratingValue"\s*:\s*"?([\d.]+)"?/i);
  if (ratingMatch) result.rating = parseFloat(ratingMatch[1]);
  const reviewCountMatch = html.match(/"reviewCount"\s*:\s*"?([\d,]+)"?/i);
  if (reviewCountMatch) result.reviewCount = extractNumber(reviewCountMatch[1]);
  const ratingCountMatch = html.match(/"ratingCount"\s*:\s*"?([\d,]+)"?/i);
  if (ratingCountMatch) result.ratingCount = extractNumber(ratingCountMatch[1]);
  return result;
}
