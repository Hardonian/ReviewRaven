// Migration note: Vended from WarrantyWeasel shared-infra v1.0.0
// Health checks

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  checks: Record<string, { status: 'pass' | 'fail' | 'warn'; details?: string }>;
}

const healthChecks = new Map<string, () => Promise<{ status: 'pass' | 'fail' | 'warn'; details?: string }>>();

export function registerHealthCheck(
  name: string,
  check: () => Promise<{ status: 'pass' | 'fail' | 'warn'; details?: string }>
): void {
  healthChecks.set(name, check);
}

export async function runHealthChecks(version: string): Promise<HealthStatus> {
  const checks: HealthStatus['checks'] = {};
  let overallStatus: HealthStatus['status'] = 'healthy';

  const entries = Array.from(healthChecks.entries());
  for (let i = 0; i < entries.length; i++) {
    const [name, check] = entries[i];
    try {
      const result = await check();
      checks[name] = result;
      if (result.status === 'fail') {
        overallStatus = 'unhealthy';
      } else if (result.status === 'warn' && overallStatus !== 'unhealthy') {
        overallStatus = 'degraded';
      }
    } catch (error) {
      checks[name] = { status: 'fail', details: error instanceof Error ? error.message : 'Unknown error' };
      overallStatus = 'unhealthy';
    }
  }

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version,
    checks,
  };
}
