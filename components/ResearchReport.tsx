'use client';

import { StructuredReport } from '@/types/research';
import { Shield, Zap, Users, Briefcase, BookOpen } from 'lucide-react';

interface ResearchReportProps {
  report: StructuredReport;
}

function Section({ icon: Icon, title, children }: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-white/05 pt-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-indigo-400" />
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function BulletList({ items, color = 'indigo' }: { items: string[]; color?: string }) {
  const dotColor = {
    indigo: 'bg-indigo-500',
    emerald: 'bg-emerald-500',
    red: 'bg-red-500',
  }[color] || 'bg-indigo-500';

  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5">
          <span className={`w-1.5 h-1.5 rounded-full ${dotColor} shrink-0 mt-1.5`} />
          <span className="text-sm text-zinc-400 leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function ResearchReport({ report }: ResearchReportProps) {
  return (
    <div className="glass-card p-6 space-y-5">
      <div className="flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-indigo-400" />
        <h2 className="text-sm font-semibold text-white">Research Report</h2>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-zinc-600">{report.sector}</span>
          {report.industry && (
            <>
              <span className="text-zinc-700">·</span>
              <span className="text-xs text-zinc-600">{report.industry}</span>
            </>
          )}
        </div>
      </div>

      {/* Executive Summary */}
      <div className="p-4 rounded-xl bg-indigo-500/08 border border-indigo-500/20">
        <p className="text-sm text-zinc-300 leading-relaxed">{report.executiveSummary}</p>
      </div>

      {/* Business Model */}
      <Section icon={Briefcase} title="Business Model">
        <p className="text-sm text-zinc-400 leading-relaxed">{report.businessModel}</p>
      </Section>

      {/* Competitive Moat */}
      <Section icon={Shield} title="Competitive Moat">
        <p className="text-sm text-zinc-400 leading-relaxed">{report.moatAssessment}</p>
      </Section>

      {/* Key Strengths */}
      {report.keyStrengths?.length > 0 && (
        <Section icon={Zap} title="Key Strengths">
          <BulletList items={report.keyStrengths} color="emerald" />
        </Section>
      )}

      {/* Key Risks */}
      {report.keyRisks?.length > 0 && (
        <Section icon={Shield} title="Key Risks">
          <BulletList items={report.keyRisks} color="red" />
        </Section>
      )}

      {/* Competitors */}
      {report.competitors?.length > 0 && (
        <Section icon={Users} title="Key Competitors">
          <div className="flex flex-wrap gap-2">
            {report.competitors.map((c, i) => (
              <span
                key={i}
                className="text-xs px-3 py-1.5 rounded-full border border-white/08 text-zinc-400"
              >
                {c}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Recent Developments */}
      {report.recentDevelopments?.length > 0 && (
        <Section icon={Zap} title="Recent Developments">
          <BulletList items={report.recentDevelopments} />
        </Section>
      )}

      {/* Analyst Consensus */}
      {report.analystConsensus && (
        <Section icon={BookOpen} title="Analyst Consensus">
          <p className="text-sm text-zinc-400 leading-relaxed">{report.analystConsensus}</p>
        </Section>
      )}
    </div>
  );
}
