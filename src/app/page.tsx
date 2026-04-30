'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ErrorEnvelope } from '@reviewraven/shared-core';

interface RavenAnalyzeResponse {
  schemaVersion: string;
  ok: true;
  resultId: string;
  verdict: 'BUY' | 'CAUTION' | 'AVOID' | 'UNKNOWN';
  confidence: number;
  confidenceExplanation: string;
  reasons: string[];
  signals: Array<{ id: string; name: string; type: string; weight: number; explanation: string }>;
  evidence: Array<{ signalId: string; signal: string; snippet: string; source: string }>;
  limitations: string[];
  nextSteps?: string[];
  degraded: boolean;
  diagnosticsId: string;
  title?: string | null;
  url?: string;
}

function RavenIcon() {
  return (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C14.4853 3 16.7353 4.00736 18.364 5.63604L12 12L21 12Z"
        fill="currentColor"
      />
      <circle cx="10" cy="10" r="1.5" fill="#f8fafc" />
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
          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="6" className="text-raven-200" />
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
      <span className="mt-1 text-xs text-raven-500">confidence</span>
    </div>
  );
}

function SignalRow({ name, score, description }: { name: string; score: number; description: string }) {
  const absScore = Math.abs(score);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (barRef.current) {
      const width = Math.min(100, (absScore / 50) * 100);
      const color = score < 0 ? 'var(--color-buy)' : absScore < 20 ? 'var(--color-caution)' : 'var(--color-avoid)';
      barRef.current.style.width = `${width}%`;
      barRef.current.style.backgroundColor = color;
    }
  }, [absScore, score]);

  return (
    <div className="py-3 border-b border-raven-100 last:border-b-0">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm font-bold text-raven-900">{name}</span>
        <span className="text-xs text-raven-500">{absScore}</span>
      </div>
      <div className="w-full h-1.5 bg-raven-100 rounded-full overflow-hidden">
        <div
          ref={barRef}
          className="h-full transition-all duration-1000 ease-out"
        />
      </div>
      <p className="mt-1 text-xs text-raven-500">{description}</p>
    </div>
  );
}

type AnalysisState = 'idle' | 'loading' | 'success' | 'error';

export default function Home() {
  const [url, setUrl] = useState('');
  const [state, setState] = useState<AnalysisState>('idle');
  const [result, setResult] = useState<RavenAnalyzeResponse | null>(null);
  const [error, setError] = useState<ErrorEnvelope | null>(null);

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
        setError(data as ErrorEnvelope);
        setState('error');
        return;
      }

      setResult({ ...data, title: data.title, url: data.url } as RavenAnalyzeResponse);
      setState('success');
    } catch {
      setError({ schemaVersion: '1.0.0', ok: false, code: 'NETWORK_ERROR', message: 'Network error. Please try again.', retryable: true });
      setState('error');
    }
  };

  const handleShare = async () => {
    if (!result) return;
    const title = result.title || 'this product';
    const text = `ReviewRaven verdict for "${title}": ${result.verdict} (${result.confidence}% confidence)`;

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    }
  };

  return (
    <main className="min-h-screen flex flex-col">
      <header className="w-full px-4 py-4 flex items-center justify-between max-w-3xl mx-auto">
        <div className="flex items-center gap-2 text-raven-700">
          <RavenIcon />
          <span className="font-bold text-lg">ReviewRaven</span>
        </div>
      </header>

      <div className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-xl">
          {state === 'idle' && (
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl font-bold text-raven-900 mb-3">
                Watch the patterns, <br />
                <span className="text-raven-500">detect the deception.</span>
              </h1>
              <p className="text-raven-500 mb-8">
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
                className="flex-1 px-4 py-3 rounded-xl border border-raven-200 bg-white text-raven-900 placeholder:text-raven-400 focus:outline-none focus:ring-2 focus:ring-raven-300 focus:border-transparent text-sm"
                disabled={state === 'loading'}
                required
              />
              <button
                type="submit"
                disabled={state === 'loading' || !url.trim()}
                className="px-6 py-3 rounded-xl bg-raven-900 text-white font-medium text-sm hover:bg-raven-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
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
            <div className="space-y-4 animate-fade-in-up">
              {result.title && (
                <p className="text-sm text-raven-500 font-medium px-2 truncate" title={result.title}>
                  {result.title}
                </p>
              )}

              <div className="p-8 rounded-3xl glass-card">
                <div className="flex items-center justify-between mb-6">
                  <VerdictBadge verdict={result.verdict} />
                  <ConfidenceMeter confidence={result.confidence} />
                </div>

                <div className="mb-8 p-4 rounded-2xl bg-raven-900/5 border border-raven-900/10 backdrop-blur-md">
                  <p className="text-xs text-raven-600 italic font-medium leading-relaxed">
                    &ldquo;{result.confidenceExplanation}&rdquo;
                  </p>
                </div>

                <div className="space-y-3 mb-8">
                  {result.reasons.map((reason: string, i: number) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-raven-400 shrink-0" />
                      <p className="text-sm text-raven-700 font-medium">{reason}</p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-raven-900/5 pt-6 mb-6">
                  <h2 className="font-bold text-xs uppercase tracking-widest text-raven-400 mb-4">Risk Signals</h2>
                  <div className="space-y-1">
                    {result.signals && result.signals.map((signal, i: number) => (
                      <SignalRow key={i} name={signal.name} score={signal.weight} description={signal.explanation} />
                    ))}
                  </div>
                </div>

                {result.evidence && result.evidence.length > 0 && (
                  <div className="border-t border-raven-900/5 pt-6 mb-6">
                    <h2 className="font-bold text-xs uppercase tracking-widest text-avoid mb-4">Evidence Snippets</h2>
                    <div className="space-y-4">
                      {result.evidence.map((ev, i: number) => (
                        <div key={i} className="p-4 rounded-2xl bg-avoid/5 border-l-4 border-avoid shadow-sm transition-transform hover:scale-[1.01]">
                          <p className="text-xs text-raven-800 italic leading-relaxed">&ldquo;{ev.snippet}&rdquo;</p>
                          <div className="mt-1.5 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-raven-400 uppercase">{ev.source}</span>
                            <span className="text-[10px] font-black uppercase tracking-tighter text-avoid/70">{ev.signalId}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {((result.limitations?.length ?? 0) > 0 || (result.nextSteps?.length ?? 0) > 0) && (
                  <div className="border-t border-raven-900/5 pt-6 mb-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h2 className="font-bold text-xs uppercase tracking-widest text-raven-400 mb-2">Limitations</h2>
                        <ul className="text-xs text-raven-500 list-disc list-inside pl-4">
                          {result.limitations?.map((l: string, i: number) => <li key={i}>{l}</li>)}
                        </ul>
                      </div>
                      <div>
                        <h2 className="font-bold text-xs uppercase tracking-widest text-raven-400 mb-2">Next Steps</h2>
                        <ul className="text-xs text-raven-500 list-disc list-inside pl-4">
                          {result.nextSteps?.map((step: string, i: number) => <li key={i}>{step}</li>)}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 mt-8">
                  <button
                    onClick={handleShare}
                    className="px-4 py-3 rounded-xl border border-raven-200 text-raven-700 text-sm font-bold hover:bg-white transition-all shadow-sm active:scale-95"
                  >
                    Copy Report
                  </button>
                  <button
                    onClick={() => {
                      const text = encodeURIComponent(`ReviewRaven Verdict: ${result.verdict} (${result.confidence}% Confidence)\n\nTrust analysis for: ${result.title || 'this product'}\n\n#ReviewRaven #ConsumerSafety`);
                      window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
                    }}
                    className="px-4 py-3 rounded-xl bg-[#1DA1F2] text-white text-sm font-bold hover:opacity-90 transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.84 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                    </svg>
                    Post to X
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="col-span-2 px-4 py-4 rounded-xl bg-raven-900 text-white text-sm font-black uppercase tracking-widest hover:bg-raven-800 transition-all shadow-lg active:scale-95"
                  >
                    Analyze New Product
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <footer className="px-4 py-6 text-center text-xs text-raven-400">
        <p>ReviewRaven analyzes suspicious patterns, not fraud claims.</p>
      </footer>
    </main>
  );
}
