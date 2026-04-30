import { ErrorResponse } from '@/lib/types';

const ANALYTICS_EVENTS = new Map<string, number>();

function incrementEvent(event: string) {
  const current = ANALYTICS_EVENTS.get(event) || 0;
  ANALYTICS_EVENTS.set(event, current + 1);
}

export async function POST(request: Request) {
  let body: { event?: string };
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

  const validEvents = ['analyze_started', 'analyze_completed', 'result_viewed', 'share_clicked'];
  if (!validEvents.includes(body.event)) {
    return Response.json(
      { ok: false, code: 'INVALID_EVENT', message: `Event must be one of: ${validEvents.join(', ')}.`, retryable: false },
      { status: 400 }
    );
  }

  incrementEvent(body.event);

  return Response.json({ ok: true, event: body.event });
}

export async function GET() {
  const events: Record<string, number> = {};
  Array.from(ANALYTICS_EVENTS.entries()).forEach(([event, count]) => {
    events[event] = count;
  });

  return Response.json({ ok: true, events });
}
