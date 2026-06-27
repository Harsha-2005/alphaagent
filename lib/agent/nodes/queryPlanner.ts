// Node 1: Query Planner
// Resolves company name → ticker, official name, and generates a research plan

import { ResearchState } from '../state';
import { callLLM, extractJSON } from '../llm';
import { StreamStep } from '@/types/research';
import { v4 as uuidv4 } from 'uuid';

const QUERY_PLANNER_PROMPT = (companyName: string) => `
You are an expert investment research analyst. A user wants to research: "${companyName}"

Your tasks:
1. Identify the company's official name, stock ticker symbol, and exchange (e.g., NSE, BSE, NYSE, NASDAQ, etc.)
2. Generate 6 specific web search queries to research this company for investment purposes

Return ONLY valid JSON in this exact format:
{
  "officialName": "Full official company name",
  "ticker": "TICKER",
  "exchange": "EXCHANGE_NAME",
  "sector": "Sector name",
  "industry": "Industry name",
  "searchQueries": [
    "query 1",
    "query 2",
    "query 3",
    "query 4",
    "query 5",
    "query 6"
  ]
}

Search queries should cover:
- Business model and competitive position
- Recent financial performance and analyst ratings
- Management quality and corporate governance
- Key growth drivers and future prospects
- Main risks and challenges
- Recent news, acquisitions, or strategic developments

If the company is not publicly traded or not found, still return the JSON with ticker as "PRIVATE" or "UNKNOWN".
`;

export async function queryPlannerNode(state: ResearchState): Promise<Partial<ResearchState>> {
  const stepId = uuidv4();
  const startTime = Date.now();

  const startStep: StreamStep = {
    id: stepId,
    name: 'queryPlanner',
    label: '🎯 Planning Research Strategy',
    status: 'running',
    timestamp: new Date().toISOString(),
  };

  try {
    const response = await callLLM(QUERY_PLANNER_PROMPT(state.companyName));
    const parsed = extractJSON<{
      officialName: string;
      ticker: string;
      exchange: string;
      sector: string;
      industry: string;
      searchQueries: string[];
    }>(response);

    const doneStep: StreamStep = {
      ...startStep,
      status: 'done',
      output: `Identified: ${parsed.officialName} (${parsed.ticker}:${parsed.exchange}) | Generated ${parsed.searchQueries.length} research queries`,
      durationMs: Date.now() - startTime,
    };

    return {
      officialName: parsed.officialName,
      ticker: parsed.ticker,
      exchange: parsed.exchange,
      sector: parsed.sector,
      queryPlan: parsed.searchQueries,
      steps: [startStep, doneStep],
    };
  } catch (err) {
    const errorStep: StreamStep = {
      ...startStep,
      status: 'error',
      output: `Failed to plan research: ${err}`,
      durationMs: Date.now() - startTime,
    };
    return {
      steps: [startStep, errorStep],
      errors: [`queryPlanner: ${err}`],
      queryPlan: [
        `${state.companyName} company overview business model`,
        `${state.companyName} financial performance revenue profit 2024`,
        `${state.companyName} stock analysis analyst rating price target`,
        `${state.companyName} competitive analysis market position`,
        `${state.companyName} risks challenges problems`,
        `${state.companyName} recent news acquisitions strategy 2024`,
      ],
    };
  }
}
