// Core TypeScript types for the AI Investment Research Agent

export type Verdict = 'INVEST' | 'PASS' | 'WATCH';
export type RiskProfile = 'Low' | 'Medium' | 'High';
export type ValuationAssessment = 'Undervalued' | 'Fair' | 'Overvalued' | 'Unknown';
export type StepStatus = 'pending' | 'running' | 'done' | 'error';
export type SessionStatus = 'running' | 'done' | 'error';

export interface StreamStep {
  id: string;
  name: string;
  label: string;
  status: StepStatus;
  output?: string;
  durationMs?: number;
  timestamp: string;
}

export interface FinancialData {
  ticker?: string;
  exchange?: string;
  currency?: string;
  currentPrice?: number;
  marketCap?: number;
  peRatio?: number;
  pbRatio?: number;
  evEbitda?: number;
  revenueAnnual?: number;
  revenueGrowthYoY?: number;
  netIncomeMargin?: number;
  ebitdaMargin?: number;
  debtToEquity?: number;
  currentRatio?: number;
  freeCashFlow?: number;
  week52High?: number;
  week52Low?: number;
  dividendYield?: number;
  beta?: number;
  earningsPerShare?: number;
  returnOnEquity?: number;
  institutionalOwnership?: number;
  analystRating?: string;
  priceTarget?: number;
  revenueHistory?: { period: string; value: number }[];
  error?: string;
}

export interface NewsItem {
  title: string;
  source: string;
  publishedAt: string;
  url: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  sentimentScore: number; // -1 to 1
  summary: string;
}

export interface SentimentScore {
  overall: number; // -1 to 1
  label: 'Very Positive' | 'Positive' | 'Neutral' | 'Negative' | 'Very Negative';
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
}

export interface WebFinding {
  query: string;
  summary: string;
  sources: string[];
}

export interface StructuredReport {
  executiveSummary: string;
  businessModel: string;
  sector: string;
  industry: string;
  competitors: string[];
  financialHealthScore: number; // 1-10
  growthProspectsScore: number; // 1-10
  riskProfile: RiskProfile;
  keyRisks: string[];
  keyStrengths: string[];
  moatAssessment: string;
  valuationAssessment: ValuationAssessment;
  analystConsensus: string;
  recentDevelopments: string[];
}

export interface VerdictResult {
  verdict: Verdict;
  confidence: number; // 0-100
  investmentThesis: string;
  keyCatalysts?: string[];
  dealBreakers?: string[];
  watchTriggers?: string[];
  timeHorizon?: string;
  recommendedAllocation?: string;
}

export interface ResearchResult {
  id: string;
  companyName: string;
  officialName?: string;
  ticker?: string;
  exchange?: string;
  logoUrl?: string;
  status: SessionStatus;
  verdict?: Verdict;
  confidence?: number;
  financialData?: FinancialData;
  newsItems?: NewsItem[];
  sentiment?: SentimentScore;
  webFindings?: WebFinding[];
  report?: StructuredReport;
  verdictResult?: VerdictResult;
  steps: StreamStep[];
  durationMs?: number;
  createdAt: string;
  error?: string;
}

export interface ResearchSession {
  id: string;
  companyName: string;
  ticker?: string;
  status: SessionStatus;
  verdict?: Verdict;
  confidence?: number;
  createdAt: string;
  durationMs?: number;
}

export interface CompareResult {
  companies: ResearchResult[];
  comparisonTable: ComparisonRow[];
  recommendation: string;
}

export interface ComparisonRow {
  metric: string;
  values: (string | number | null)[];
  winner?: number; // index of winner company
}
