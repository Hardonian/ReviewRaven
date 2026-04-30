import { validateUrl, extractDomain, createSafeLogEntry, safeLog } from '@reviewraven/shared-core';
import { scrapeProduct } from '@/lib/scraper';
import { analyzeProduct } from '@/lib/analysis';
import { detectCategory } from '@/lib/category';
import { recordEvent, createSession, completeSession } from '@reviewraven/shared-diagnostics';
import type { DiagnosticEventType } from '@reviewraven/shared-diagnostics';
import { recordCost, incrementUnknown, incrementAnalysis } from '@reviewraven/shared-cost-control';
import { checkRateLimit, structuredLog } from '@reviewraven/shared-infra';

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 5;

function getClientIp(headers: Headers): string {
  return headers.get('x-forwarded-for')?.split(',')[0] ||
    headers.get('x-real-ip') ||
    'unknown';
}

export async function POST(request: Request) {
  const clientIp = getClientIp(request.headers);

  if (!checkRateLimit(clientIp, RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_MS)) {
    structuredLog('warn', 'review-raven', 'rate_limit_exceeded', { metadata: { ip: '[REDACTED]' } });
    return Response.json(
      { schemaVersion: '1.0.0', ok: false, code: 'RATE_LIMITED', message: 'Too many requests. Please wait a moment and try again.', retryable: true },
      { status: 429 }
    );
  }

  let body: { url?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { schemaVersion: '1.0.0', ok: false, code: 'INVALID_BODY', message: 'Request body must be valid JSON.', retryable: false },
      { status: 400 }
    );
  }

  if (!body.url || typeof body.url !== 'string') {
    return Response.json(
      { schemaVersion: '1.0.0', ok: false, code: 'MISSING_URL', message: 'A product URL is required.', retryable: false },
      { status: 400 }
    );
  }

  const validation = validateUrl(body.url);

  if (!validation.valid) {
    return Response.json(
      { schemaVersion: '1.0.0', ok: false, code: 'INVALID_URL', message: validation.error || 'Invalid URL.', retryable: false },
      { status: 400 }
    );
  }

  if (!validation.isAllowedHost) {
    const domain = validation.host || 'unknown';
    recordEvent('unsupported_domain', body.url, { metadata: { domain } });
    return Response.json(
      { schemaVersion: '1.0.0', ok: false, code: 'UNSUPPORTED_STORE', message: 'Only Amazon, Walmart, and Best Buy are currently supported.', retryable: false },
      { status: 400 }
    );
  }

  const domain = validation.host!;
  const startTime = Date.now();
  const session = createSession(body.url);

  recordEvent('analyze_started', body.url, { metadata: { domain } });
  structuredLog('info', 'review-raven', 'analyze_started', { url: body.url });

  try {
    const scrapedData = await scrapeProduct(validation.url!);
    const category = detectCategory(scrapedData.title, validation.url!);
    scrapedData.category = category;

    if (scrapedData.blocked) {
      recordEvent('domain_blocked', body.url, { degraded: true, metadata: { domain, reason: scrapedData.failureReason } });
    }

    const analysis = analyzeProduct(scrapedData);

    recordEvent('analyze_completed', body.url, {
      verdict: analysis.verdict,
      confidence: analysis.confidence,
      degraded: analysis.degraded,
      metadata: { domain, category },
    });

    if (analysis.verdict === 'UNKNOWN') {
      recordEvent('unknown_result', body.url, { verdict: 'UNKNOWN', metadata: { domain } });
      incrementUnknown(domain);
    }

    if (analysis.degraded) {
      recordEvent('degraded_result', body.url, { degraded: true, metadata: { domain } });
    }

    incrementAnalysis(domain);
    recordCost({ domain, type: 'analyzer_runtime', costMs: Date.now() - startTime });

    completeSession(session.sessionId, 'completed');

    safeLog(createSafeLogEntry('info', 'analyze_completed', body.url, {
      verdict: analysis.verdict,
      confidence: analysis.confidence,
      degraded: analysis.degraded,
    }));

    const response = {
      schemaVersion: '1.0.0',
      ok: true as const,
      resultId: analysis.resultId,
      verdict: analysis.verdict,
      confidence: analysis.confidence,
      confidenceExplanation: analysis.confidenceExplanation,
      reasons: analysis.reasons,
      signals: analysis.signals,
      evidence: analysis.evidence,
      limitations: analysis.limitations,
      degraded: analysis.degraded,
      diagnosticsId: analysis.diagnosticsId,
    };

    return Response.json(response);
  } catch (error) {
    recordEvent('analyze_failed', body.url, { degraded: true, metadata: { domain, error: 'internal_error' } });
    completeSession(session.sessionId, 'failed');

    structuredLog('error', 'review-raven', 'analyze_failed', { url: body.url, metadata: { error: 'internal_error' } });

    const diagnosticsId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);

    return Response.json({
      schemaVersion: '1.0.0',
      ok: true as const,
      resultId: diagnosticsId,
      verdict: 'UNKNOWN' as const,
      confidence: 0,
      confidenceExplanation: 'Analysis failed due to an unexpected error. We were unable to verify the product trust signals.',
      reasons: ['Internal system error during analysis.'],
      signals: [],
      evidence: [],
      limitations: ['System encountered an error.'],
      degraded: true,
      diagnosticsId,
    });
  }
}
