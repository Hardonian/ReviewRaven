import { recordEvent } from '@reviewraven/shared-diagnostics';
import type { DiagnosticEventType } from '@reviewraven/shared-diagnostics';

const VALID_EVENTS: DiagnosticEventType[] = [
  'analyze_started',
  'analyze_completed',
  'analyze_failed',
  'unknown_result',
  'degraded_result',
  'high_risk_result',
  'cache_hit',
  'cache_miss',
  'domain_blocked',
  'unsupported_domain',
  'share_clicked',
];

export async function POST(request: Request) {
  let body: { event?: string; url?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { ok: false, code: 'INVALID_BODY', message: 'Request body must be valid JSON.', retryable: false },
      { status: 400 }
    );
  }

  if (!body.event || typeof body.event !== 'string') {
    return Response.json(
      { ok: false, code: 'MISSING_EVENT', message: 'An event name is required.', retryable: false },
      { status: 400 }
    );
  }

  if (!VALID_EVENTS.includes(body.event as DiagnosticEventType)) {
    return Response.json(
      { ok: false, code: 'INVALID_EVENT', message: `Event must be one of: ${VALID_EVENTS.join(', ')}.`, retryable: false },
      { status: 400 }
    );
  }

  const url = body.url || 'https://example.com/unknown';
  recordEvent(body.event as DiagnosticEventType, url);

  return Response.json({ ok: true, event: body.event });
}

export async function GET() {
  return Response.json({ ok: true, validEvents: VALID_EVENTS });
}
