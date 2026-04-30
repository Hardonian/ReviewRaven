// Migration note: Vended from WarrantyWeasel shared-intelligence v1.0.0
// Evidence model - builds evidence details from signals and scraped data

import { EvidenceDetail } from '@reviewraven/shared-core';

export function buildEvidence(
  signalId: string,
  signalName: string,
  snippet: string,
  source: string
): EvidenceDetail {
  return {
    signalId,
    signal: signalName,
    snippet,
    source,
  };
}

export function buildEvidenceList(
  items: Array<{ signalId: string; signalName: string; snippet: string; source: string }>
): EvidenceDetail[] {
  return items.map(item => buildEvidence(item.signalId, item.signalName, item.snippet, item.source));
}
