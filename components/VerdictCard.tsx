'use client';

import { ResearchResult } from '@/types/research';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, Clock, Info } from 'lucide-react';

interface VerdictCardProps {
  result: Partial<ResearchResult>;
  isLoading: boolean;
}

const VERDICT_CONFIG = {
  INVEST: {
    emoji: '🟢',
    label: 'INVEST',
    description: 'Strong investment opportunity identified',
    colorClass: 'verdict-invest',
    glowClass: 'glow-invest',
    icon: TrendingUp,
    bgGradient: 'from-emerald-500/10 to-transparent',
    borderColor: 'border-emerald-500/30',
  },
  PASS: {
    emoji: '🔴',
    label: 'PASS',
    description: 'Not recommended at this time',
    colorClass: 'verdict-pass',
    glowClass: 'glow-pass',
    icon: TrendingDown,
    bgGradient: 'from-red-500/10 to-transparent',
    borderColor: 'border-red-500/30',
  },
  WATCH: {
    emoji: '🟡',
    label: 'WATCH',
    description: 'Monitor for better entry conditions',
    colorClass: 'verdict-watch',
    glowClass: 'glow-watch',
    icon: Minus,
    bgGradient: 'from-yellow-500/10 to-transparent',
    borderColor: 'border-yellow-500/30',
  },
};

function ScoreBar({ label, score, max = 10 }: { label: string; score?: number; max?: number }) {
  const pct = score != null ? (score / max) * 100 : 0;
  const color = pct >= 70 ? 'bg-emerald-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-zinc-400">{label}</span>
        <span className="text-white font-medium">{score != null ? `${score.toFixed(1)}/10` : '—'}</span>
      </div>
      <div className="h-1.5 bg-white/08 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function VerdictCard({ result, isLoading }: VerdictCardProps) {
  const verdict = result.verdictResult?.verdict;
  const config = verdict ? VERDICT_CONFIG[verdict] : null;
  const Icon = config?.icon;
  const confidence = result.verdictResult?.confidence ?? 0;
  const report = result.report;

  // Loading state
  if (isLoading && !verdict) {
    return (
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl shimmer" />
          <div className="space-y-2 flex-1">
            <div className="h-6 w-32 shimmer rounded" />
            <div className="h-4 w-48 shimmer rounded" />
          </div>
        </div>
        <div className="h-2 shimmer rounded-full" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-16 shimmer rounded-xl" />
          <div className="h-16 shimmer rounded-xl" />
        </div>
        <div className="h-32 shimmer rounded-xl" />
      </div>
    );
  }

  if (!verdict || !config) {
    return (
      <div className="glass-card p-6 flex items-center justify-center h-48">
        <div className="flex items-center gap-3 text-zinc-500">
          <Clock className="w-5 h-5 animate-pulse" />
          <span>Generating verdict...</span>
        </div>
      </div>
    );
  }

  const catalysts = result.verdictResult?.keyCatalysts || [];
  const dealBreakers = result.verdictResult?.dealBreakers || [];
  const watchTriggers = result.verdictResult?.watchTriggers || [];

  return (
    <div className={`glass-card border ${config.borderColor} ${config.glowClass} overflow-hidden`}>
      {/* Gradient header */}
      <div className={`bg-gradient-to-br ${config.bgGradient} p-6 border-b border-white/05`}>
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl border ${config.borderColor} ${config.colorClass} flex items-center justify-center text-2xl`}>
              {config.emoji}
            </div>
            <div>
              <div className={`text-3xl font-black ${config.colorClass}`}>{config.label}</div>
              <div className="text-zinc-400 text-sm mt-0.5">{config.description}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">{confidence}%</div>
            <div className="text-xs text-zinc-500">Confidence</div>
          </div>
        </div>

        {/* Confidence bar */}
        <div className="space-y-1.5">
          <div className="h-2 bg-white/08 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                verdict === 'INVEST' ? 'bg-emerald-500' : verdict === 'PASS' ? 'bg-red-500' : 'bg-yellow-500'
              }`}
              style={{ width: `${confidence}%` }}
            />
          </div>
        </div>
      </div>

      {/* Scores */}
      {report && (
        <div className="p-6 border-b border-white/05 space-y-3">
          <ScoreBar label="Financial Health" score={report.financialHealthScore} />
          <ScoreBar label="Growth Prospects" score={report.growthProspectsScore} />
          <div className="flex items-center justify-between text-xs mt-2">
            <span className="text-zinc-400">Risk Profile</span>
            <span className={`px-2 py-0.5 rounded-full font-medium text-xs ${
              report.riskProfile === 'Low'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : report.riskProfile === 'Medium'
                ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30'
                : 'bg-red-500/15 text-red-400 border border-red-500/30'
            }`}>
              {report.riskProfile}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400">Valuation</span>
            <span className={`px-2 py-0.5 rounded-full font-medium text-xs ${
              report.valuationAssessment === 'Undervalued'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : report.valuationAssessment === 'Overvalued'
                ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                : 'bg-zinc-500/15 text-zinc-400 border border-zinc-500/30'
            }`}>
              {report.valuationAssessment}
            </span>
          </div>
        </div>
      )}

      {/* Investment thesis */}
      {result.verdictResult?.investmentThesis && (
        <div className="p-6 border-b border-white/05">
          <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" />
            Investment Thesis
          </h3>
          <p className="text-sm text-zinc-300 leading-relaxed">
            {result.verdictResult.investmentThesis}
          </p>
          {result.verdictResult.timeHorizon && (
            <div className="mt-3 text-xs text-zinc-500">
              Time Horizon: <span className="text-zinc-400">{result.verdictResult.timeHorizon}</span>
            </div>
          )}
        </div>
      )}

      {/* Catalysts / Deal Breakers / Watch Triggers */}
      {(catalysts.length > 0 || dealBreakers.length > 0 || watchTriggers.length > 0) && (
        <div className="p-6">
          {catalysts.length > 0 && (
            <div className="mb-4">
              <h3 className="text-xs font-medium text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                Key Catalysts
              </h3>
              <ul className="space-y-2">
                {catalysts.map((c, i) => (
                  <li key={i} className="text-sm text-zinc-400 flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5 shrink-0">→</span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {dealBreakers.length > 0 && (
            <div className="mb-4">
              <h3 className="text-xs font-medium text-red-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Deal Breakers
              </h3>
              <ul className="space-y-2">
                {dealBreakers.map((d, i) => (
                  <li key={i} className="text-sm text-zinc-400 flex items-start gap-2">
                    <span className="text-red-500 mt-0.5 shrink-0">✕</span>
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {watchTriggers.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-yellow-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Watch Triggers
              </h3>
              <ul className="space-y-2">
                {watchTriggers.map((t, i) => (
                  <li key={i} className="text-sm text-zinc-400 flex items-start gap-2">
                    <span className="text-yellow-500 mt-0.5 shrink-0">◦</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
