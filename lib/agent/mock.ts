// Mock LLM responses for demo mode — used when API quota is exceeded
// Returns realistic research data matching EXACT node schema expectations

export const MOCK_MODE = process.env.DEMO_MODE === 'true';

export function getMockResponse(prompt: string): string {
  const lower = prompt.toLowerCase();

  // Node 1: Query Planner — expects { officialName, ticker, exchange, sector, industry, searchQueries[] }
  if (lower.includes('official name') || lower.includes('ticker symbol') || lower.includes('research analyst')) {
    return JSON.stringify(mockQueryPlan(prompt));
  }

  // Node 4: News Sentiment — expects { articles[], overallScore, overallLabel, positiveCount, negativeCount, neutralCount }
  if (lower.includes('sentiment') && lower.includes('overallscore')) {
    return JSON.stringify(mockSentimentAnalysis());
  }

  // Node 5: Synthesizer — expects { executiveSummary, businessModel, moatAssessment, keyStrengths[], keyRisks[], ... }
  if (lower.includes('executive summary') || lower.includes('business model') || lower.includes('synthesize')) {
    return JSON.stringify(mockReport());
  }

  // Node 6: Verdict Engine — expects { verdict, confidence, riskProfile, ... }
  if (lower.includes('invest') && lower.includes('pass') && lower.includes('watch')) {
    return JSON.stringify(mockVerdict());
  }

  return JSON.stringify({ result: 'Demo mode active', summary: 'AlphaAgent research system demonstration.' });
}

function extractCompanyFromPrompt(prompt: string): string {
  // Try to find company name between quotes
  const match = prompt.match(/research:\s*"([^"]+)"/i) || prompt.match(/"([^"]+)"/);
  return match?.[1]?.trim() || 'Zomato';
}

function mockQueryPlan(prompt: string) {
  const company = extractCompanyFromPrompt(prompt);
  const companies: Record<string, any> = {
    'zomato': { officialName: 'Zomato Limited', ticker: 'ZOMATO', exchange: 'NSE', sector: 'Consumer Discretionary', industry: 'Internet & Direct Marketing Retail' },
    'reliance': { officialName: 'Reliance Industries Limited', ticker: 'RELIANCE', exchange: 'NSE', sector: 'Energy', industry: 'Oil, Gas & Consumable Fuels' },
    'apple': { officialName: 'Apple Inc.', ticker: 'AAPL', exchange: 'NASDAQ', sector: 'Technology', industry: 'Technology Hardware' },
    'hdfc': { officialName: 'HDFC Bank Limited', ticker: 'HDFCBANK', exchange: 'NSE', sector: 'Financials', industry: 'Banks' },
    'nvidia': { officialName: 'NVIDIA Corporation', ticker: 'NVDA', exchange: 'NASDAQ', sector: 'Technology', industry: 'Semiconductors' },
    'tcs': { officialName: 'Tata Consultancy Services Limited', ticker: 'TCS', exchange: 'NSE', sector: 'Information Technology', industry: 'IT Services & Consulting' },
  };
  const key = Object.keys(companies).find(k => company.toLowerCase().includes(k)) || 'zomato';
  const base = companies[key];
  return {
    ...base,
    searchQueries: [
      `${base.officialName} business model revenue streams 2025`,
      `${base.officialName} competitive advantages moat analysis`,
      `${base.officialName} financial performance Q4 2024 earnings results`,
      `${base.officialName} growth strategy expansion plans 2025 2026`,
      `${base.officialName} risks regulatory challenges headwinds`,
      `${base.ticker} analyst ratings price target buy sell hold`,
    ],
  };
}

function mockSentimentAnalysis() {
  return {
    articles: [
      { index: 0, sentiment: 'positive', sentimentScore: 0.75, summary: 'Strong quarterly earnings beat analyst expectations, signaling robust business momentum.' },
      { index: 1, sentiment: 'positive', sentimentScore: 0.62, summary: 'Strategic expansion into new markets opens significant revenue opportunity.' },
      { index: 2, sentiment: 'neutral',  sentimentScore: 0.05, summary: 'Management reshuffle noted but seen as routine succession planning.' },
      { index: 3, sentiment: 'positive', sentimentScore: 0.58, summary: 'New product launch well-received by consumers, strengthening brand equity.' },
      { index: 4, sentiment: 'negative', sentimentScore: -0.45, summary: 'Regulatory scrutiny poses near-term uncertainty for the business model.' },
      { index: 5, sentiment: 'positive', sentimentScore: 0.70, summary: 'Profitability milestone achieved ahead of guidance, improving investor confidence.' },
    ],
    overallScore: 0.54,
    overallLabel: 'Positive',
    positiveCount: 4,
    negativeCount: 1,
    neutralCount: 1,
  };
}

function mockReport() {
  return {
    executiveSummary: 'This company demonstrates strong fundamentals with consistent revenue growth and expanding margins. The business model is well-diversified with multiple revenue streams providing resilience against market volatility. Management has shown exceptional execution capability and the competitive position remains entrenched.',
    businessModel: 'The company operates across multiple business segments including core products, platform services, and adjacent markets. Revenue is primarily generated through subscriptions, licensing, and transaction-based models creating sticky, recurring income streams.',
    moatAssessment: 'Strong competitive moat driven by network effects, switching costs, and brand loyalty. Market leadership position reinforced by significant R&D investment and proprietary technology stack that competitors would take years to replicate.',
    keyStrengths: [
      'Market leadership with 35%+ market share in core segment',
      'Strong free cash flow generation consistently above 20% FCF margin',
      'Diversified revenue streams reducing single-segment dependency',
      'Management team with proven track record of disciplined capital allocation',
      'Robust balance sheet with net cash position providing M&A optionality',
    ],
    keyRisks: [
      'Regulatory scrutiny increasing in key markets — potential for adverse rulings',
      'Competitive pressure from well-funded new entrants compressing margins',
      'Macroeconomic sensitivity affecting enterprise and consumer spending',
      'Talent retention challenges in a highly competitive hiring environment',
    ],
    competitors: ['Competitor Alpha', 'Competitor Beta', 'Competitor Gamma', 'Competitor Delta'],
    recentDevelopments: [
      'Launched next-generation AI-integrated product suite with premium pricing',
      'Completed strategic acquisition expanding total addressable market by 40%',
      'Reported Q4 revenue growth of 22% YoY, beating consensus estimates by 8%',
    ],
    analystConsensus: 'Consensus Strong Buy with 12-month price target implying 22% upside. 31 out of 38 analysts maintain Buy or Outperform rating.',
    sector: 'Technology',
    industry: 'Software & Platform Services',
    financialHealthScore: 8.4,
    growthProspectsScore: 8.1,
  };
}

function mockVerdict() {
  return {
    verdict: 'INVEST',
    confidence: 78,
    riskProfile: 'Medium',
    valuationAssessment: 'Fair',
    investmentThesis: "Strong fundamentals, market leadership, and consistent execution make this a compelling long-term investment. The company's diversified revenue model and robust cash generation provide downside protection, while AI-driven growth initiatives support significant upside potential over the next 12–18 months.",
    catalysts: [
      'AI product integration driving premium pricing and 300–400bps margin expansion',
      'International market penetration unlocking $8B+ incremental TAM',
      'Operating leverage kicking in at scale — profitability inflection point near',
    ],
    dealBreakers: [
      'Sustained adverse regulatory action restricting core business operations',
      'Consecutive quarters of market share loss exceeding 5% in primary segment',
    ],
    timeHorizon: '12-18 months',
    targetAllocation: 'Core Position (3–5% portfolio weight)',
  };
}

// Mock news articles (used by newsSentimentNode when in demo mode)
export function getMockNewsArticles(companyName: string) {
  return [
    { title: `${companyName} Reports Record Quarterly Revenue, Beats Estimates`, source: { name: 'Economic Times' }, publishedAt: new Date(Date.now() - 2 * 86400000).toISOString(), url: '#', description: 'The company delivered exceptional quarterly results with revenue surging 22% year-over-year.' },
    { title: `${companyName} Announces Strategic Expansion into Southeast Asia`, source: { name: 'Mint' }, publishedAt: new Date(Date.now() - 4 * 86400000).toISOString(), url: '#', description: 'Management outlined an ambitious expansion plan targeting high-growth emerging markets.' },
    { title: `Analysts Upgrade ${companyName} to Strong Buy, Raise Price Target`, source: { name: 'Business Standard' }, publishedAt: new Date(Date.now() - 6 * 86400000).toISOString(), url: '#', description: 'Multiple brokerages raised their price targets citing improved profitability outlook.' },
    { title: `${companyName} Faces Regulatory Inquiry Over Market Practices`, source: { name: 'Reuters' }, publishedAt: new Date(Date.now() - 8 * 86400000).toISOString(), url: '#', description: 'Regulators have initiated a preliminary inquiry into competitive practices.' },
    { title: `${companyName} Launches AI-Powered Platform, Stock Surges 8%`, source: { name: 'CNBC' }, publishedAt: new Date(Date.now() - 10 * 86400000).toISOString(), url: '#', description: 'The new AI-integrated product was well received by institutional investors.' },
    { title: `${companyName} Achieves Profitability Milestone Ahead of Schedule`, source: { name: 'Financial Express' }, publishedAt: new Date(Date.now() - 12 * 86400000).toISOString(), url: '#', description: 'The company turned profitable two quarters ahead of management guidance.' },
  ];
}
