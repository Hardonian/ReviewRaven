import { DomainAdapter } from '@reviewraven/shared-intelligence';
import { amazonAdapter } from './amazon';
import { walmartAdapter } from './walmart';
import { bestbuyAdapter } from './bestbuy';
import { genericAdapter } from './generic';

const adapters: DomainAdapter[] = [amazonAdapter, walmartAdapter, bestbuyAdapter, genericAdapter];

export function getAdapterForUrl(url: string): DomainAdapter {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    if (hostname.includes('amazon')) return amazonAdapter;
    if (hostname.includes('walmart')) return walmartAdapter;
    if (hostname.includes('bestbuy')) return bestbuyAdapter;
    return genericAdapter;
  } catch {
    return genericAdapter;
  }
}

export function detectSite(url: string): string {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    if (hostname.includes('amazon')) return 'amazon';
    if (hostname.includes('walmart')) return 'walmart';
    if (hostname.includes('bestbuy')) return 'bestbuy';
    return 'generic';
  } catch {
    return 'generic';
  }
}

export { amazonAdapter, walmartAdapter, bestbuyAdapter, genericAdapter };
