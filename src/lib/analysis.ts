import { ScrapedData, AnalysisResult, SignalDetail } from './types';

const GENERIC_PATTERNS = [
  'great product', 'works great', 'love it', 'highly recommend', 'best purchase',
  'exactly as described', 'fast shipping', 'good value', 'five stars', 'amazing',
  'perfect gift', 'would buy again', 'very happy', 'so glad', 'must buy',
  'quality product', 'great quality', 'worth the price', 'exceeded expectations',
  'just what i needed', 'could not be happier',
];

function analyzeRatingSkew(rating: number | null, reviewCount: number | null): SignalDetail {
  if (!rating || !reviewCount || reviewCount < 5) {
    return { name: 'Rating Distribution', score: 0, description: 'Insufficient data to analyze rating distribution' };
  }

  if (rating >= 4.8) {
    return {
      name: 'Rating Distribution',
      score: 25,
      description: 'Rating is unusually high (' + rating.toFixed(1) + '). Products with near-perfect scores often have inflated reviews.',
    };
  }

  if (rating >= 4.5) {
    return {
      name: 'Rating Distribution',
      score: 10,
      description: 'Rating is high (' + rating.toFixed(1) + '). Slightly above typical authentic patterns.',
    };
  }

  if (rating >= 4.0) {
    return {
      name: 'Rating Distribution',
      score: 0,
      description: 'Rating (' + rating.toFixed(1) + ') falls within typical authentic range.',
    };
  }

  return {
    name: 'Rating Distribution',
    score: 15,
    description: 'Low rating (' + rating.toFixed(1) + ') suggests genuine customer dissatisfaction.',
  };
}

function analyzeReviewVolume(reviewCount: number | null, ratingCount: number | null): SignalDetail {
  const count = reviewCount || ratingCount || 0;

  if (count === 0) {
    return { name: 'Review Volume', score: 20, description: 'No reviews available. Unable to verify product quality.' };
  }

  if (count < 10) {
    return { name: 'Review Volume', score: 15, description: 'Very few reviews (' + count + '). Limited data for trust assessment.' };
  }

  if (count < 50) {
    return { name: 'Review Volume', score: 5, description: 'Moderate review count (' + count + '). Some data available.' };
  }

  return { name: 'Review Volume', score: 0, description: 'Substantial review count (' + count + '). Good data for analysis.' };
}

function analyzeGenericContent(snippets: string[]): SignalDetail {
  if (!snippets || snippets.length === 0) {
    return { name: 'Review Language', score: 0, description: 'No review text available to analyze.' };
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
      name: 'Review Language',
      score: 30,
      description: 'High concentration of generic phrases detected in reviews. This pattern is consistent with inauthentic reviews.',
    };
  }

  if (ratio > 0.3) {
    return {
      name: 'Review Language',
      score: 15,
      description: 'Some generic phrases detected. Mixed authenticity signals.',
    };
  }

  return {
    name: 'Review Language',
    score: 0,
    description: 'Review language appears varied and specific.',
  };
}

function analyzeSnippetDiversity(snippets: string[]): SignalDetail {
  if (!snippets || snippets.length < 3) {
    return { name: 'Review Diversity', score: 0, description: 'Too few reviews to assess diversity.' };
  }

  const words = snippets.map((s) => new Set(s.toLowerCase().split(/\s+/)).size);
  const avgWords = words.reduce((a, b) => a + b, 0) / words.length;

  if (avgWords < 8) {
    return {
      name: 'Review Diversity',
      score: 20,
      description: 'Reviews are unusually short. Low diversity suggests potential manipulation.',
    };
  }

  const uniqueStarts = new Set(snippets.map((s) => s.toLowerCase().substring(0, 20)));
  const uniquenessRatio = uniqueStarts.size / snippets.length;

  if (uniquenessRatio < 0.7) {
    return {
      name: 'Review Diversity',
      score: 25,
      description: 'Low diversity in review openings. Suspicious pattern of similar reviews.',
    };
  }

  return {
    name: 'Review Diversity',
    score: 0,
    description: 'Reviews show good diversity in length and phrasing.',
  };
}

function analyzeKeywordSpam(snippets: string[]): SignalDetail {
  if (!snippets || snippets.length === 0) {
    return { name: 'Keyword Density', score: 0, description: 'No review text to analyze.' };
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
      name: 'Keyword Density',
      score: 25,
      description: 'High concentration of promotional language and excessive emphasis detected.',
    };
  }

  if (ratio > 0.2) {
    return {
      name: 'Keyword Density',
      score: 10,
      description: 'Some promotional language detected. Moderate concern.',
    };
  }

  return {
    name: 'Keyword Density',
    score: 0,
    description: 'Language appears natural without excessive promotional patterns.',
  };
}

function analyzeDataQuality(data: ScrapedData): SignalDetail {
  const available = [data.title, data.rating, data.reviewCount, data.ratingCount].filter((v) => v !== null).length;

  if (available === 0) {
    return {
      name: 'Data Quality',
      score: 30,
      description: 'Minimal product data available. Unable to perform comprehensive analysis.',
    };
  }

  if (available < 3) {
    return {
      name: 'Data Quality',
      score: 15,
      description: 'Limited product data. Analysis based on partial information.',
    };
  }

  return {
    name: 'Data Quality',
    score: 0,
    description: 'Comprehensive product data available for analysis.',
  };
}

export function analyzeProduct(data: ScrapedData, url: string): AnalysisResult {
  if (data.blocked && !data.title && !data.rating && !data.reviewCount) {
    return {
      verdict: 'UNKNOWN',
      confidence: 0,
      reasons: ['Unable to access full review data'],
      signals: [],
      limitations: ['Site blocked scraping', 'Consider checking reviews manually on the product page'],
    };
  }

  const signals: SignalDetail[] = [
    analyzeRatingSkew(data.rating, data.reviewCount),
    analyzeReviewVolume(data.reviewCount, data.ratingCount),
    analyzeGenericContent(data.reviewSnippets),
    analyzeSnippetDiversity(data.reviewSnippets),
    analyzeKeywordSpam(data.reviewSnippets),
    analyzeDataQuality(data),
  ];

  const totalScore = signals.reduce((sum, s) => sum + s.score, 0);
  const normalizedScore = Math.min(totalScore, 100);

  const reasons: string[] = [];
  for (const signal of signals) {
    if (signal.score > 0) {
      reasons.push(signal.description);
    }
  }

  const limitations: string[] = [];
  if (data.blocked) {
    limitations.push('Site partially blocked scraping. Some data may be incomplete.');
  }
  if (!data.reviewSnippets.length) {
    limitations.push('No detailed review text available for language analysis.');
  }
  if (data.reviewSnippets.length < 3) {
    limitations.push('Limited review samples. Analysis confidence is reduced.');
  }

  let verdict: 'BUY' | 'CAUTION' | 'AVOID' | 'UNKNOWN';
  if (normalizedScore <= 30) {
    verdict = 'BUY';
  } else if (normalizedScore <= 60) {
    verdict = 'CAUTION';
  } else {
    verdict = 'AVOID';
  }

  const confidence = Math.round(Math.max(0, Math.min(100, 100 - (normalizedScore * 0.5) - (limitations.length * 10))));

  return {
    verdict,
    confidence,
    reasons: reasons.length > 0 ? reasons : ['No significant suspicious patterns detected'],
    signals,
    limitations: limitations.length > 0 ? limitations : ['None'],
  };
}
