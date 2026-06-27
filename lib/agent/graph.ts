// Main LangGraph Agent Graph
// Wires all 6 nodes together with parallel execution for nodes 2, 3, 4

import { StateGraph, END } from '@langchain/langgraph';
import { ResearchStateAnnotation, ResearchState } from './state';
import { queryPlannerNode } from './nodes/queryPlanner';
import { webResearcherNode } from './nodes/webResearcher';
import { financialFetcherNode } from './nodes/financialFetcher';
import { newsSentimentNode } from './nodes/newsSentiment';
import { synthesizerNode } from './nodes/synthesizer';
import { verdictEngineNode } from './nodes/verdictEngine';

// Parallel fan-out node — triggers web, financial, and news research simultaneously
async function parallelResearchNode(state: ResearchState): Promise<Partial<ResearchState>> {
  const [webResult, financialResult, newsResult] = await Promise.all([
    webResearcherNode(state),
    financialFetcherNode(state),
    newsSentimentNode(state),
  ]);

  return {
    webFindings: [
      ...(webResult.webFindings || []),
    ],
    financialData: financialResult.financialData,
    newsItems: newsResult.newsItems || [],
    sentiment: newsResult.sentiment,
    steps: [
      ...(webResult.steps || []),
      ...(financialResult.steps || []),
      ...(newsResult.steps || []),
    ],
    errors: [
      ...(webResult.errors || []),
      ...(financialResult.errors || []),
      ...(newsResult.errors || []),
    ],
  };
}

// Build the LangGraph state machine
export function buildResearchGraph() {
  const graph = new StateGraph(ResearchStateAnnotation)
    .addNode('queryPlanner', queryPlannerNode)
    .addNode('parallelResearch', parallelResearchNode)
    .addNode('synthesizer', synthesizerNode)
    .addNode('verdictEngine', verdictEngineNode)
    .addEdge('__start__', 'queryPlanner')
    .addEdge('queryPlanner', 'parallelResearch')
    .addEdge('parallelResearch', 'synthesizer')
    .addEdge('synthesizer', 'verdictEngine')
    .addEdge('verdictEngine', '__end__');

  return graph.compile();
}

// Run the full research pipeline
export async function runResearch(
  companyName: string,
  onStep?: (step: any) => void
): Promise<ResearchState> {
  const graph = buildResearchGraph();

  const initialState: Partial<ResearchState> = {
    companyName: companyName.trim(),
    webFindings: [],
    newsItems: [],
    steps: [],
    errors: [],
  };

  let finalState = initialState as ResearchState;

  // Stream mode — emit steps as they complete
  if (onStep) {
    const stream = await graph.stream(initialState as ResearchState, {
      streamMode: 'values',
    });

    for await (const state of stream) {
      finalState = state;
      // Emit any new steps
      if (state.steps?.length > 0) {
        state.steps.forEach((step: any) => onStep(step));
      }
    }
  } else {
    finalState = await graph.invoke(initialState as ResearchState) as ResearchState;
  }

  return finalState;
}
