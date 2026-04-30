// Migration note: Vended from WarrantyWeasel shared-infra v1.0.0
// In-flight request deduplication

const inFlightRequests = new Map<string, Promise<unknown>>();

export function getInFlight<T>(key: string): Promise<T> | null {
  return (inFlightRequests.get(key) as Promise<T>) || null;
}

export function setInFlight<T>(key: string, promise: Promise<T>): void {
  inFlightRequests.set(key, promise);
  promise.finally(() => {
    inFlightRequests.delete(key);
  });
}

export function hasInFlight(key: string): boolean {
  return inFlightRequests.has(key);
}
