'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, TrendingUp, BarChart2, Globe, Clock, ChevronRight, Zap, Brain, Target } from 'lucide-react';

const EXAMPLE_COMPANIES = [
  'Reliance Industries',
  'Apple Inc',
  'Zomato',
  'Tesla',
  'HDFC Bank',
  'Infosys',
  'Nvidia',
  'Tata Motors',
];

const FEATURES = [
  {
    icon: Globe,
    title: 'Deep Web Research',
    desc: 'Searches across the web to gather business model, competitive position, and analyst insights.',
  },
  {
    icon: BarChart2,
    title: 'Real Financial Data',
    desc: 'Pulls live P/E ratios, revenue, margins, and valuations directly from market feeds.',
  },
  {
    icon: TrendingUp,
    title: 'News Sentiment',
    desc: 'Analyzes 30 days of news with AI to gauge market mood and recent developments.',
  },
  {
    icon: Target,
    title: 'Clear Verdict',
    desc: 'Delivers a definitive INVEST / PASS / WATCH decision with full reasoning.',
  },
];

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Cycle through placeholder companies
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % EXAMPLE_COMPANIES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('recentSearches');
      if (stored) setRecentSearches(JSON.parse(stored).slice(0, 5));
    } catch {}
  }, []);

  const handleSearch = async (companyName?: string) => {
    const searchQuery = (companyName || query).trim();
    if (!searchQuery) return;

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName: searchQuery }),
      });

      if (!res.ok) throw new Error('Failed to start research');
      const { sessionId } = await res.json();

      // Save to recent searches
      try {
        const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
        const updated = [searchQuery, ...recent.filter((s: string) => s !== searchQuery)].slice(0, 10);
        localStorage.setItem('recentSearches', JSON.stringify(updated));
      } catch {}

      router.push(`/research/${encodeURIComponent(searchQuery)}?session=${sessionId}`);
    } catch (err) {
      setError('Failed to start research. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen grid-bg relative overflow-hidden">
      {/* Ambient gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-emerald-600/08 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-5 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
              <Brain className="w-4 h-4 text-indigo-400" />
            </div>
            <span className="font-semibold text-white">AlphaAgent</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/history"
              className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              <Clock className="w-4 h-4" />
              History
            </a>
          </div>
        </header>

        {/* Hero */}
        <section className="max-w-4xl mx-auto px-6 pt-24 pb-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-medium mb-8">
            <Zap className="w-3 h-3" />
            Powered by LangGraph + Gemini 1.5 Pro
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold text-white leading-tight mb-6">
            AI Investment Research,
            <br />
            <span className="gradient-text">Done in Seconds</span>
          </h1>

          <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            Enter any company name. Our AI agent researches it across the web, pulls real financial data,
            analyzes news sentiment, and delivers a clear <strong className="text-white">INVEST / PASS / WATCH</strong> verdict.
          </p>

          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <div className="relative flex items-center glass-card border border-white/10 rounded-2xl overflow-hidden focus-within:border-indigo-500/50 transition-all duration-200 focus-within:shadow-[0_0_0_1px_rgba(99,102,241,0.3)]">
              <Search className="absolute left-5 w-5 h-5 text-zinc-500" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={`Try "${EXAMPLE_COMPANIES[placeholderIndex]}"...`}
                className="w-full pl-14 pr-36 py-5 bg-transparent text-white placeholder:text-zinc-600 text-lg outline-none"
                disabled={isLoading}
              />
              <button
                onClick={() => handleSearch()}
                disabled={isLoading || !query.trim()}
                className="absolute right-3 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm transition-all duration-200 active:scale-95"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                {isLoading ? 'Starting...' : 'Research'}
              </button>
            </div>

            {error && (
              <p className="mt-3 text-red-400 text-sm">{error}</p>
            )}
          </div>

          {/* Quick examples */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {['Reliance Industries', 'Apple Inc', 'Zomato', 'HDFC Bank', 'Nvidia'].map((company) => (
              <button
                key={company}
                onClick={() => handleSearch(company)}
                disabled={isLoading}
                className="px-4 py-2 text-sm text-zinc-400 border border-white/08 rounded-full hover:border-indigo-500/40 hover:text-indigo-300 hover:bg-indigo-500/08 transition-all duration-200 disabled:opacity-40"
              >
                {company}
              </button>
            ))}
          </div>
        </section>

        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <section className="max-w-4xl mx-auto px-6 mb-16">
            <div className="glass-card p-6">
              <h2 className="text-sm font-medium text-zinc-500 mb-4 uppercase tracking-wider">Recent Research</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {recentSearches.map((company) => (
                  <button
                    key={company}
                    onClick={() => handleSearch(company)}
                    disabled={isLoading}
                    className="flex items-center justify-between p-3 rounded-xl border border-white/06 hover:border-white/12 hover:bg-white/03 transition-all group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-zinc-600" />
                      <span className="text-sm text-zinc-300">{company}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Features */}
        <section className="max-w-4xl mx-auto px-6 pb-24">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="glass-card glass-card-hover p-6 cursor-default">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-indigo-400" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center pb-8 text-zinc-600 text-xs">
          Built for InsideIIM × Altuni AI Labs · Powered by LangGraph.js + Gemini 1.5 Pro
        </footer>
      </div>
    </main>
  );
}
