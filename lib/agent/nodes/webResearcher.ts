// Node 2: Web Researcher
// Uses Tavily to run parallel web searches based on the query plan

import { ResearchState } from '../state';
import { callLLM, extractJSON } from '../llm';
import { StreamStep, WebFinding } from '@/types/research';
import { v4 as uuidv4 } from 'uuid';

async function tavilySearch(query: string): Promise<{ title: string; url: string; content: string }[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) throw new Error('TAVILY_API_KEY not set');

  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: 'advanced',
      include_answer: true,
      max_results: 5,
    }),
  });

  if (!response.ok) throw new Error(`Tavily error: ${response.status}`);
  const data = await response.json();
  return data.results || [];
}

const SUMMARIZE_FINDINGS_PROMPT = (
  companyName: string,
  query: string,
  rawResults: string
) => `
You are a financial research analyst. Summarize the following web search results about "${companyName}" in context of the query: "${query}"

Search Results:
${rawResults}

Provide a concise, factual 3-5 sentence summary focused on investment-relevant insights.
Return ONLY valid JSON:
{
  "summary": "Your summary here",
  "sources": ["url1", "url2"]
}
`;

export async function webResearcherNode(state: ResearchState): Promise<Partial<ResearchState>> {
  const stepId = uuidv4();
  const startTime = Date.now();

  const startStep: StreamStep = {
    id: stepId,
    name: 'webResearcher',
    label: '🌐 Researching Company Online',
    status: 'running',
    timestamp: new Date().toISOString(),
  };

  const queries = state.queryPlan || [];
  const findings: WebFinding[] = [];

  try {
    // Run searches in parallel (up to 4 at once)
    const searchPromises = queries.slice(0, 4).map(async (query) => {
      try {
        const results = await tavilySearch(query);
        const rawContent = results
          .map((r) => `Title: ${r.title}\nURL: ${r.url}\nContent: ${r.content}`)
          .join('\n\n---\n\n');

        const response = await callLLM(
          SUMMARIZE_FINDINGS_PROMPT(state.companyName, query, rawContent.slice(0, 8000))
        );

        const parsed = extractJSON<{ summary: string; sources: string[] }>(response);
        return {
          query,
          summary: parsed.summary,
          sources: parsed.sources || results.map((r) => r.url).slice(0, 3),
        } as WebFinding;
      } catch (err) {
        console.warn(`Search failed for query: ${query}`, err);
        return null;
      }
    });

    const results = await Promise.all(searchPromises);
    results.forEach((r) => r && findings.push(r));

    const doneStep: StreamStep = {
      ...startStep,
      status: 'done',
      output: `Completed ${findings.length} web searches | Gathered business model, competitive analysis, and analyst insights`,
      durationMs: Date.now() - startTime,
    };

    return {
      webFindings: findings,
      steps: [startStep, doneStep],
    };
  } catch (err) {
    const errorStep: StreamStep = {
      ...startStep,
      status: 'error',
      output: `Web research failed: ${err}`,
      durationMs: Date.now() - startTime,
    };
    return {
      steps: [startStep, errorStep],
      errors: [`webResearcher: ${err}`],
      webFindings: findings,
    };
  }
}
