'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ResearchResult, StreamStep } from '@/types/research';
import VerdictCard from '@/components/VerdictCard';
import AgentStream from '@/components/AgentStream';
import FinancialMetrics from '@/components/FinancialMetrics';
import NewsSentiment from '@/components/NewsSentiment';
import ResearchReport from '@/components/ResearchReport';
import StockChart from '@/components/StockChart';
import { Brain, ArrowLeft, Share2 } from 'lucide-react';

interface ResearchPageProps {
  params: Promise<{ company: string }>;
}

export default function ResearchPage({ params }: ResearchPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');
  const { company } = use(params);
  const companyName = decodeURIComponent(company);

  const [result, setResult] = useState<Partial<ResearchResult>>({
    companyName,
    status: 'running',
    steps: [],
  });
  const [steps, setSteps] = useState<StreamStep[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!sessionId) {
      router.push('/');
      return;
    }

    // Connect to SSE stream
    const es = new EventSource(`/api/research?sessionId=${sessionId}`);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === 'step') {
          setSteps((prev) => {
            // Merge step updates (status changes)
            const existing = prev.findIndex((s) => s.id === msg.data.id);
            if (existing >= 0) {
              const updated = [...prev];
              updated[existing] = msg.data;
              return updated;
            }
            return [...prev, msg.data];
          });
        } else if (msg.type === 'complete') {
          setResult(msg.data);
          setSteps(msg.data.steps || []);
          setIsComplete(true);
          es.close();
        }
      } catch {}
    };

    es.onerror = () => {
      // Try to fetch result directly
      fetch(`/api/research?sessionId=${sessionId}&result=true`)
        .then((r) => r.json())
        .then((data) => {
          if (data && data.status) {
            setResult(data);
            setSteps(data.steps || []);
            if (data.status === 'done' || data.status === 'error') {
              setIsComplete(true);
            }
          }
        })
        .catch(() => {});
    };

    return () => {
      es.close();
    };
  }, [sessionId, router]);

  const verdict = result.verdictResult?.verdict;
  const verdictClass = verdict === 'INVEST' ? 'invest' : verdict === 'PASS' ? 'pass' : 'watch';

  return (
    <main className="min-h-screen grid-bg">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 border-b border-white/05 bg-[rgba(9,9,11,0.9)] backdrop-blur-xl">
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
        <div className="flex items-center gap-3">
          {isComplete && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
              }}
              className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
          )}
          <div className={`px-3 py-1 rounded-full text-xs font-medium border ${
            result.status === 'running'
              ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300'
              : result.status === 'done'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              : 'border-red-500/30 bg-red-500/10 text-red-300'
          }`}>
            {result.status === 'running' ? '⚡ Researching...' : result.status === 'done' ? '✓ Complete' : '⚠ Error'}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Company title */}
        <div className="mb-8">
          <p className="text-zinc-500 text-sm mb-1">Research Report</p>
          <h1 className="text-3xl font-bold text-white">
            {result.officialName || companyName}
            {result.ticker && (
              <span className="ml-3 text-lg font-normal text-zinc-500">
                {result.ticker}
                {result.exchange && `:${result.exchange}`}
              </span>
            )}
          </h1>
        </div>

        {/* 3-column layout */}
        <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr_340px] gap-6">
          {/* Left: Agent Stream */}
          <aside className="space-y-4">
            <AgentStream steps={steps} isComplete={isComplete} status={result.status} />
          </aside>

          {/* Center: Verdict + Report */}
          <div className="space-y-6">
            <VerdictCard
              result={result as ResearchResult}
              isLoading={!isComplete}
            />
            {isComplete && result.report && (
              <ResearchReport report={result.report} />
            )}
          </div>

          {/* Right: Financials + News */}
          <aside className="space-y-4">
            <FinancialMetrics
              data={result.financialData}
              revenueHistory={result.financialData?.revenueHistory}
              isLoading={!result.financialData}
            />
            <NewsSentiment
              newsItems={result.newsItems}
              sentiment={result.sentiment}
              isLoading={!isComplete && !result.newsItems?.length}
            />
          </aside>
        </div>

        {/* Full-width: Graphical Analysis */}
        {isComplete && (
          <div className="mt-6">
            <StockChart
              companyName={result.officialName || companyName}
              ticker={result.ticker}
              financialData={result.financialData}
              verdict={result.verdictResult?.verdict}
              confidence={result.verdictResult?.confidence}
            />
          </div>
        )}
      </div>
    </main>
  );
}
