import { ScrapedData, AnalysisResult, SignalDetail, Evidence } from './types';
import { detectCategory, getCategoryAdjustments } from './category';
import { reviewSignals } from './intel/signalRegistry';

const GENERIC_PATTERNS = [
  'great product', 'works great', 'love it', 'highly recommend', 'best purchase',
  'exactly as described', 'fast shipping', 'good value', 'five stars', 'amazing',
  'perfect gift', 'would buy again', 'very happy', 'so glad', 'must buy',
  'quality product', 'great quality', 'worth the price', 'exceeded expectations',
  'just what i needed', 'could not be happier', 'amazing perfect incredible',
  'dear customer', 'hello friends',
];

const PROMPT_LEAK_PATTERNS = [
  'as an ai language model',
  'here is a 5-star review',
  'i cannot fulfill this request',
  'i am an ai',
  'text-based model',
];

function findSignalDef(id: string) {
  return reviewSignals.find(s => s.id === id);
}

function analyzeRatingSkew(rating: number | null, reviewCount: number | null): SignalDetail {
  const def = findSignalDef('SIG-S009')!;
  if (!rating || !reviewCount || reviewCount < 5) {
    return { id: def.id, name: def.name, score: 0, description: 'Insufficient data to analyze rating distribution' };
  }

  if (rating >= 4.8) {
    return {
      id: def.id,
      name: def.name,
      score: 25,
      description: 'Rating is unusually high (' + rating.toFixed(1) + '). Products with near-perfect scores often have inflated reviews.',
    };
  }

  if (rating >= 4.5) {
    return {
      id: def.id,
      name: def.name,
      score: 10,
      description: 'Rating is high (' + rating.toFixed(1) + '). Slightly above typical authentic patterns.',
    };
  }

  return {
    id: def.id,
    name: def.name,
    score: 0,
    description: 'Rating (' + rating.toFixed(1) + ') falls within typical authentic range.',
  };
}

function analyzeReviewVolume(reviewCount: number | null, ratingCount: number | null): SignalDetail {
  const def = findSignalDef('SIG-S010')!;
  const count = reviewCount || ratingCount || 0;

  if (count === 0) {
    return { id: def.id, name: def.name, score: 20, description: 'No reviews available. Unable to verify product quality.' };
  }

  if (count < 10) {
    return { id: def.id, name: def.name, score: 15, description: 'Very few reviews (' + count + '). Limited data for trust assessment.' };
  }

  if (count < 50) {
    return { id: def.id, name: def.name, score: 5, description: 'Moderate review count (' + count + '). Some data available.' };
  }

  return { id: def.id, name: def.name, score: 0, description: 'Substantial review count (' + count + '). Good data for analysis.' };
}

function analyzeGenericContent(snippets: string[]): SignalDetail {
  const def = findSignalDef('SIG-S003')!;
  if (!snippets || snippets.length === 0) {
    return { id: def.id, name: def.name, score: 0, description: 'No review text available to analyze.' };
  }

  let genericCount = 0;
  for (const snippet of snippets) {
    const lower = snippet.toLowerCase();
    for (const pattern of GENERIC_PATTERNS) {
      if (lower.includes(pattern)) {
        genericCount++;
        break;
      }
    }
  }

  const ratio = genericCount / snippets.length;

  if (ratio > 0.6) {
    return {
      id: def.id,
      name: def.name,
      score: 30,
      description: 'High concentration of generic phrases detected in reviews. This pattern is consistent with inauthentic reviews.',
    };
  }

  if (ratio > 0.3) {
    return {
      id: def.id,
      name: def.name,
      score: 15,
      description: 'Some generic phrases detected. Mixed authenticity signals.',
    };
  }

  return {
    id: def.id,
    name: def.name,
    score: 0,
    description: 'Review language appears varied and specific.',
  };
}

function analyzeSnippetDiversity(snippets: string[]): SignalDetail {
  const def = findSignalDef('SIG-S006')!;
  if (!snippets || snippets.length < 3) {
    return { id: def.id, name: def.name, score: 0, description: 'Too few reviews to assess diversity.' };
  }

  const uniqueStarts = new Set(snippets.map((s) => s.toLowerCase().substring(0, 20)));
  const uniquenessRatio = uniqueStarts.size / snippets.length;

  if (uniquenessRatio < 0.7) {
    return {
      id: def.id,
      name: def.name,
      score: 25,
      description: 'Low diversity in review openings. Suspicious pattern of similar reviews.',
    };
  }

  return {
    id: def.id,
    name: def.name,
    score: 0,
    description: 'Reviews show good diversity in length and phrasing.',
  };
}

function analyzeKeywordSpam(snippets: string[]): SignalDetail {
  const def = findSignalDef('SIG-S024')!;
  if (!snippets || snippets.length === 0) {
    return { id: def.id, name: def.name, score: 0, description: 'No review text to analyze.' };
  }

  let spamCount = 0;
  const keywordPatterns = [
    /\b(buy|purchase|order|get|grab)\s+(this|it|one|now|today|yours)\b/gi,
    /\b(100%|definitely|absolutely|guaranteed|must-have|no doubt)\b/gi,
    /[!]{2,}/g,
    /\b(AMAZING|INCREDIBLE|PERFECT|BEST EVER|LIFE CHANGING)\b/g,
  ];

  for (const snippet of snippets) {
    let matches = 0;
    for (const pattern of keywordPatterns) {
      const found = snippet.match(pattern);
      if (found && found.length > 1) matches++;
    }
    if (matches > 0) spamCount++;
  }

  const ratio = spamCount / snippets.length;

  if (ratio > 0.4) {
    return {
      id: def.id,
      name: def.name,
      score: 25,
      description: 'High concentration of promotional language and excessive emphasis detected.',
    };
  }

  return {
    id: def.id,
    name: def.name,
    score: 0,
    description: 'Language appears natural without excessive promotional patterns.',
  };
}

function analyzeTemporalSync(timestamps: string[]): SignalDetail {
  const def = findSignalDef('SIG-S022')!;
  if (!timestamps || timestamps.length < 5) {
    return { id: def.id, name: 'Temporal Synchronization', score: 0, description: 'Insufficient temporal data' };
  }

  const counts: Record<string, number> = {};
  for (const ts of timestamps) {
    counts[ts] = (counts[ts] || 0) + 1;
  }

  const maxSync = Math.max(...Object.values(counts));
  if (maxSync >= 5) {
    return {
      id: def.id,
      name: 'Temporal Synchronization',
      score: 45,
      description: 'Multiple reviews posted simultaneously. This suggests a coordinated synthetic burst.',
    };
  }

  return { id: def.id, name: 'Temporal Synchronization', score: 0, description: 'Reviews are naturally distributed over time.' };
}

function analyzeVerifiedRatio(isVerified: boolean[]): SignalDetail {
  const def = findSignalDef('SIG-S002')!;
  if (!isVerified || isVerified.length < 5) {
    return { id: def.id, name: 'Verified Purchases', score: 0, description: 'Insufficient verification data' };
  }

  const verifiedCount = isVerified.filter(v => v).length;
  const ratio = verifiedCount / isVerified.length;

  if (ratio <= 0.2) {
    return {
      id: def.id,
      name: 'Verified Purchases',
      score: 40,
      description: 'Very low ratio of verified purchases (' + (ratio * 100).toFixed(0) + '%). High risk of incentivized bias.',
    };
  }

  return { id: def.id, name: 'Verified Purchases', score: 0, description: 'Healthy ratio of verified purchases detected.' };
}

function analyzeAuthorPatterns(names: string[]): SignalDetail {
  const def = findSignalDef('SIG-S008')!;
  if (!names || names.length < 5) {
    return { id: def.id, name: 'Author Pattern', score: 0, description: 'Insufficient author data' };
  }

  let sequentialCount = 0;
  for (let i = 0; i < names.length - 1; i++) {
    const n1 = names[i].toLowerCase();
    const n2 = names[i+1].toLowerCase();
    if (n1.substring(0, 5) === n2.substring(0, 5) && n1 !== n2) {
      sequentialCount++;
    }
  }

  if (sequentialCount >= 3) {
    return {
      id: def.id,
      name: 'Author Pattern',
      score: 35,
      description: 'Sequential naming patterns detected among reviewers. Highly characteristic of bot farms.',
    };
  }

  return { id: def.id, name: 'Author Pattern', score: 0, description: 'Reviewer identities appear organic.' };
}

function analyzePromptLeaks(snippets: string[]): SignalDetail {
  const def = findSignalDef('SIG-S100')!;
  if (!snippets || snippets.length === 0) {
    return { id: def.id, name: 'AI Generation', score: 0, description: 'No text to analyze for AI patterns.' };
  }

  let leakCount = 0;
  for (const snippet of snippets) {
    const lower = snippet.toLowerCase();
    for (const pattern of PROMPT_LEAK_PATTERNS) {
      if (lower.includes(pattern)) {
        leakCount++;
        break;
      }
    }
  }

  if (leakCount > 0) {
    return {
      id: def.id,
      name: 'AI Generation',
      score: 100,
      description: 'Deterministic match for AI prompt leaks (e.g., "As an AI language model"). High confidence bot detection.',
    };
  }

  return { id: def.id, name: 'AI Generation', score: 0, description: 'No obvious AI-generated artifacts detected.' };
}

function analyzeDataQuality(data: ScrapedData): SignalDetail {
  const def = findSignalDef('SIG-S010')!;
  const available = [data.title, data.rating, data.reviewCount, data.ratingCount].filter((v) => v !== null).length;

  if (available === 0) {
    return {
      id: 'SIG-QUALITY-0',
      name: 'Data Quality',
      score: 30,
      description: 'Minimal product data available. Unable to perform comprehensive analysis.',
    };
  }

  return {
    id: 'SIG-QUALITY-1',
    name: 'Data Quality',
    score: 0,
    description: 'Product data available for analysis.',
  };
}

export function analyzeProduct(data: ScrapedData, url: string): AnalysisResult {
  if (data.blocked && !data.title && !data.rating && !data.reviewCount) {
    return {
      verdict: 'UNKNOWN',
      confidence: 0,
      confidenceExplanation: 'Platform access restricted. No meaningful signals could be extracted.',
      reasons: ['Unable to access full review data due to platform restrictions'],
      signals: [],
      evidence: [],
      limitations: ['Site blocked scraping', 'Consider checking reviews manually'],
      nextSteps: ['Try another product listing', 'Check reviews manually on the product page'],
    };
  }

  const category = detectCategory(data.title, url);
  const adjustments = getCategoryAdjustments(category);

  const signals: SignalDetail[] = [
    analyzeRatingSkew(data.rating, data.reviewCount),
    analyzeReviewVolume(data.reviewCount, data.ratingCount),
    analyzeGenericContent(data.reviewSnippets),
    analyzeSnippetDiversity(data.reviewSnippets),
    analyzeKeywordSpam(data.reviewSnippets),
    analyzeTemporalSync(data.timestamps),
    analyzeVerifiedRatio(data.isVerified),
    analyzeAuthorPatterns(data.reviewerNames),
    analyzePromptLeaks(data.reviewSnippets),
    analyzeDataQuality(data),
  ];

  let totalScore = 0;
  for (const signal of signals) {
    const adj = adjustments.find(a => a.signalId === signal.id);
    const weight = adj ? adj.weightModifier : 1.0;
    totalScore += signal.score * weight;
  }
  
  const normalizedScore = Math.min(Math.round(totalScore), 100);

  const reasons: string[] = [];
  const evidence: Evidence[] = [];
  for (const signal of signals) {
    if (signal.score > 0) {
      reasons.push(signal.description);
      if (signal.id === 'SIG-S100') {
        evidence.push({ signalId: signal.id!, snippet: 'As an AI language model...', source: 'Review Text' });
      }
    }
  }

  const limitations: string[] = [];
  if (data.blocked) {
    limitations.push('Site partially blocked scraping. Some data may be incomplete.');
  }
  if (!data.reviewSnippets.length) {
    limitations.push('No detailed review text available for language analysis.');
  }

  let verdict: 'BUY' | 'CAUTION' | 'AVOID' | 'UNKNOWN';
  if (normalizedScore <= 30) {
    verdict = 'BUY';
  } else if (normalizedScore <= 60) {
    verdict = 'CAUTION';
  } else {
    verdict = 'AVOID';
  }

  const confidence = Math.round(Math.max(0, Math.min(100, 100 - (normalizedScore * 0.4) - (limitations.length * 15))));

  return {
    verdict,
    confidence,
    confidenceExplanation: confidence > 80 ? 'High data availability and clear signals.' : confidence > 50 ? 'Moderate data availability with some uncertainty.' : 'Limited data availability suggests caution.',
    reasons: reasons.length > 0 ? reasons : ['No significant suspicious patterns detected'],
    signals,
    evidence,
    limitations: limitations.length > 0 ? limitations : ['None'],
    nextSteps: confidence < 50 ? ['Check reviews manually'] : ['Share this report'],
  };
}
