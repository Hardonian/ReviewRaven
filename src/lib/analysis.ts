// Analysis engine using shared intelligence components
// Replaces ad-hoc signal detection, scoring, and confidence calculation

import { ScrapedData } from '@reviewraven/shared-intelligence';
import { SignalDetail, EvidenceDetail, Verdict, createSafeLogEntry, safeLog, hashNormalizedUrl, generateIdempotencyKey } from '@reviewraven/shared-core';
import {
  createReviewRavenRegistry,
  reviewSpecificSignals,
} from './review-signals';
import { createSignalRegistry, sharedSignals } from '@reviewraven/shared-intelligence';
import { calculateConfidence } from '@reviewraven/shared-intelligence';
import { calculateScore, determineVerdict, CategoryAdjustment } from '@reviewraven/shared-intelligence';
import { buildEvidence } from '@reviewraven/shared-intelligence';
import { categoryRules } from './intel/categoryRegistry';
import { detectCategory } from './category';
import { recordEvent, createSession, completeSession } from '@reviewraven/shared-diagnostics';
import { recordCost, incrementUnknown, incrementAnalysis } from '@reviewraven/shared-cost-control';
import { memoryCache, DEFAULT_CACHE_TTL_MS, getInFlight, setInFlight } from '@reviewraven/shared-infra';
import { extractDomain } from '@reviewraven/shared-core';

const LEGAL_TERMS = ['scam', 'fraud', 'guaranteed fake', 'illegal'];
const SAFE_REPLACEMENTS: Record<string, string> = {
  'scam': 'suspicious pattern',
  'fraud': 'inconsistent review behavior',
  'guaranteed fake': 'low trust signal',
  'illegal': 'unable to verify',
};

function sanitizeLanguage(text: string): string {
  let result = text;
  for (const [term, replacement] of Object.entries(SAFE_REPLACEMENTS)) {
    result = result.replace(new RegExp(term, 'gi'), replacement);
  }
  return result;
}

function findSignalDef(id: string) {
  const registry = createReviewRavenRegistry();
  return registry.get(id);
}

function detectSignals(data: ScrapedData): { signals: SignalDetail[], evidence: EvidenceDetail[] } {
  const signals: SignalDetail[] = [];
  const evidence: EvidenceDetail[] = [];

  const addSignal = (id: string, explanation: string, evSnippet?: string, evSource?: string) => {
    const def = findSignalDef(id);
    if (!def) return;
    const cleanExplanation = sanitizeLanguage(explanation);
    signals.push({ id: def.id, name: def.name, type: def.type, weight: def.weight, explanation: cleanExplanation });
    if (evSnippet) {
      evidence.push(buildEvidence(def.id, def.name, evSnippet, evSource || 'Review Text'));
    }
  };

  if (data.timestamps && data.timestamps.length >= 3) {
    const counts: Record<string, number> = {};
    for (const ts of data.timestamps) {
      counts[ts] = (counts[ts] || 0) + 1;
    }
    const maxSync = Math.max(...Object.values(counts));
    if (maxSync >= 3) {
      addSignal('SIG-S022', 'Multiple reviews posted at exact same time or date.', data.timestamps.find(ts => counts[ts] === maxSync), 'Timestamp');
    }
  }

  if (data.isVerified && data.isVerified.length >= 5) {
    const verifiedCount = data.isVerified.filter(v => v).length;
    const ratio = verifiedCount / data.isVerified.length;
    if (ratio <= 0.2) {
      addSignal('SIG-S002', `Only ${(ratio*100).toFixed(0)}% of recent reviews are verified purchases.`);
    } else if (ratio > 0.8) {
      addSignal('SIG-G001', `High ratio (${(ratio*100).toFixed(0)}%) of verified purchases.`);
    }
  }

  if (data.reviewSnippets && data.reviewSnippets.length > 0) {
    let superlativeCount = 0;
    const superlatives = ['best', 'perfect', 'amazing', 'incredible', 'flawless'];

    for (const snippet of data.reviewSnippets) {
      const lower = snippet.toLowerCase();
      const hasSup = superlatives.some(s => lower.includes(s));
      if (hasSup) superlativeCount++;

      if ((snippet.match(/!/g) || []).length >= 4 || (snippet.length > 10 && snippet === snippet.toUpperCase())) {
        addSignal('SIG-S024', 'Excessive exclamation marks or ALL CAPS detected.', snippet);
      }

      if (lower.includes('as an ai') || lower.includes('write a 5-star') || lower.includes('language model')) {
        addSignal('SIG-S100', 'AI prompt leak detected in review text.', snippet);
      }
    }

    if (superlativeCount / data.reviewSnippets.length > 0.5) {
      addSignal('SIG-S003', 'Unusually high density of superlative keywords across reviews.');
    }

    if (data.reviewSnippets.length >= 3) {
      const openings = data.reviewSnippets.map(s => s.substring(0, 15).toLowerCase());
      const uniqueOpenings = new Set(openings);
      if (uniqueOpenings.size / openings.length < 0.5) {
        addSignal('SIG-S006', 'Multiple reviews start with the exact same phrasing.', data.reviewSnippets[0].substring(0, 30) + '...');
      } else {
        addSignal('SIG-G005', 'Reviews show natural, unique phrasing.');
      }
    }
  }

  if (data.reviewerNames && data.reviewerNames.length >= 5) {
    let sequentialCount = 0;
    for (let i = 0; i < data.reviewerNames.length - 1; i++) {
      const n1 = data.reviewerNames[i].toLowerCase();
      const n2 = data.reviewerNames[i+1].toLowerCase();
      if (n1.substring(0, 5) === n2.substring(0, 5) && n1 !== n2) {
        sequentialCount++;
      }
    }
    if (sequentialCount >= 3) {
      addSignal('SIG-S008', 'Sequential naming patterns detected among reviewers.');
    }
  }

  if (!data.rating || !data.reviewCount) {
    addSignal('SIG-S005', 'Missing rating or review count suggests suppressed or new listing.');
  }

  return { signals, evidence };
}

export function analyzeProduct(data: ScrapedData): {
  schemaVersion: string;
  resultId: string;
  verdict: Verdict;
  confidence: number;
  confidenceExplanation: string;
  reasons: string[];
  signals: SignalDetail[];
  evidence: EvidenceDetail[];
  limitations: string[];
  nextSteps?: string[];
  degraded: boolean;
  diagnosticsId: string;
} {
  const resultId = crypto.randomUUID ? crypto.randomUUID() : generateIdempotencyKey(Date.now().toString()).key;
  const { signals, evidence } = detectSignals(data);

  const limitations: string[] = [];
  const nextSteps: string[] = [];

  if (data.blocked || data.degraded) {
    limitations.push(`Data collection was degraded: ${data.failureReason || 'Anti-bot protection'}`);
    nextSteps.push('Try analyzing a different product URL.');
    nextSteps.push('Manually verify the seller and return window.');
  } else {
    nextSteps.push('Check the seller rating independently.');
  }

  if (data.reviewSnippets.length === 0) {
    limitations.push('No review text was available to analyze.');
  }

  const category = data.category || detectCategory(data.title, '');
  const rules = categoryRules.find(c => c.category === category)?.adjustments || [];
  const categoryAdjustments: CategoryAdjustment[] = rules.map(r => ({ signalId: r.signalId, weightModifier: r.weightModifier }));

  const scoring = calculateScore(signals, categoryAdjustments);
  const hasUltimateSuspicion = scoring.adjustedSignals.some(s => s.name === 'Ultimate_Suspicion');
  const verdict = determineVerdict(scoring.totalRiskScore, data.blocked, !!data.degraded, data.reviewSnippets.length, hasUltimateSuspicion);

  const confidenceResult = calculateConfidence(
    scoring.adjustedSignals,
    scoring.signalStrength,
    data.blocked,
    !!data.degraded,
    data.reviewCount,
    data.reviewSnippets.length,
    !!data.title
  );

  const reasons = scoring.adjustedSignals
    .sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight))
    .slice(0, 3)
    .map(s => sanitizeLanguage(s.explanation));

  if (reasons.length === 0) {
    reasons.push('Insufficient data to form specific conclusions.');
  }

  const diagnosticsId = resultId;

  return {
    schemaVersion: '1.0.0',
    resultId,
    verdict,
    confidence: confidenceResult.confidence,
    confidenceExplanation: confidenceResult.explanation.join(' ') || 'Analysis complete.',
    reasons,
    signals: scoring.adjustedSignals,
    evidence,
    limitations,
    nextSteps: nextSteps.length > 0 ? nextSteps : undefined,
    degraded: !!data.degraded,
    diagnosticsId,
  };
}

export async function analyzeWithCache(url: string, data: ScrapedData) {
  const domain = extractDomain(url);
  const cacheKey = `analysis:${hashNormalizedUrl(url)}`;

  const cached = memoryCache.get(cacheKey) as ReturnType<typeof analyzeProduct> | null;
  if (cached) {
    recordCost({ domain, type: 'cache_miss', costMs: 0 });
    return cached;
  }

  const inFlight = getInFlight(cacheKey);
  if (inFlight) {
    return inFlight;
  }

  const promise = (async () => {
    const result = analyzeProduct(data);
    memoryCache.set(cacheKey, result, DEFAULT_CACHE_TTL_MS);
    return result;
  })();

  setInFlight(cacheKey, promise);
  return promise;
}
