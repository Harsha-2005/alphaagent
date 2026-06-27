// Node 4: News Sentiment Analyzer
// Fetches recent news via NewsAPI and scores sentiment with LLM

import { ResearchState } from '../state';
import { callLLM, extractJSON } from '../llm';
import { StreamStep, NewsItem, SentimentScore } from '@/types/research';
import { v4 as uuidv4 } from 'uuid';
import { MOCK_MODE, getMockNewsArticles } from '../mock';

async function fetchNewsItems(companyName: string, ticker?: string): Promise<any[]> {
  const apiKey = process.env.NEWS_API_KEY;
  
  // Try NewsAPI first
  if (apiKey) {
    try {
      const query = encodeURIComponent(`"${companyName}" OR "${ticker || ''}" stock`);
      const response = await fetch(
        `https://newsapi.org/v2/everything?q=${query}&language=en&sortBy=publishedAt&pageSize=20&from=${getDateDaysAgo(30)}`,
        { headers: { 'X-Api-Key': apiKey } }
      );
      if (response.ok) {
        const data = await response.json();
        return data.articles || [];
      }
    } catch (err) {
      console.warn('NewsAPI failed:', err);
    }
  }

  // Fallback: use Tavily to search for news
  const tavilyKey = process.env.TAVILY_API_KEY;
  if (tavilyKey) {
    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: tavilyKey,
          query: `${companyName} news last 30 days`,
          search_depth: 'basic',
          max_results: 10,
          topic: 'news',
        }),
      });
      if (response.ok) {
        const data = await response.json();
        return (data.results || []).map((r: any) => ({
          title: r.title,
          source: { name: new URL(r.url).hostname },
          publishedAt: new Date().toISOString(),
          url: r.url,
          description: r.content?.slice(0, 500),
        }));
      }
    } catch (err) {
      console.warn('Tavily news fallback failed:', err);
    }
  }

  return [];
}

function getDateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

const SENTIMENT_PROMPT = (companyName: string, articles: string) => `
You are a financial news analyst. Analyze the sentiment of these news articles about "${companyName}" from an investor's perspective.

Articles:
${articles}

For each article, assess:
1. Sentiment: positive, neutral, or negative (from investor perspective)
2. Sentiment score: -1.0 (very negative) to 1.0 (very positive)
3. A brief 1-sentence summary of why it matters for investors

Return ONLY valid JSON:
{
  "articles": [
    {
      "index": 0,
      "sentiment": "positive",
      "sentimentScore": 0.7,
      "summary": "Brief investor-relevant summary"
    }
  ],
  "overallScore": 0.3,
  "overallLabel": "Positive",
  "positiveCount": 5,
  "negativeCount": 2,
  "neutralCount": 3
}

overallLabel must be one of: "Very Positive", "Positive", "Neutral", "Negative", "Very Negative"
`;

export async function newsSentimentNode(state: ResearchState): Promise<Partial<ResearchState>> {
  const stepId = uuidv4();
  const startTime = Date.now();

  const startStep: StreamStep = {
    id: stepId,
    name: 'newsSentiment',
    label: '📰 Analyzing News Sentiment',
    status: 'running',
    timestamp: new Date().toISOString(),
  };

  try {
    const rawArticles = MOCK_MODE
      ? getMockNewsArticles(state.companyName)
      : await fetchNewsItems(state.companyName, state.ticker);
    const topArticles = rawArticles.slice(0, 10);

    if (topArticles.length === 0) {
      const doneStep: StreamStep = {
        ...startStep,
        status: 'done',
        output: 'No recent news found — using neutral sentiment',
        durationMs: Date.now() - startTime,
      };
      return {
        newsItems: [],
        sentiment: {
          overall: 0,
          label: 'Neutral',
          positiveCount: 0,
          negativeCount: 0,
          neutralCount: 0,
        },
        steps: [startStep, doneStep],
      };
    }

    const articlesText = topArticles
      .map((a, i) => `[${i}] ${a.title}\nSource: ${a.source?.name || 'Unknown'}\n${a.description || ''}`)
      .join('\n\n');

    const response = await callLLM(SENTIMENT_PROMPT(state.companyName, articlesText));
    const parsed = extractJSON<{
      articles: { index: number; sentiment: string; sentimentScore: number; summary: string }[];
      overallScore: number;
      overallLabel: string;
      positiveCount: number;
      negativeCount: number;
      neutralCount: number;
    }>(response);

    const newsItems: NewsItem[] = topArticles.map((article, i) => {
      const analysis = parsed.articles.find((a) => a.index === i) || {
        sentiment: 'neutral',
        sentimentScore: 0,
        summary: article.description || article.title,
      };
      return {
        title: article.title,
        source: article.source?.name || 'Unknown',
        publishedAt: article.publishedAt,
        url: article.url,
        sentiment: analysis.sentiment as 'positive' | 'neutral' | 'negative',
        sentimentScore: analysis.sentimentScore,
        summary: analysis.summary,
      };
    });

    const sentiment: SentimentScore = {
      overall: parsed.overallScore,
      label: parsed.overallLabel as SentimentScore['label'],
      positiveCount: parsed.positiveCount,
      negativeCount: parsed.negativeCount,
      neutralCount: parsed.neutralCount,
    };

    const doneStep: StreamStep = {
      ...startStep,
      status: 'done',
      output: `Analyzed ${newsItems.length} articles | Overall: ${sentiment.label} (${sentiment.overall > 0 ? '+' : ''}${sentiment.overall.toFixed(2)}) | +${sentiment.positiveCount} 🟢 ${sentiment.neutralCount} 🟡 -${sentiment.negativeCount} 🔴`,
      durationMs: Date.now() - startTime,
    };

    return {
      newsItems,
      sentiment,
      steps: [startStep, doneStep],
    };
  } catch (err) {
    const errorStep: StreamStep = {
      ...startStep,
      status: 'error',
      output: `News analysis failed: ${err}`,
      durationMs: Date.now() - startTime,
    };
    return {
      newsItems: [],
      sentiment: { overall: 0, label: 'Neutral', positiveCount: 0, negativeCount: 0, neutralCount: 0 },
      steps: [startStep, errorStep],
      errors: [`newsSentiment: ${err}`],
    };
  }
}
