// Node 6: Verdict Engine
// Makes the final INVEST / PASS / WATCH decision with full reasoning

import { ResearchState } from '../state';
import { callLLM, extractJSON } from '../llm';
import { StreamStep, VerdictResult, Verdict } from '@/types/research';
import { v4 as uuidv4 } from 'uuid';

const VERDICT_PROMPT = (
  companyName: string,
  officialName: string,
  report: string,
  financialHighlights: string,
  sentiment: string
) => `
You are the Chief Investment Officer at a top-tier investment fund. Based on the comprehensive research below, make a definitive investment decision.

## Company: ${officialName || companyName}

## Research Report
${report}

## Key Financial Highlights  
${financialHighlights}

## Market Sentiment
${sentiment}

## Scoring Rubric
INVEST: Strong fundamentals + reasonable valuation + positive catalysts + manageable risks
WATCH: Mixed signals, wait for better entry or catalyst confirmation  
PASS: Weak fundamentals OR excessive valuation OR critical unresolvable risks

Return ONLY valid JSON:
{
  "verdict": "INVEST",
  "confidence": 78,
  "investmentThesis": "2-3 paragraph comprehensive investment thesis explaining your reasoning. Be specific and data-driven.",
  "keyCatalysts": [
    "Specific catalyst 1 that could drive value",
    "Specific catalyst 2",
    "Specific catalyst 3"
  ],
  "dealBreakers": [],
  "watchTriggers": [],
  "timeHorizon": "12-18 months",
  "recommendedAllocation": "3-5% of portfolio"
}

Rules:
- verdict must be exactly: "INVEST", "PASS", or "WATCH"
- confidence: 0-100 integer
- For INVEST: populate keyCatalysts, leave dealBreakers and watchTriggers empty
- For PASS: populate dealBreakers, leave keyCatalysts and watchTriggers empty  
- For WATCH: populate watchTriggers (conditions that would trigger INVEST), leave others empty
- Be honest and critical — not every company deserves INVEST
- investmentThesis must be at least 150 words and cite specific data points
`;

function formatReportForPrompt(report: ResearchState['report']): string {
  if (!report) return 'No report available.';
  return `
Executive Summary: ${report.executiveSummary}
Business Model: ${report.businessModel}
Sector: ${report.sector} | Industry: ${report.industry}
Competitors: ${report.competitors?.join(', ') || 'N/A'}
Financial Health Score: ${report.financialHealthScore}/10
Growth Prospects Score: ${report.growthProspectsScore}/10
Risk Profile: ${report.riskProfile}
Valuation: ${report.valuationAssessment}
Moat: ${report.moatAssessment}
Analyst Consensus: ${report.analystConsensus}
Key Strengths: ${report.keyStrengths?.map((s) => `\n  • ${s}`).join('') || 'N/A'}
Key Risks: ${report.keyRisks?.map((r) => `\n  • ${r}`).join('') || 'N/A'}
Recent Developments: ${report.recentDevelopments?.map((d) => `\n  • ${d}`).join('') || 'N/A'}
  `.trim();
}

export async function verdictEngineNode(state: ResearchState): Promise<Partial<ResearchState>> {
  const stepId = uuidv4();
  const startTime = Date.now();

  const startStep: StreamStep = {
    id: stepId,
    name: 'verdictEngine',
    label: '⚖️ Rendering Investment Verdict',
    status: 'running',
    timestamp: new Date().toISOString(),
  };

  try {
    const fd = state.financialData || {};
    const financialHighlights = [
      fd.currentPrice ? `Price: ${fd.currency || ''} ${fd.currentPrice?.toFixed(2)}` : null,
      fd.marketCap ? `Market Cap: $${(fd.marketCap / 1e9).toFixed(2)}B` : null,
      fd.peRatio ? `P/E: ${fd.peRatio.toFixed(1)}x` : null,
      fd.revenueGrowthYoY ? `Revenue Growth: ${fd.revenueGrowthYoY.toFixed(1)}%` : null,
      fd.netIncomeMargin ? `Net Margin: ${fd.netIncomeMargin.toFixed(1)}%` : null,
      fd.freeCashFlow ? `FCF: $${(fd.freeCashFlow / 1e9).toFixed(2)}B` : null,
      fd.debtToEquity ? `D/E: ${fd.debtToEquity.toFixed(2)}x` : null,
      fd.returnOnEquity ? `ROE: ${fd.returnOnEquity.toFixed(1)}%` : null,
      fd.analystRating ? `Analyst Rating: ${fd.analystRating}` : null,
      fd.priceTarget ? `Analyst Target: ${fd.currency || '$'}${fd.priceTarget?.toFixed(2)}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    const sentimentText = state.sentiment
      ? `${state.sentiment.label} (score: ${state.sentiment.overall.toFixed(2)}, Positive: ${state.sentiment.positiveCount}, Neutral: ${state.sentiment.neutralCount}, Negative: ${state.sentiment.negativeCount})`
      : 'Neutral';

    const response = await callLLM(
      VERDICT_PROMPT(
        state.companyName,
        state.officialName || state.companyName,
        formatReportForPrompt(state.report),
        financialHighlights || 'No financial data available',
        sentimentText
      )
    );

    const verdictResult = extractJSON<VerdictResult>(response);

    // Validate verdict
    if (!['INVEST', 'PASS', 'WATCH'].includes(verdictResult.verdict)) {
      verdictResult.verdict = 'WATCH';
    }
    verdictResult.confidence = Math.min(100, Math.max(0, verdictResult.confidence));

    const verdictEmoji = verdictResult.verdict === 'INVEST' ? '🟢' : verdictResult.verdict === 'PASS' ? '🔴' : '🟡';

    const doneStep: StreamStep = {
      ...startStep,
      status: 'done',
      output: `${verdictEmoji} Verdict: ${verdictResult.verdict} | Confidence: ${verdictResult.confidence}% | Time Horizon: ${verdictResult.timeHorizon || 'N/A'}`,
      durationMs: Date.now() - startTime,
    };

    return {
      verdictResult,
      steps: [startStep, doneStep],
    };
  } catch (err) {
    const errorStep: StreamStep = {
      ...startStep,
      status: 'error',
      output: `Verdict generation failed: ${err}`,
      durationMs: Date.now() - startTime,
    };
    return {
      verdictResult: {
        verdict: 'WATCH' as Verdict,
        confidence: 40,
        investmentThesis: 'Unable to generate full analysis due to an error. Recommend further manual research.',
      },
      steps: [startStep, errorStep],
      errors: [`verdictEngine: ${err}`],
    };
  }
}
