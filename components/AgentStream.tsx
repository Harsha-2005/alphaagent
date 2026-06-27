'use client';

import { StreamStep } from '@/types/research';
import { CheckCircle, XCircle, Loader2, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface AgentStreamProps {
  steps: StreamStep[];
  isComplete: boolean;
  status?: string;
}

const STEP_ORDER = [
  'queryPlanner',
  'webResearcher',
  'financialFetcher',
  'newsSentiment',
  'synthesizer',
  'verdictEngine',
];

const STEP_LABELS: Record<string, string> = {
  queryPlanner: '🎯 Research Planning',
  webResearcher: '🌐 Web Research',
  financialFetcher: '📊 Financial Data',
  newsSentiment: '📰 News Analysis',
  synthesizer: '🧠 Synthesis',
  verdictEngine: '⚖️ Verdict',
};

function StepItem({ step, isExpanded, onToggle }: {
  step: StreamStep;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const isRunning = step.status === 'running';
  const isDone = step.status === 'done';
  const isError = step.status === 'error';

  return (
    <div className={`rounded-xl border transition-all duration-300 ${
      isRunning
        ? 'border-indigo-500/40 bg-indigo-500/05'
        : isDone
        ? 'border-white/06 bg-white/02'
        : isError
        ? 'border-red-500/30 bg-red-500/05'
        : 'border-white/04 bg-transparent'
    }`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-3 text-left"
      >
        {/* Status icon */}
        <div className="relative shrink-0">
          {isRunning ? (
            <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
          ) : isDone ? (
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          ) : isError ? (
            <XCircle className="w-4 h-4 text-red-400" />
          ) : (
            <Clock className="w-4 h-4 text-zinc-600" />
          )}
        </div>

        {/* Label */}
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-medium ${
            isRunning ? 'text-indigo-300' : isDone ? 'text-white' : isError ? 'text-red-300' : 'text-zinc-600'
          }`}>
            {step.label || STEP_LABELS[step.name] || step.name}
          </div>
          {step.durationMs && isDone && (
            <div className="text-xs text-zinc-600 mt-0.5">
              {(step.durationMs / 1000).toFixed(1)}s
            </div>
          )}
        </div>

        {/* Expand toggle */}
        {step.output && (
          <div className="shrink-0 text-zinc-600">
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
        )}
      </button>

      {/* Output */}
      {isExpanded && step.output && (
        <div className="px-3 pb-3">
          <p className="text-xs text-zinc-500 leading-relaxed border-t border-white/05 pt-2">
            {step.output}
          </p>
        </div>
      )}

      {/* Running shimmer line */}
      {isRunning && (
        <div className="mx-3 mb-3 h-0.5 rounded-full overflow-hidden bg-white/05">
          <div className="h-full bg-indigo-500 rounded-full shimmer" style={{ width: '60%' }} />
        </div>
      )}
    </div>
  );
}

export default function AgentStream({ steps, isComplete, status }: AgentStreamProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  const toggleStep = (id: string) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Deduplicate steps — keep the latest status for each step name
  const stepMap = new Map<string, StreamStep>();
  steps.forEach((step) => {
    const existing = stepMap.get(step.name);
    if (!existing || step.status === 'done' || step.status === 'error') {
      stepMap.set(step.name, step);
    }
  });

  const dedupedSteps = STEP_ORDER
    .map((name) => stepMap.get(name))
    .filter(Boolean) as StreamStep[];

  // Also include any steps not in the canonical order
  steps.forEach((step) => {
    if (!STEP_ORDER.includes(step.name) && !dedupedSteps.find((s) => s.id === step.id)) {
      dedupedSteps.push(step);
    }
  });

  const doneCount = dedupedSteps.filter((s) => s.status === 'done').length;
  const totalExpected = 6;
  const progress = (doneCount / totalExpected) * 100;

  return (
    <div className="glass-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Agent Execution</h2>
        <span className="text-xs text-zinc-500">
          {doneCount}/{totalExpected} steps
        </span>
      </div>

      {/* Overall progress */}
      <div className="h-1 bg-white/08 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
          style={{ width: `${isComplete ? 100 : progress}%` }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {dedupedSteps.length === 0 ? (
          // Show skeleton while waiting for first step
          STEP_ORDER.map((name) => (
            <div key={name} className="rounded-xl border border-white/04 p-3 flex items-center gap-3">
              <Clock className="w-4 h-4 text-zinc-700 shrink-0" />
              <span className="text-sm text-zinc-700">{STEP_LABELS[name]}</span>
            </div>
          ))
        ) : (
          dedupedSteps.map((step) => (
            <StepItem
              key={step.id}
              step={step}
              isExpanded={expandedSteps.has(step.id)}
              onToggle={() => toggleStep(step.id)}
            />
          ))
        )}
      </div>

      {/* Status badge */}
      {isComplete && (
        <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${
          status === 'error'
            ? 'bg-red-500/10 border border-red-500/20 text-red-300'
            : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
        }`}>
          {status === 'error' ? (
            <XCircle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle className="w-4 h-4 shrink-0" />
          )}
          {status === 'error' ? 'Research encountered errors' : 'Research complete!'}
        </div>
      )}
    </div>
  );
}
