import { validateUrl } from '@/lib/url-validation';
import { scrapeProduct } from '@/lib/scraper';
import { analyzeProduct } from '@/lib/analysis';
import { AnalyzeResponse, ErrorResponse } from '@/lib/types';

const RATE_LIMIT = new Map<string, { count: number; resetAt: number }>();

function getRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = RATE_LIMIT.get(ip);
  if (!entry || now > entry.resetAt) {
    RATE_LIMIT.set(ip, { count: 1, resetAt: now + 60000 });
    return true;
  }
  if (entry.count >= 5) { return false; }
  entry.count++;
  return true;
}

function getClientIp(headers: Headers): string {
  return headers.get('x-forwarded-for')?.split(',')[0] || headers.get('x-real-ip') || 'unknown';
}

const errorResponse = (code: string, message: string, retryable: boolean, status: number) => {
  return Response.json({ ok: false, code, message, retryable }, { status });
};

export async function POST(request: Request) {
  const clientIp = getClientIp(request.headers);
  if (!getRateLimit(clientIp)) {
    return errorResponse('RATE_LIMITED', 'Too many requests. Please wait a moment and try again.', true, 429);
  }
  let body: { url?: string };
  try { body = await request.json(); }
  catch { return errorResponse('INVALID_BODY', 'Request body must be valid JSON.', false, 400); }
  if (!body.url || typeof body.url !== 'string') {
    return errorResponse('MISSING_URL', 'A product URL is required.', false, 400);
  }
  const validation = validateUrl(body.url);
  if (!validation.valid) {
    return errorResponse('INVALID_URL', validation.error || 'Invalid URL.', false, 400);
  }
  if (!validation.isAllowedHost) {
    return errorResponse('UNSUPPORTED_STORE', 'Only Amazon, Walmart, and Best Buy are currently supported.', false, 400);
  }
  const scrapedData = await scrapeProduct(validation.url!);
  const analysis = analyzeProduct(scrapedData, validation.url!);
  const response: AnalyzeResponse = {
    ok: true,
    data: { url: validation.url!, title: scrapedData.title, result: analysis },
  };
  return Response.json(response);
}
