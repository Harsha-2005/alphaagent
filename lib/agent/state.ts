// LangGraph Agent State Definition
import { Annotation, messagesStateReducer } from '@langchain/langgraph';
import { BaseMessage } from '@langchain/core/messages';
import {
  WebFinding,
  FinancialData,
  NewsItem,
  SentimentScore,
  StructuredReport,
  VerdictResult,
  StreamStep,
} from '@/types/research';

export const ResearchStateAnnotation = Annotation.Root({
  // Input
  companyName: Annotation<string>(),
  
  // Resolved info
  officialName: Annotation<string>(),
  ticker: Annotation<string>(),
  exchange: Annotation<string>(),
  sector: Annotation<string>(),
  queryPlan: Annotation<string[]>(),

  // Research outputs
  webFindings: Annotation<WebFinding[]>({
    reducer: (a, b) => [...(a || []), ...(b || [])],
    default: () => [],
  }),
  financialData: Annotation<FinancialData>(),
  newsItems: Annotation<NewsItem[]>({
    reducer: (a, b) => [...(a || []), ...(b || [])],
    default: () => [],
  }),
  sentiment: Annotation<SentimentScore>(),

  // Synthesis
  report: Annotation<StructuredReport>(),
  verdictResult: Annotation<VerdictResult>(),

  // Streaming
  steps: Annotation<StreamStep[]>({
    reducer: (a, b) => [...(a || []), ...(b || [])],
    default: () => [],
  }),

  // Error tracking
  errors: Annotation<string[]>({
    reducer: (a, b) => [...(a || []), ...(b || [])],
    default: () => [],
  }),
});

export type ResearchState = typeof ResearchStateAnnotation.State;
