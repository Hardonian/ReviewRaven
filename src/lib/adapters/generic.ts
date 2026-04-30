import { DomainAdapter, ScrapedData } from '@reviewraven/shared-intelligence';

function sanitizeText(text: string): string {
  return text.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
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

export const genericAdapter: DomainAdapter = {
  domain: 'generic',

  async extract(html: string, _url: string): Promise<Partial<ScrapedData>> {
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
  },

  isBlocked(html: string): boolean {
    return html.includes('captcha') || html.includes('robot') || html.includes('blocked') || html.includes('access denied');
  },

  getBlockedReason(html: string): string | null {
    if (html.includes('captcha')) return 'Captcha challenge detected';
    if (html.includes('robot')) return 'Robot check triggered';
    if (html.includes('blocked')) return 'Request blocked';
    if (html.includes('access denied')) return 'Access denied';
    return null;
  },
};
