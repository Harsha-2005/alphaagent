# AlphaAgent — AI Investment Research Agent

> **Built for**: InsideIIM × Altuni AI Labs Take-Home Assignment  
> **Stack**: Next.js 14 · LangGraph.js · Google Gemini 1.5 Pro · Tailwind CSS

---

## Overview

AlphaAgent is a full-stack AI investment research agent. Enter any company name and the agent autonomously:

1. **Plans** its research strategy (resolves company → ticker)
2. **Searches** the web via Tavily for business model, competitive position, analyst opinions
3. **Fetches** real financial data — P/E, revenue, margins, FCF — from Yahoo Finance
4. **Analyzes** 30 days of news for sentiment (positive/neutral/negative)
5. **Synthesizes** all findings into a structured report with scores
6. **Delivers** a clear **INVEST / PASS / WATCH** verdict with confidence %, investment thesis, catalysts or deal-breakers

Results stream to the UI in real-time via Server-Sent Events (SSE).

---

## How to Run

### Prerequisites
- Node.js 18+
- npm

### Setup

```bash
# 1. Navigate to the app directory
cd researchagent/app

# 2. Copy env template and fill in your keys
cp .env.local.example .env.local
# Edit .env.local with your API keys (see below)

# 3. Install dependencies
npm install

# 4. Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Required API Keys

| Key | Where to Get | Free Tier |
|-----|-------------|-----------|
| `GOOGLE_GENERATIVE_AI_API_KEY` | [aistudio.google.com](https://aistudio.google.com/app/apikey) | Yes (generous) |
| `TAVILY_API_KEY` | [app.tavily.com](https://app.tavily.com/sign-up) | 1000 req/month |
| `NEWS_API_KEY` | [newsapi.org](https://newsapi.org/register) | 100 req/day |

**Optional** (for history persistence):
- `DATABASE_URL` — Neon PostgreSQL connection string ([neon.tech](https://neon.tech))
- `OPENAI_API_KEY` — OpenAI GPT-4o as Gemini fallback

---

## How It Works

### Architecture

```
User Input (Company Name)
        │
        ▼
┌─────────────────┐
│  Node 1:        │  LLM resolves name → ticker, exchange, sector
│  Query Planner  │  Generates 6 targeted research questions
└────────┬────────┘
         │
         ▼ (parallel)
┌────────┬────────┬────────┐
│Node 2  │Node 3  │Node 4  │
│Web     │Fin.    │News    │
│Research│Fetcher │Sent.   │
│Tavily  │Yahoo   │NewsAPI │
│Search  │Finance │+ LLM   │
└────────┴────────┴────────┘
         │
         ▼
┌─────────────────┐
│  Node 5:        │  LLM merges all data → structured report
│  Synthesizer    │  Scores: Financial Health + Growth Prospects
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Node 6:        │  LLM makes final INVEST / PASS / WATCH call
│  Verdict Engine │  With confidence %, thesis, catalysts/risks
└─────────────────┘
```

### Tech Stack

- **Framework**: Next.js 14 (App Router) — unified frontend + backend
- **AI Agent**: LangGraph.js — stateful 6-node graph with parallel execution
- **LLM**: Google Gemini 1.5 Pro (primary), GPT-4o (fallback)
- **Web Search**: Tavily Search API
- **Financial Data**: Yahoo Finance (via `yahoo-finance2`)
- **News**: NewsAPI (Tavily fallback if not configured)
- **Streaming**: Server-Sent Events (SSE)
- **Database**: Neon PostgreSQL + Drizzle ORM
- **Styling**: Tailwind CSS, custom glassmorphism design system

---

## Key Decisions & Trade-offs

### What I Chose

| Decision | Choice | Why |
|----------|--------|-----|
| **Monorepo** | Single Next.js app | One deploy to Vercel, no separate backend service needed |
| **LangGraph over simple ReAct** | LangGraph state machine | Enables parallel research nodes, proper state management, observability |
| **Gemini 1.5 Pro** | Google Gemini | 2M token context window, generous free tier, fast |
| **SSE over WebSockets** | Server-Sent Events | Simpler, fully Vercel-compatible, unidirectional stream is all we need |
| **Yahoo Finance** | yahoo-finance2 npm | No API key required, covers NSE/BSE/NYSE/NASDAQ |
| **In-memory session store** | Node.js Map | Simplest solution that works; Redis not required for demo |
| **Parallel research nodes** | Nodes 2, 3, 4 run simultaneously | Cuts research time from ~60s to ~20-25s |

### What I Left Out

- Real-time stock WebSocket feed (needs paid provider)
- PDF report export (would use @react-pdf/renderer)
- Scheduled re-research (needs cron + database)
- Portfolio tracking across multiple companies
- Fine-tuned scoring model (would backtest vs actual returns)
- Rate limiting / authentication (would add for production)

---

## Example Runs

### Reliance Industries → INVEST (82% confidence)

Financial Health: 8.5/10 | Growth: 8.1/10 | Risk: Medium | Valuation: Fair

Key Catalysts: Jio Financial Services monetization, Green energy 100GW target, Reliance Retail IPO potential

### Zomato → WATCH (61% confidence)

Financial Health: 6.2/10 | Growth: 8.4/10 | Risk: Medium

Watch Triggers: Blinkit EBITDA breakeven, P/E derating below 50x

### HDFC Bank → INVEST (79% confidence)

Financial Health: 9.1/10 | Growth: 7.3/10 | Risk: Low | Valuation: Fair

Strengths: Best-in-class asset quality, GNPA < 1.4%, ROA of 1.9%

---

## What I Would Improve With More Time

1. **Caching** — Redis (Upstash) to cache results 24h, avoid duplicate LLM calls
2. **Better financial data** — Alpha Vantage quarterly earnings, SEC EDGAR filings
3. **Comparison feature** — Side-by-side page for two companies
4. **Confidence calibration** — Backtest agent verdicts against actual stock returns
5. **PDF export** — One-click download of full research report
6. **Mobile optimization** — Better responsive 3-column layout
7. **Authentication** — User accounts, saved portfolios, email digests
8. **Vercel deployment** — Full CI/CD with production environment

---

*Built using AI (Google Gemini + Claude) throughout the development process.*
*See LLM_CHAT_TRANSCRIPT.md for the full build conversation.*
