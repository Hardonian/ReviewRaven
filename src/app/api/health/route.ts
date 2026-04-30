import { runHealthChecks } from '@reviewraven/shared-infra';

const VERSION = '0.1.0';

export async function GET() {
  const health = await runHealthChecks(VERSION);
  return Response.json(health);
}
