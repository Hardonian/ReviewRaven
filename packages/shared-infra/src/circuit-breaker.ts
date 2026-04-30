// Migration note: Vended from WarrantyWeasel shared-infra v1.0.0
// Per-domain circuit breaker

export interface CircuitBreakerState {
  domain: string;
  failures: number;
  lastFailureAt: number;
  state: 'closed' | 'open' | 'half-open';
  resetAt: number;
}

const circuitBreakers = new Map<string, CircuitBreakerState>();

const FAILURE_THRESHOLD = 5;
const RESET_TIMEOUT_MS = 60_000;

export function getCircuitBreaker(domain: string): CircuitBreakerState {
  let state = circuitBreakers.get(domain);
  if (!state) {
    state = {
      domain,
      failures: 0,
      lastFailureAt: 0,
      state: 'closed',
      resetAt: 0,
    };
    circuitBreakers.set(domain, state);
  }

  if (state.state === 'open' && Date.now() > state.resetAt) {
    state.state = 'half-open';
    state.failures = 0;
  }

  return state;
}

export function recordSuccess(domain: string): void {
  const state = getCircuitBreaker(domain);
  if (state.state === 'half-open') {
    state.state = 'closed';
    state.failures = 0;
  } else {
    state.failures = Math.max(0, state.failures - 1);
  }
}

export function recordFailure(domain: string): void {
  const state = getCircuitBreaker(domain);
  state.failures++;
  state.lastFailureAt = Date.now();

  if (state.failures >= FAILURE_THRESHOLD) {
    state.state = 'open';
    state.resetAt = Date.now() + RESET_TIMEOUT_MS;
  }
}

export function isCircuitOpen(domain: string): boolean {
  const state = getCircuitBreaker(domain);
  return state.state === 'open';
}
