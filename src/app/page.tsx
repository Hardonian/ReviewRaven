'use client';

import { useState } from 'react';
import { AnalyzeResponse, ErrorResponse } from '@/lib/types';

function GhostIcon() {
  return (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2C7.58 2 4 5.58 4 10v10.5c0 .83 1.09 1.17 1.57.69l1.83-1.83c.39-.39 1.02-.39 1.41 0l1.83 1.83c.39.39 1.02.39 1.41 0l1.83-1.83c.39-.39 1.02-.39 1.41 0l1.83 1.83c.48.48 1.31.14 1.31-.69V10c0-4.42-3.58-8-8-8z"
        fill="currentColor"
        opacity="0.9"
      />
      <circle cx="9.5" cy="10" r="1.5" fill="#0f172a" />
      <circle cx="14.5" cy="10" r="1.5" fill="#0f172a" />
    </svg>
  );
}

function VerdictBadge({ verdict }: { verdict: string }) {
  const colors: Record<string, string> = {
    BUY: 'bg-buy/10 text-buy border-buy/20',
    CAUTION: 'bg-caution/10 text-caution border-caution/20',
    AVOID: 'bg-avoid/10 text-avoid border-avoid/20',
    UNKNOWN: 'bg-unknown/10 text-unknown border-unknown/20',
  };

  return (
    <span className={`inline-flex items-center px-4 py-2 rounded-full text-xl font-bold border ${colors[verdict] || colors.UNKNOWN}`}>
      {verdict}
    </span>
  );
}

function ConfidenceMeter({ confidence }: { confidence: number }) {
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (confidence / 100) * circumference;

  const color = confidence >= 70 ? 'text-buy' : confidence >= 40 ? 'text-caution' : 'text-avoid';

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-28 h-28">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="6" className="text-ghost-200" />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={color}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-2xl font-bold ${color}`}>{confidence}%</span>
        </div>
      </div>
      <span className="mt-1 text-xs text-ghost-500">confidence</span>
    </div>
  );
}

function SignalRow({ name, score, description }: { name: string; score: number; description: string }) {
  const barColor = score === 0 ? 'bg-buy' : score < 20 ? 'bg-caution/60' : 'bg-avoid';

  return (
    <div className="py-3 border-b border-ghost-100 last:border-b-0">
      <div className="flex items-center justify-between mb-1">
        <span className="font-medium text-sm">{name}</span>
        <span className="text-xs text-ghost-500">{score}/30</span>
      </div>
      <div className="w-full h-1.5 bg-ghost-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor} transition-all duration-300`}
          style={{ width: `${(score / 30) * 100}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-ghost-500">{description}</p>
    </div>
  );
}

type AnalysisState = 'idle' | 'loading' | 'success' | 'error';

export default function Home() {
  const [url, setUrl] = useState('');
  const [state, setState] = useState<AnalysisState>('idle');
  const [result, setResult] = useState<AnalyzeResponse['data'] | null>(null);
  const [error, setError] = useState<ErrorResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setState('loading');
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data as ErrorResponse);
        setState('error');
        return;
      }

      setResult(data as AnalyzeResponse['data']);
      setState('success');
    } catch {
      setError({ ok: false, code: 'NETWORK_ERROR', message: 'Network error. Please try again.', retryable: true });
      setState('error');
    }
  };

  const handleShare = async () => {
    if (!result) return;
    const text = `ReviewGhost verdict for "${result.title || 'this product'}": ${result.result.verdict} (${result.result.confidence}% confidence)`;

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    }
  };

  return (
    <main className="min-h-screen flex flex-col">
      <header className="w-full px-4 py-4 flex items-center justify-between max-w-3xl mx-auto">
        <div className="flex items-center gap-2 text-ghost-700">
          <GhostIcon />
          <span className="font-bold text-lg">ReviewGhost</span>
        </div>
      </header>

      <div className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-xl">
          {state === 'idle' && (
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl font-bold text-ghost-900 mb-3">
                Before you buy it,<br />
                <span className="text-ghost-500">ghost the fake reviews.</span>
              </h1>
              <p className="text-ghost-500 mb-8">
                Paste a product link and get an honest trust verdict.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mb-6">
            <div className="flex gap-2">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste Amazon, Walmart, or Best Buy link"
                className="flex-1 px-4 py-3 rounded-xl border border-ghost-200 bg-white text-ghost-900 placeholder:text-ghost-400 focus:outline-none focus:ring-2 focus:ring-ghost-300 focus:border-transparent text-sm"
                disabled={state === 'loading'}
              />
              <button
                type="submit"
                disabled={state === 'loading' || !url.trim()}
                className="px-6 py-3 rounded-xl bg-ghost-900 text-white font-medium text-sm hover:bg-ghost-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
              >
                {state === 'loading' ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                      <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                    </svg>
                    Analyzing
                  </span>
                ) : (
                  'Analyze'
                )}
              </button>
            </div>
          </form>

          {state === 'error' && error && (
            <div className="p-4 rounded-xl bg-avoid/5 border border-avoid/20 text-avoid">
              <p className="font-medium">{error.message}</p>
            </div>
          )}

          {state === 'success' && result && (
            <div className="space-y-4">
              {result.title && (
                <p className="text-sm text-ghost-500 truncate" title={result.title}>
                  {result.title}
                </p>
              )}

              <div className="p-6 rounded-2xl bg-white border border-ghost-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <VerdictBadge verdict={result.result.verdict} />
                  <ConfidenceMeter confidence={result.result.confidence} />
                </div>

                <div className="space-y-2 mb-6">
                  {result.result.reasons.map((reason, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-ghost-400" viewBox="0 0 20 20" fill="currentColor">
                        <circle cx="10" cy="10" r="4" />
                      </svg>
                      <p className="text-sm text-ghost-600">{reason}</p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-ghost-100 pt-4 mb-4">
                  <h3 className="font-semibold text-sm mb-2">Signals</h3>
                  {result.result.signals.map((signal, i) => (
                    <SignalRow key={i} name={signal.name} score={signal.score} description={signal.description} />
                  ))}
                </div>

                {result.result.limitations.length > 0 && result.result.limitations[0] !== 'None' && (
                  <div className="border-t border-ghost-100 pt-4">
                    <h3 className="font-semibold text-sm mb-2 text-ghost-500">Limitations</h3>
                    {result.result.limitations.map((limitation, i) => (
                      <p key={i} className="text-xs text-ghost-400 mb-1">{limitation}</p>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 mt-6">
                  <button
                    onClick={handleShare}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-ghost-200 text-ghost-600 text-sm font-medium hover:bg-ghost-50 transition-colors"
                  >
                    Copy result
                  </button>
                  <button
                    onClick={() => { setState('idle'); setResult(null); setUrl(''); }}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-ghost-900 text-white text-sm font-medium hover:bg-ghost-800 transition-colors"
                  >
                    Check another
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <footer className="px-4 py-6 text-center text-xs text-ghost-400">
        <p>ReviewGhost analyzes suspicious patterns, not fraud claims.</p>
      </footer>
    </main>
  );
}
