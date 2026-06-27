// Node 5: Research Synthesizer
// Merges web findings, financial data, and news into a structured investment report

import { ResearchState } from '../state';
import { callLLM, extractJSON } from '../llm';
import { StreamStep, StructuredReport } from '@/types/research';
import { v4 as uuidv4 } from 'uuid';

const SYNTHESIZER_PROMPT = (
  companyName: string,
  officialName: string,
  ticker: string,
  financialSummary: string,
  webSummary: string,
  newsSummary: string
) => `
You are a senior investment research analyst at a top investment bank. Synthesize the following research about ${officialName || companyName} (${ticker}) into a structured investment report.

## Financial Data
${financialSummary}

## Web Research Findings
${webSummary}

## News & Sentiment Analysis
${newsSummary}

Based on ALL of the above, produce a comprehensive investment research report. Return ONLY valid JSON:
{
  "executiveSummary": "3-4 sentence overview of the company and investment case",
  "businessModel": "How the company makes money, key revenue streams, and competitive dynamics",
  "sector": "Sector name",
  "industry": "Industry name",
  "competitors": ["Competitor 1", "Competitor 2", "Competitor 3"],
  "financialHealthScore": 7.5,
  "growthProspectsScore": 8.0,
  "riskProfile": "Medium",
  "keyRisks": [
    "Risk 1 - specific and detailed",
    "Risk 2 - specific and detailed",
    "Risk 3 - specific and detailed"
  ],
  "keyStrengths": [
    "Strength 1 - specific and detailed",
    "Strength 2 - specific and detailed",
    "Strength 3 - specific and detailed"
  ],
  "moatAssessment": "Description of the company's competitive moat (or lack thereof)",
  "valuationAssessment": "Fair",
  "analystConsensus": "Summary of what analysts think",
  "recentDevelopments": [
    "Recent development 1",
    "Recent development 2"
  ]
}

Scoring guidelines:
- financialHealthScore (1-10): Based on profitability, leverage, cash flow, liquidity
- growthProspectsScore (1-10): Based on revenue growth, market opportunity, competitive position
- riskProfile: "Low", "Medium", or "High"
- valuationAssessment: "Undervalued", "Fair", or "Overvalued" based on P/E, P/B, growth vs. peers
`;

function formatFinancialSummary(data: ResearchState['financialData']): string {
  if (!data) return 'No financial data available.';
  const fmt = (v?: number, prefix = '', suffix = '', decimals = 2) =>
    v != null ? `${prefix}${v.toFixed(decimals)}${suffix}` : 'N/A';
  const fmtB = (v?: number) =>
    v != null ? `${(v / 1e9).toFixed(2)}B` : 'N/A';
  const fmtM = (v?: number) =>
    v != null ? `${(v / 1e6).toFixed(1)}M` : 'N/A';

  return `
Ticker: ${data.ticker || 'N/A'} | Exchange: ${data.exchange || 'N/A'}
Current Price: ${fmt(data.currentPrice, data.currency + ' ')}
Market Cap: ${fmtB(data.marketCap)}
P/E Ratio: ${fmt(data.peRatio, '', 'x')}
P/B Ratio: ${fmt(data.pbRatio, '', 'x')}
EV/EBITDA: ${fmt(data.evEbitda, '', 'x')}
Annual Revenue: ${fmtB(data.revenueAnnual)}
Revenue Growth (YoY): ${fmt(data.revenueGrowthYoY, '', '%')}
Net Income Margin: ${fmt(data.netIncomeMargin, '', '%')}
EBITDA Margin: ${fmt(data.ebitdaMargin, '', '%')}
Debt-to-Equity: ${fmt(data.debtToEquity, '', 'x')}
Current Ratio: ${fmt(data.currentRatio, '', 'x')}
Free Cash Flow: ${fmtB(data.freeCashFlow)}
Return on Equity: ${fmt(data.returnOnEquity, '', '%')}
52W High/Low: ${fmt(data.week52High)} / ${fmt(data.week52Low)}
Beta: ${fmt(data.beta)}
Dividend Yield: ${fmt(data.dividendYield, '', '%')}
Analyst Rating: ${data.analystRating || 'N/A'}
Price Target: ${fmt(data.priceTarget, data.currency + ' ')}
  `.trim();
}

export async function synthesizerNode(state: ResearchState): Promise<Partial<ResearchState>> {
  const stepId = uuidv4();
  const startTime = Date.now();

  const startStep: StreamStep = {
    id: stepId,
    name: 'synthesizer',
    label: '🧠 Synthesizing Research Report',
    status: 'running',
    timestamp: new Date().toISOString(),
  };

  try {
    const financialSummary = formatFinancialSummary(state.financialData);

    const webSummary = (state.webFindings || [])
      .map((f, i) => `[Search ${i + 1}] Query: "${f.query}"\n${f.summary}`)
      .join('\n\n');

    const sentiment = state.sentiment;
    const newsSummary = `
Overall Sentiment: ${sentiment?.label || 'Neutral'} (score: ${sentiment?.overall?.toFixed(2) || '0'})
Positive: ${sentiment?.positiveCount || 0} | Neutral: ${sentiment?.neutralCount || 0} | Negative: ${sentiment?.negativeCount || 0}

Top News:
${(state.newsItems || [])
  .slice(0, 5)
  .map((n) => `- [${n.sentiment.toUpperCase()}] ${n.title}: ${n.summary}`)
  .join('\n')}
    `.trim();

    const response = await callLLM(
      SYNTHESIZER_PROMPT(
        state.companyName,
        state.officialName || state.companyName,
        state.ticker || '',
        financialSummary,
        webSummary || 'No web research data available.',
        newsSummary
      )
    );

    const report = extractJSON<StructuredReport>(response);

    const doneStep: StreamStep = {
      ...startStep,
      status: 'done',
      output: `Report complete | Financial Health: ${report.financialHealthScore}/10 | Growth: ${report.growthProspectsScore}/10 | Risk: ${report.riskProfile} | Valuation: ${report.valuationAssessment}`,
      durationMs: Date.now() - startTime,
    };

    return {
      report,
      steps: [startStep, doneStep],
    };
  } catch (err) {
    const errorStep: StreamStep = {
      ...startStep,
      status: 'error',
      output: `Synthesis failed: ${err}`,
      durationMs: Date.now() - startTime,
    };
    return {
      steps: [startStep, errorStep],
      errors: [`synthesizer: ${err}`],
    };
  }
}
