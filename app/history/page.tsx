'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, TrendingUp, TrendingDown, Minus, ArrowLeft, Search, Brain } from 'lucide-react';

interface HistorySession {
  id: string;
  companyName: string;
  officialName?: string;
  ticker?: string;
  exchange?: string;
  status: string;
  verdict?: 'INVEST' | 'PASS' | 'WATCH';
  confidence?: number;
  durationMs?: number;
  createdAt: string;
}

const VERDICT_CONFIG = {
  INVEST: { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: TrendingUp },
  PASS: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', icon: TrendingDown },
  WATCH: { color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', icon: Minus },
};

export default function HistoryPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<HistorySession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'INVEST' | 'PASS' | 'WATCH'>('all');

  useEffect(() => {
    fetch('/api/history')
      .then((r) => r.json())
      .then((data) => {
        setSessions(data.sessions || []);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  const filtered = sessions.filter((s) =>
    filter === 'all' ? true : s.verdict === filter
  );

  const handleResearch = async (companyName: string) => {
    const res = await fetch('/api/research', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyName }),
    });
    const { sessionId } = await res.json();
    router.push(`/research/${encodeURIComponent(companyName)}?session=${sessionId}`);
  };

  return (
    <main className="min-h-screen grid-bg">
      <header className="flex items-center justify-between px-6 py-5 border-b border-white/05">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
              <Brain className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <span className="font-semibold text-white text-sm">AlphaAgent</span>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Research History</h1>
            <p className="text-zinc-500 text-sm">{sessions.length} companies researched</p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
          >
            <Search className="w-4 h-4" />
            New Research
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {(['all', 'INVEST', 'PASS', 'WATCH'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === f
                  ? 'bg-indigo-600 text-white'
                  : 'border border-white/08 text-zinc-400 hover:border-white/16'
              }`}
            >
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>

        {/* Sessions list */}
        {isLoading ? (
          <div className="space-y-3">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="h-20 shimmer rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Clock className="w-10 h-10 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500">No research history yet</p>
            <button
              onClick={() => router.push('/')}
              className="mt-4 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Start researching →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((session) => {
              const config = session.verdict ? VERDICT_CONFIG[session.verdict] : null;
              const Icon = config?.icon;
              return (
                <div
                  key={session.id}
                  className="glass-card glass-card-hover p-5 cursor-pointer"
                  onClick={() => handleResearch(session.companyName)}
                >
                  <div className="flex items-center gap-4">
                    {config && Icon && (
                      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${config.bg}`}>
                        <Icon className={`w-5 h-5 ${config.color}`} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-sm">
                          {session.officialName || session.companyName}
                        </span>
                        {session.ticker && (
                          <span className="text-xs text-zinc-600">
                            {session.ticker}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-zinc-600 mt-0.5">
                        {new Date(session.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                        {session.durationMs && (
                          <span> · {(session.durationMs / 1000).toFixed(0)}s</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {session.verdict && config && (
                        <div className={`px-3 py-1 rounded-full border text-xs font-bold ${config.bg} ${config.color}`}>
                          {session.verdict}
                          {session.confidence && ` · ${session.confidence}%`}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
