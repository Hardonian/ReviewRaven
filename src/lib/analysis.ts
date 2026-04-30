import { ScrapedData, AnalysisResult, SignalDetail, EvidenceDetail } from './types';
import { reviewSignals } from './intel/signalRegistry';
import { categoryRules } from './intel/categoryRegistry';

function findSignalDef(id: string) {
  return reviewSignals.find(s => s.id === id);
}

function detectSignals(data: ScrapedData): { signals: SignalDetail[], evidence: EvidenceDetail[] } {
  const signals: SignalDetail[] = [];
  const evidence: EvidenceDetail[] = [];

  const addSignal = (id: string, explanation: string, evSnippet?: string, evSource?: string) => {
    const def = findSignalDef(id);
    if (!def) return;
    signals.push({ name: def.name, weight: def.weight, explanation });
    if (evSnippet) {
      evidence.push({ signal: def.name, snippet: evSnippet, source: evSource || 'Review Text' });
    }
  };

  // Temporal Sync / Burst Arrival
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

  // Verified Purchase Deficit
  if (data.isVerified && data.isVerified.length >= 5) {
    const verifiedCount = data.isVerified.filter(v => v).length;
    const ratio = verifiedCount / data.isVerified.length;
    if (ratio < 0.2) {
      addSignal('SIG-S002', `Only ${(ratio*100).toFixed(0)}% of recent reviews are verified purchases.`);
    } else if (ratio > 0.8) {
      addSignal('SIG-G001', `High ratio (${(ratio*100).toFixed(0)}%) of verified purchases.`);
    }
  }

  // Superlative Clumping / Keyword Spam / AI generation
  if (data.reviewSnippets && data.reviewSnippets.length > 0) {
    let superlativeCount = 0;
    const superlatives = ['best', 'perfect', 'amazing', 'incredible', 'flawless'];
    
    for (const snippet of data.reviewSnippets) {
      const lower = snippet.toLowerCase();
      const hasSup = superlatives.some(s => lower.includes(s));
      if (hasSup) superlativeCount++;
      
      // Emotional Extremity
      if ((snippet.match(/!/g) || []).length >= 4 || (snippet.length > 10 && snippet === snippet.toUpperCase())) {
         addSignal('SIG-S024', 'Excessive exclamation marks or ALL CAPS detected.', snippet);
      }
      
      // AI Prompt Leak
      if (lower.includes('as an ai') || lower.includes('write a 5-star') || lower.includes('language model')) {
         addSignal('SIG-S100', 'AI prompt leak detected in review text.', snippet);
      }
    }
    
    if (superlativeCount / data.reviewSnippets.length > 0.5) {
      addSignal('SIG-S003', 'Unusually high density of superlative keywords across reviews.');
    }
    
    // Opening Identity
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

  // Author patterns
  if (data.reviewerNames && data.reviewerNames.length >= 5) {
    let sequentialCount = 0;
    for (let i = 0; i < data.reviewerNames.length - 1; i++) {
      const n1 = data.reviewerNames[i].toLowerCase();
      const n2 = data.reviewerNames[i+1].toLowerCase();
      if (n1.substring(0, 5) === n2.substring(0, 5) && n1 !== n2) {
        sequentialCount++;
      }
    }
    // We add this manually since Author Pattern might not exist with exactly this name in our registry,
    // let's check registry. Wait, registry doesn't have Author Pattern? Let's use SIG-S006 or similar if not found.
    // Or just add it if found.
    const authorDef = reviewSignals.find(s => s.name === 'Author Pattern' || s.name === 'Reviewer_Inactivity');
    if (sequentialCount >= 3 && authorDef) {
       addSignal(authorDef.id, 'Sequential naming patterns detected among reviewers.');
    } else if (sequentialCount >= 3) {
       // fallback if we can't find it
       signals.push({ name: 'Author Pattern', weight: -35, explanation: 'Sequential naming patterns detected among reviewers.' });
    }
  }

  // Missing Data Penalty check
  if (!data.rating || !data.reviewCount) {
    addSignal('SIG-S005', 'Missing rating or review count suggests suppressed or new listing.');
  }

  return { signals, evidence };
}

export function analyzeProduct(data: ScrapedData): AnalysisResult {
  const { signals, evidence } = detectSignals(data);
  let limitations: string[] = [];
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

  let totalRiskScore = 0;
  let signalStrength = 0;
  
  // Adjust weights based on category rules
  const category = data.category || 'unknown';
  const rules = categoryRules.find(c => c.category === category)?.adjustments || [];

  for (const sig of signals) {
    let weight = sig.weight;
    
    // Need to find signal ID by name to apply rule
    const def = reviewSignals.find(s => s.name === sig.name);
    if (def) {
      const rule = rules.find(r => r.signalId === def.id);
      if (rule) {
        weight *= rule.weightModifier;
      }
    }
    
    sig.weight = weight; // apply the adjusted weight
    sig.score = weight;  // backwards compatibility
    
    // SUSPICIOUS are negative in registry. Make them positive risk.
    if (weight < 0) {
      totalRiskScore += Math.abs(weight);
    } else {
      totalRiskScore -= weight; // SAFE reduces risk
    }
    signalStrength += Math.abs(weight);
  }

  totalRiskScore = Math.max(0, Math.min(100, totalRiskScore));

  let verdict: 'BUY' | 'CAUTION' | 'AVOID' | 'UNKNOWN' = 'UNKNOWN';
  if ((data.blocked || data.degraded) && data.reviewSnippets.length === 0) {
    verdict = 'UNKNOWN';
  } else if (signals.some(s => s.name === 'Ultimate_Suspicion')) {
    verdict = 'AVOID';
  } else if (totalRiskScore <= 30) {
    verdict = 'BUY';
  } else if (totalRiskScore <= 60) {
    verdict = 'CAUTION';
  } else {
    verdict = 'AVOID';
  }

  // Confidence Calculation
  let confidence = Math.min(100, signalStrength === 0 ? 0 : signalStrength + 20); // base confidence
  
  // Penalties
  let confidenceExplanation = [];
  if (data.blocked || data.degraded) {
    confidence -= 40;
    confidenceExplanation.push('Heavy penalty applied due to degraded scraping.');
  }
  if (!data.reviewCount || data.reviewCount < 10) {
    confidence -= 20;
    confidenceExplanation.push('Penalty applied due to low review volume.');
  }
  
  // Caps
  if ((data.blocked && data.reviewSnippets.length === 0) || !data.title) {
    confidence = Math.min(confidence, 30);
    confidenceExplanation.push('Confidence capped at 30% due to missing data.');
  } else if (data.reviewSnippets.length < 3) {
    confidence = Math.min(confidence, 60);
    confidenceExplanation.push('Confidence capped at 60% due to partial review data.');
  } else if (signals.length < 2) {
    confidence = Math.min(confidence, 75);
    confidenceExplanation.push('Confidence capped at 75% due to weak evidence.');
  } else if (signals.length >= 3 && signalStrength > 80) {
    confidence = Math.min(Math.max(confidence, 80), 95);
    confidenceExplanation.push('Strong multi-signal evidence found.');
  }

  confidence = Math.max(0, Math.round(confidence));

  const reasons = signals
    .sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight))
    .slice(0, 3)
    .map(s => s.explanation);

  if (reasons.length === 0) {
    reasons.push('Insufficient data to form specific conclusions.');
  }

  return {
    verdict,
    confidence,
    confidenceExplanation: confidenceExplanation.join(' ') || 'Analysis complete.',
    reasons,
    signals,
    evidence,
    limitations,
    nextSteps: nextSteps.length > 0 ? nextSteps : undefined,
    degraded: data.degraded
  };
}
