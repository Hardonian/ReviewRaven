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

interface InternalSignalResult {
  signal: SignalDetail;
  evidence: Evidence[];
}

function analyzeRatingSkew(rating: number | null, reviewCount: number | null): InternalSignalResult {
  const def = findSignalDef('SIG-S009')!;
  if (!rating || !reviewCount || reviewCount < 5) {
    return { 
      signal: { id: def.id, name: def.name, score: 0, description: 'Insufficient data to analyze rating distribution' },
      evidence: []
    };
  }

  if (rating >= 4.8) {
    return {
      signal: {
        id: def.id,
        name: def.name,
        score: 25,
        description: 'Rating is unusually high (' + rating.toFixed(1) + '). Products with near-perfect scores often have inflated reviews.',
      },
      evidence: [{ signalId: def.id, snippet: `Overall rating: ${rating.toFixed(1)}`, source: 'Metadata' }]
    };
  }

  if (rating >= 4.5) {
    return {
      signal: {
        id: def.id,
        name: def.name,
        score: 10,
        description: 'Rating is high (' + rating.toFixed(1) + '). Slightly above typical authentic patterns.',
      },
      evidence: []
    };
  }

  return {
    signal: {
      id: def.id,
      name: def.name,
      score: 0,
      description: 'Rating (' + rating.toFixed(1) + ') falls within typical authentic range.',
    },
    evidence: []
  };
}

function analyzeReviewVolume(reviewCount: number | null, ratingCount: number | null): InternalSignalResult {
  const def = findSignalDef('SIG-S010')!;
  const count = reviewCount || ratingCount || 0;

  if (count === 0) {
    return { 
      signal: { id: def.id, name: def.name, score: 20, description: 'No reviews available. Unable to verify product quality.' },
      evidence: []
    };
  }

  if (count < 10) {
    return { 
      signal: { id: def.id, name: def.name, score: 15, description: 'Very few reviews (' + count + '). Limited data for trust assessment.' },
      evidence: []
    };
  }

  return { 
    signal: { id: def.id, name: def.name, score: 0, description: 'Substantial review count (' + count + '). Good data for analysis.' },
    evidence: []
  };
}

function analyzeGenericContent(snippets: string[]): InternalSignalResult {
  const def = findSignalDef('SIG-S003')!;
  if (!snippets || snippets.length === 0) {
    return { 
      signal: { id: def.id, name: def.name, score: 0, description: 'No review text available to analyze.' },
      evidence: []
    };
  }

  const evidence: Evidence[] = [];
  let genericCount = 0;
  for (const snippet of snippets) {
    const lower = snippet.toLowerCase();
    let found = false;
    for (const pattern of GENERIC_PATTERNS) {
      if (lower.includes(pattern)) {
        genericCount++;
        if (evidence.length < 3) {
          evidence.push({ signalId: def.id, snippet, source: 'Review Text' });
        }
        found = true;
        break;
      }
    }
  }

  const ratio = genericCount / snippets.length;

  if (ratio > 0.6) {
    return {
      signal: {
        id: def.id,
        name: def.name,
        score: 30,
        description: 'High concentration of generic phrases detected. Consistent with inauthentic review generation.',
      },
      evidence
    };
  }

  if (ratio > 0.3) {
    return {
      signal: {
        id: def.id,
        name: def.name,
        score: 15,
        description: 'Some generic phrases detected. Mixed authenticity signals.',
      },
      evidence: evidence.slice(0, 1)
    };
  }

  return {
    signal: {
      id: def.id,
      name: def.name,
      score: 0,
      description: 'Review language appears varied and specific.',
    },
    evidence: []
  };
}

function analyzeSnippetDiversity(snippets: string[]): InternalSignalResult {
  const def = findSignalDef('SIG-S006')!;
  if (!snippets || snippets.length < 3) {
    return { 
      signal: { id: def.id, name: def.name, score: 0, description: 'Too few reviews to assess diversity.' },
      evidence: []
    };
  }

  const uniqueStarts = new Map<string, string>();
  let duplicateSnippet = '';
  
  for (const s of snippets) {
    const start = s.toLowerCase().substring(0, 25);
    if (uniqueStarts.has(start)) {
      duplicateSnippet = s;
    }
    uniqueStarts.set(start, s);
  }

  const uniquenessRatio = uniqueStarts.size / snippets.length;

  if (uniquenessRatio < 0.7) {
    return {
      signal: {
        id: def.id,
        name: def.name,
        score: 25,
        description: 'Low diversity in review openings. Suspicious pattern of templated reviews.',
      },
      evidence: duplicateSnippet ? [{ signalId: def.id, snippet: duplicateSnippet, source: 'Review Text' }] : []
    };
  }

  return {
    signal: {
      id: def.id,
      name: def.name,
      score: 0,
      description: 'Reviews show good diversity in length and phrasing.',
    },
    evidence: []
  };
}

function analyzeKeywordSpam(snippets: string[]): InternalSignalResult {
  const def = findSignalDef('SIG-S024')!;
  if (!snippets || snippets.length === 0) {
    return { 
      signal: { id: def.id, name: def.name, score: 0, description: 'No review text to analyze.' },
      evidence: []
    };
  }

  const evidence: Evidence[] = [];
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
    if (matches > 0) {
      spamCount++;
      if (evidence.length < 2) {
        evidence.push({ signalId: def.id, snippet, source: 'Review Text' });
      }
    }
  }

  const ratio = spamCount / snippets.length;

  if (ratio > 0.4) {
    return {
      signal: {
        id: def.id,
        name: def.name,
        score: 25,
        description: 'High concentration of promotional language and excessive emphasis detected.',
      },
      evidence
    };
  }

  return {
    signal: {
      id: def.id,
      name: def.name,
      score: 0,
      description: 'Language appears natural without excessive promotional patterns.',
    },
    evidence: []
  };
}

function analyzeTemporalSync(timestamps: string[]): InternalSignalResult {
  const def = findSignalDef('SIG-S022')!;
  if (!timestamps || timestamps.length < 5) {
    return { 
      signal: { id: def.id, name: 'Temporal Synchronization', score: 0, description: 'Insufficient temporal data' },
      evidence: []
    };
  }

  const counts: Record<string, number> = {};
  for (const ts of timestamps) {
    counts[ts] = (counts[ts] || 0) + 1;
  }

  const maxSync = Math.max(...Object.values(counts));
  const syncTimestamp = Object.keys(counts).find(k => counts[k] === maxSync);

  if (maxSync >= 5) {
    return {
      signal: {
        id: def.id,
        name: 'Temporal Synchronization',
        score: 45,
        description: 'Multiple reviews posted simultaneously. Suggests a coordinated synthetic burst.',
      },
      evidence: [{ signalId: def.id, snippet: `${maxSync} reviews posted on ${syncTimestamp}`, source: 'Timestamp' }]
    };
  }

  return { 
    signal: { id: def.id, name: 'Temporal Synchronization', score: 0, description: 'Reviews are naturally distributed over time.' },
    evidence: []
  };
}

function analyzeVerifiedRatio(isVerified: boolean[]): InternalSignalResult {
  const def = findSignalDef('SIG-S002')!;
  if (!isVerified || isVerified.length < 5) {
    return { 
      signal: { id: def.id, name: 'Verified Purchases', score: 0, description: 'Insufficient verification data' },
      evidence: []
    };
  }

  const verifiedCount = isVerified.filter(v => v).length;
  const ratio = verifiedCount / isVerified.length;

  if (ratio <= 0.2) {
    return {
      signal: {
        id: def.id,
        name: 'Verified Purchases',
        score: 40,
        description: 'Low ratio of verified purchases (' + (ratio * 100).toFixed(0) + '%). High risk of incentivized bias.',
      },
      evidence: [{ signalId: def.id, snippet: `${(ratio * 100).toFixed(0)}% verified purchase ratio`, source: 'Metadata' }]
    };
  }

  return { 
    signal: { id: def.id, name: 'Verified Purchases', score: 0, description: 'Healthy ratio of verified purchases detected.' },
    evidence: []
  };
}

function analyzeAuthorPatterns(names: string[]): InternalSignalResult {
  const def = findSignalDef('SIG-S008')!;
  if (!names || names.length < 5) {
    return { 
      signal: { id: def.id, name: 'Author Pattern', score: 0, description: 'Insufficient author data' },
      evidence: []
    };
  }

  let sequentialCount = 0;
  let sampleName = '';
  for (let i = 0; i < names.length - 1; i++) {
    const n1 = names[i].toLowerCase();
    const n2 = names[i+1].toLowerCase();
    if (n1.substring(0, 5) === n2.substring(0, 5) && n1 !== n2) {
      sequentialCount++;
      sampleName = names[i];
    }
  }

  if (sequentialCount >= 3) {
    return {
      signal: {
        id: def.id,
        name: 'Author Pattern',
        score: 35,
        description: 'Sequential naming patterns detected among reviewers. Highly characteristic of bot farms.',
      },
      evidence: [{ signalId: def.id, snippet: `Sequential pattern found (e.g., "${sampleName}")`, source: 'Usernames' }]
    };
  }

  return { 
    signal: { id: def.id, name: 'Author Pattern', score: 0, description: 'Reviewer identities appear organic.' },
    evidence: []
  };
}

function analyzePromptLeaks(snippets: string[]): InternalSignalResult {
  const def = findSignalDef('SIG-S100')!;
  if (!snippets || snippets.length === 0) {
    return { 
      signal: { id: def.id, name: 'AI Generation', score: 0, description: 'No text to analyze for AI patterns.' },
      evidence: []
    };
  }

  const evidence: Evidence[] = [];
  for (const snippet of snippets) {
    const lower = snippet.toLowerCase();
    for (const pattern of PROMPT_LEAK_PATTERNS) {
      if (lower.includes(pattern)) {
        evidence.push({ signalId: def.id, snippet, source: 'Review Text' });
        break;
      }
    }
  }

  if (evidence.length > 0) {
    return {
      signal: {
        id: def.id,
        name: 'AI Generation',
        score: 100,
        description: 'Deterministic match for AI prompt leaks (e.g., "As an AI language model"). High confidence bot detection.',
      },
      evidence
    };
  }

  return { 
    signal: { id: def.id, name: 'AI Generation', score: 0, description: 'No obvious AI-generated artifacts detected.' },
    evidence: []
  };
}

function analyzeDataQuality(data: ScrapedData): InternalSignalResult {
  const def = findSignalDef('SIG-S099')!;
  const available = [data.title, data.rating, data.reviewCount, data.ratingCount].filter((v) => v !== null).length;

  if (available < 2) {
    return {
      signal: {
        id: def.id,
        name: def.name,
        score: 30,
        description: 'Minimal product data available. Unable to perform comprehensive analysis.',
      },
      evidence: [{ signalId: def.id, snippet: `Only ${available} data points available`, source: 'System' }]
    };
  }

  return {
    signal: {
      id: def.id,
      name: def.name,
      score: 0,
      description: 'Product data available for analysis.',
    },
    evidence: []
  };
}

function findSignalDef(id: string) {
  return reviewSignals.find(s => s.id === id);
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

  const rawResults: InternalSignalResult[] = [
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

  const signals: SignalDetail[] = [];
  const evidence: Evidence[] = [];
  let totalScore = 0;

  for (const res of rawResults) {
    const { signal, evidence: signalEvidence } = res;
    
    // Apply category weights
    const adj = adjustments.find(a => a.signalId === signal.id);
    const weight = adj ? adj.weightModifier : 1.0;
    
    // Create weighted signal for the report
    const weightedSignal = { ...signal, score: Math.round(signal.score * weight) };
    signals.push(weightedSignal);
    
    if (signal.score > 0) {
      totalScore += signal.score * weight;
      if (signalEvidence) {
        evidence.push(...signalEvidence);
      }
    }
  }
  
  const normalizedScore = Math.min(Math.round(totalScore), 100);

  const reasons = signals
    .filter(s => s.score > 10) // Only list significant risks in reasons
    .map(s => s.description);

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

  const confidence = Math.round(Math.max(0, Math.min(100, 100 - (normalizedScore * 0.3) - (limitations.length * 15))));

  const confidenceExplanation = confidence > 85 
    ? 'High transparency. Abundant data points confirm our assessment.' 
    : confidence > 60 
      ? 'Moderate reliability. Most signals are clear, but some data is missing or ambiguous.' 
      : 'Low reliability. Limited data availability or conflicting signals present high uncertainty.';

  return {
    verdict,
    confidence,
    confidenceExplanation,
    reasons: reasons.length > 0 ? reasons : ['No significant suspicious patterns detected'],
    signals,
    evidence: evidence
      .sort((a, b) => {
        const scoreA = signals.find(s => s.id === a.signalId)?.score || 0;
        const scoreB = signals.find(s => s.id === b.signalId)?.score || 0;
        return scoreB - scoreA;
      })
      .slice(0, 10), // Limit to top 10 pieces of evidence
    limitations: limitations.length > 0 ? limitations : ['None'],
    nextSteps: confidence < 50 ? ['Check reviews manually on-site'] : ['Share this report with others'],
  };
}
