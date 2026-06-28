# 🧠 AlphaAgent — AI Investment Research Agent

> **InsideIIM × Altuni AI Labs Take-Home Assignment**  
> Built by: Harsha | AI Product Development Engineer (Intern) Candidate

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![LangGraph](https://img.shields.io/badge/LangGraph-Agent-blue)](https://langchain.com)
[![Gemini](https://img.shields.io/badge/Gemini-2.0%20Flash-orange?logo=google)](https://ai.google.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue?logo=postgresql)](https://postgresql.org)

---

## 📌 Overview — What It Does

**AlphaAgent** is a fully autonomous AI investment research agent. You type a company name — it researches, analyzes, and decides: **INVEST**, **PASS**, or **WATCH** — with complete reasoning.

### What it produces for every company:
- ✅ **INVEST / PASS / WATCH** verdict with confidence score (0–100%)
- 📊 **Financial metrics** — P/E ratio, revenue, margins, market cap (live via Yahoo Finance)
- 📰 **News sentiment** — analyzes last 30 days of news (positive/negative/neutral)
- 📝 **Full research report** — executive summary, business model, competitive moat, key risks
- 📈 **Graphical analysis** — 52-week price chart, revenue/profit trends, radar scorecard
- 🔴 **Live streaming** — watch all 6 agent nodes execute in real-time

### Live Demo
> Run locally at `http://localhost:3000` or deploy to Vercel (see deployment section)

---

## 🏗️ Architecture — How It Works

AlphaAgent uses a **6-node LangGraph pipeline** that streams results live to the UI via Server-Sent Events (SSE).

```
User Input (Company Name)
        │
        ▼
┌─────────────────────────────────────────────────────────┐
│                    LangGraph Agent                       │
│                                                         │
│  Node 1: 🎯 Query Planner                               │
│  ├─ Resolves company → ticker, exchange, sector          │
│  └─ Generates 6 targeted research queries               │
│                  │                                      │
│  Node 2: 🌐 Web Researcher                              │
│  ├─ Tavily Search API (4 parallel queries)              │
│  └─ Extracts business model, competitors, strategy     │
│                  │                                      │
│  Node 3: 📊 Financial Data Fetcher                      │
│  ├─ Yahoo Finance (real-time price, P/E, market cap)    │
│  └─ Revenue history, margins, debt/equity, beta        │
│                  │                                      │
│  Node 4: 📰 News Sentiment Analyzer                     │
│  ├─ NewsAPI (last 30 days of articles)                  │
│  └─ Gemini LLM scores each article -1.0 to +1.0       │
│                  │                                      │
│  Node 5: 🧠 Research Synthesizer                        │
│  └─ Gemini compiles full research report               │
│                  │                                      │
│  Node 6: ⚖️ Verdict Engine                              │
│  └─ Final INVEST / PASS / WATCH with thesis            │
└─────────────────────────────────────────────────────────┘
        │
        ▼
  SSE Stream → Next.js UI (real-time updates)
        │
        ▼
  PostgreSQL (research history saved)
```

### Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Next.js 16 (App Router) | Full-stack React with SSE support |
| **Agent** | LangGraph | Stateful multi-node agent orchestration |
| **LLM** | Google Gemini 2.0 Flash | Primary LLM (new AQ. key format) |
| **Web Search** | Tavily Search API | Real-time web research |
| **Financial Data** | Yahoo Finance 2 | Live stock price & fundamentals |
| **News** | NewsAPI | Recent news articles |
| **Database** | PostgreSQL + Drizzle ORM | Research history persistence |
| **Charts** | Recharts | 52W price, revenue, margin, radar |
| **Styling** | Vanilla CSS + dark theme | Premium dark UI |

---

## ⚙️ How to Run — Setup & Installation

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ (local) or Neon account (cloud)
- API keys (see below)

### 1. Clone the repository
```bash
git clone https://github.com/Harsha-2005/alphaagent.git
cd alphaagent
npm install
```

### 2. Set up environment variables
Create a `.env.local` file in the root:

```env
# ── LLM (Required) ──────────────────────────────────────
# Google Gemini — Get from: https://aistudio.google.com/app/apikey
# New AQ. key format is supported
GOOGLE_API_KEY=AQ.your_key_here
GOOGLE_GENERATIVE_AI_API_KEY=AQ.your_key_here

# ── Research Tools (Required) ───────────────────────────
# Tavily Search — Free: https://app.tavily.com/sign-up
TAVILY_API_KEY=tvly-dev-your_key_here

# NewsAPI — Free: https://newsapi.org/register
NEWS_API_KEY=your_key_here

# ── Database (Required for history) ─────────────────────
# Local PostgreSQL:
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/alphaagent

# Or Neon (cloud, free): https://neon.tech
# DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# ── App Config ──────────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Demo mode (set true if API quota is exceeded)
DEMO_MODE=false
```

### 3. Set up the database
```bash
# Create database (PostgreSQL must be running)
psql -U postgres -c "CREATE DATABASE alphaagent;"

# Create the research_sessions table
psql -U postgres -d alphaagent -c "
CREATE TABLE IF NOT EXISTS research_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  official_name TEXT,
  ticker TEXT,
  exchange TEXT,
  status TEXT NOT NULL DEFAULT 'running',
  report JSONB,
  verdict TEXT,
  confidence INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sessions_created ON research_sessions(created_at DESC);
"
```

### 4. Run the development server
```bash
npm run dev
```

Open **http://localhost:3000** 🎉

### 5. API Keys Quick Guide

| Key | Where to Get | Free Tier |
|-----|-------------|-----------|
| `GOOGLE_API_KEY` | [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) | 1500 req/day |
| `TAVILY_API_KEY` | [app.tavily.com](https://app.tavily.com/sign-up) | 1000 req/month |
| `NEWS_API_KEY` | [newsapi.org/register](https://newsapi.org/register) | 100 req/day |

> **No API keys?** Set `DEMO_MODE=true` in `.env.local` — the app runs with realistic mock data.

---

## 🧠 Key Decisions & Trade-offs

### 1. LangGraph over raw LLM calls
**Chose:** LangGraph for structured agent orchestration  
**Why:** Each research task (web search, financial fetch, news, synthesis) is independent and can fail gracefully. LangGraph's stateful nodes allow proper error handling at each step without crashing the whole pipeline.  
**Trade-off:** Adds complexity — a simple sequential LLM call would be faster to build but brittle.

### 2. Server-Sent Events (SSE) for streaming
**Chose:** SSE over WebSockets  
**Why:** SSE is simpler, works natively with Next.js API routes, and is sufficient for one-way server→client streaming. WebSockets would add unnecessary complexity for this use case.

### 3. Gemini 2.0 Flash as primary LLM
**Chose:** Gemini over GPT-4o as primary  
**Why:** Google's new AQ. key format offers better security. Gemini 2.0 Flash is fast, cheap, and accurate enough for structured JSON extraction tasks. OpenAI is configured as a fallback.  
**Trade-off:** Gemini has stricter free tier limits (1500 req/day per project).

### 4. Yahoo Finance for financial data (no API key)
**Chose:** `yahoo-finance2` npm package  
**Why:** Free, no API key required, provides all needed metrics (P/E, revenue, margins, beta, market cap). Alternative paid APIs (Alpha Vantage, FMP) would cost money.  
**Trade-off:** Yahoo Finance data can be delayed 15 minutes and occasionally fails for smaller companies.

### 5. PostgreSQL over SQLite/in-memory
**Chose:** PostgreSQL with Drizzle ORM  
**Why:** Production-grade, supports both local dev (pg) and cloud (Neon serverless) with one codebase. The dual-mode `getDb()` function auto-detects which driver to use.  
**Left out:** Redis caching for repeated company lookups (would improve speed significantly).

### 6. Demo Mode
**Added:** `DEMO_MODE=true` fallback with realistic mock data  
**Why:** Google's free tier quota can exhaust during heavy development/testing. Demo mode allows full UI demonstration without API calls.

### What was left out (would add with more time)
- 🔄 **Compare mode** — side-by-side comparison of 2 companies
- 💰 **DCF valuation model** — intrinsic value calculation
- 📧 **Email alerts** — notify when a watched stock changes verdict
- 🗂️ **Portfolio tracking** — track multiple positions over time
- 🌍 **Multi-language** — support Hindi/regional languages for Indian stocks
- ⚡ **Redis caching** — cache results for 1 hour to avoid repeated API calls

---

## 📊 Example Runs

### Example 1: Zomato Limited (ZOMATO:NSE) — INVEST

```
Verdict:    INVEST ✅
Confidence: 78%
Risk:       Medium
Horizon:    12–18 months

Investment Thesis:
Zomato has achieved profitability ahead of guidance and continues to expand
its quick-commerce (Blinkit) segment aggressively. Network effects in food
delivery and first-mover advantage in dark stores create a durable moat.
The TAM for quick commerce in India is estimated at $45B+ and Zomato is
best-positioned to capture it.

Key Metrics:
  Market Cap:   ₹2,21,000 Cr
  Revenue (TTM): ₹16,000 Cr (+70% YoY)
  Net Margin:   4.2% (first profitable year)
  P/E Ratio:    320x (growth premium)
  Beta:         1.42

Strengths:
  ✓ Profitability milestone achieved ahead of schedule
  ✓ Blinkit GMV growing 100%+ YoY
  ✓ Strong brand recognition — 85M+ active users
  ✓ Network effects moat in 500+ cities

Risks:
  ⚠ High valuation (320x P/E) leaves little room for error
  ⚠ Swiggy/Zepto competition intensifying
  ⚠ Unit economics of quick commerce still unproven at scale
```

---

### Example 2: Reliance Industries (RELIANCE:NSE) — WATCH

```
Verdict:    WATCH 👁
Confidence: 65%
Risk:       Low-Medium
Horizon:    6–12 months

Investment Thesis:
Reliance is a high-quality business with exceptional diversification across
energy, retail (JioMart), and telecom (Jio). However, near-term catalysts
are limited as the Jio IPO timeline remains uncertain and oil refining
margins are compressing globally. Better entry point likely in 6–9 months.

Key Metrics:
  Market Cap:   ₹19,50,000 Cr
  Revenue (TTM): ₹9,30,000 Cr
  Net Margin:   8.1%
  P/E Ratio:    28x
  Beta:         0.82

Strengths:
  ✓ Unparalleled scale and diversification
  ✓ Jio — 450M+ subscribers, market leader
  ✓ Strong FCF generation (₹75,000 Cr+)
  ✓ Mukesh Ambani's execution track record

Risks:
  ⚠ O2C (Oil-to-Chemicals) segment facing global headwinds
  ⚠ Retail segment growth slowing
  ⚠ Jio IPO delay removes key re-rating catalyst
```

---

### Example 3: HDFC Bank (HDFCBANK:NSE) — INVEST

```
Verdict:    INVEST ✅
Confidence: 82%
Risk:       Low
Horizon:    18–24 months

Investment Thesis:
HDFC Bank post-merger integration is nearly complete, removing a significant
overhang on the stock. The bank's best-in-class asset quality (GNPA < 1.3%),
consistent 18%+ ROE, and India's long-term credit penetration story make this
a core holding for any India-focused portfolio.

Key Metrics:
  Market Cap:   ₹12,80,000 Cr
  NII (TTM):    ₹1,10,000 Cr (+15% YoY)
  Net Margin:   24.3%
  P/BV:         2.8x
  GNPA:         1.26%

Strengths:
  ✓ Best asset quality among large-cap Indian banks
  ✓ Merger synergies now flowing through P&L
  ✓ 8,700+ branches — unmatched distribution
  ✓ Digital banking leader (80M+ app users)

Risks:
  ⚠ Credit growth moderation in high-rate environment
  ⚠ NIM compression from merger deposit cost legacy
  ⚠ Large market cap limits upside vs. mid-cap peers
```

---

## 🔧 What I Would Improve With More Time

### Immediate (Next 2 weeks)
1. **Real-time stock price charts** — integrate live WebSocket price feed from NSE/BSE
2. **DCF Valuation Model** — calculate intrinsic value and margin of safety
3. **Peer comparison** — automatically research top 3 competitors side-by-side
4. **Export to PDF** — one-click research report download

### Medium-term (1–2 months)
5. **Portfolio tracker** — track multiple stocks, aggregate verdicts, P&L
6. **Email/WhatsApp alerts** — notify when verdict changes (WATCH → INVEST)
7. **Hindi language support** — for Indian retail investors
8. **Backtesting** — validate past INVEST verdicts against actual stock performance

### Architecture improvements
9. **Redis caching** — cache research for 6 hours, drastically reducing API calls
10. **Background jobs** — auto-refresh research on portfolio stocks nightly
11. **Fine-tuned verdict model** — train on historical analyst reports + stock outcomes

---

## 💬 LLM Chat Transcript (Build Log)

This project was built entirely using **Google Antigravity (Gemini)** as the AI coding assistant. Below are key excerpts from the build conversation showing the thought process:

---

**[Session Start — Architecture Planning]**

> **Me:** Build an AI Investment Research Agent: it takes a company name, does its research, and decides whether to invest or pass — with the reasoning behind its decision.

> **Antigravity:** I'll plan a LangGraph-based 6-node pipeline: QueryPlanner → WebResearcher → FinancialFetcher → NewsSentiment → Synthesizer → VerdictEngine. Each node streams progress via SSE. Let me create the implementation plan...

> *[Created implementation_plan.md with full architecture, API choices, and tech stack decisions]*

---

**[Database Setup]**

> **Me:** I have added the api keys... postgres connection info: localhost:5432

> **Antigravity:** I'll update the DATABASE_URL and create the research_sessions table. I also need to add dual-mode DB support — standard `pg` for local and `@neondatabase/serverless` for cloud...

> *[Updated lib/db/index.ts with lazy initialization and auto-detection]*

---

**[Debugging: Next.js 16 params error]**

> **Antigravity:** Found it — in Next.js 16, dynamic route `params` is now a Promise. Fixing by importing `use` from React and calling `use(params)` to unwrap it synchronously inside the client component...

> *[Fixed app/research/[company]/page.tsx line 21]*

---

**[Debugging: Wrong LLM being called]**

> **Me:** Failed to plan research: Error: 401 Incorrect API key provided: your_ope***here

> **Antigravity:** The issue is the fallback logic — Gemini fails (model not found), then it falls back to OpenAI which has a placeholder key. Fix 1: update model from `gemini-1.5-pro` to `gemini-2.0-flash`. Fix 2: guard the OpenAI fallback behind a key-presence check...

---

**[Gemini API Key Format Discovery]**

> **Me:** The format of Google AI Studio API keys has changed — Google is transitioning from AIza keys to AQ. keys

> **Antigravity:** [Research confirmed] You're right — as of June 19, 2026, Google began blocking requests from unrestricted Standard (AIza) keys. The new AQ. format requires either a Bearer token or x-goog-api-key header. Switching to @google/genai SDK which natively supports the new format...

> *[Installed @google/genai, rewrote llm.ts with model cascade: gemini-2.0-flash → gemini-1.5-flash → gemini-1.5-flash-8b → OpenAI fallback]*

---

**[Adding Charts]**

> **Me:** help me in fixing the error and add the graphical analysis of the investment/stocks

> **Antigravity:** Two bugs in demo mode — mock data schemas don't match node expectations. queryPlanner expects `searchQueries[]` not `queries[]`. newsSentimentNode expects `articles[]` with index/sentiment/sentimentScore/summary. Also installing recharts for 4 charts: 52W price area chart, revenue/profit bar chart, net margin trend, and radar scorecard with AI confidence ring...

---

**Full transcript available at:** The complete build session log is preserved in the git commit history and covers 400+ messages over the full development session.

---

## 📁 Project Structure

```
alphaagent/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── globals.css                 # Dark premium styling
│   ├── layout.tsx                  # App layout
│   ├── research/[company]/
│   │   └── page.tsx                # Live research results page (SSE)
│   ├── history/
│   │   └── page.tsx                # Past research sessions
│   └── api/
│       ├── research/route.ts       # SSE streaming API endpoint
│       └── history/route.ts        # History CRUD API
├── components/
│   ├── AgentStream.tsx             # Live node execution visualization
│   ├── VerdictCard.tsx             # INVEST/PASS/WATCH display
│   ├── FinancialMetrics.tsx        # Financial KPI grid
│   ├── NewsSentiment.tsx           # News articles + sentiment bars
│   ├── ResearchReport.tsx          # Full markdown research report
│   └── StockChart.tsx              # 4-panel graphical analysis
├── lib/
│   ├── agent/
│   │   ├── graph.ts                # LangGraph pipeline definition
│   │   ├── llm.ts                  # Gemini + OpenAI client (with cascade)
│   │   ├── mock.ts                 # Demo mode mock data
│   │   ├── state.ts                # Agent state type definitions
│   │   └── nodes/
│   │       ├── queryPlanner.ts     # Node 1: Company + query planning
│   │       ├── webResearcher.ts    # Node 2: Tavily web search
│   │       ├── financialFetcher.ts # Node 3: Yahoo Finance data
│   │       ├── newsSentiment.ts    # Node 4: NewsAPI + LLM sentiment
│   │       ├── synthesizer.ts      # Node 5: Full research report
│   │       └── verdictEngine.ts    # Node 6: Investment verdict
│   ├── db/
│   │   ├── index.ts                # Dual-mode DB (pg / neon)
│   │   └── schema.ts               # Drizzle schema
│   └── store.ts                    # In-memory session store
├── types/
│   └── research.ts                 # TypeScript types
├── .env.local                      # Environment variables (not committed)
├── drizzle.config.ts               # DB migration config
└── next.config.ts                  # Next.js + Turbopack config
```

---

## 🛡️ Security Notes

- `.env.local` is in `.gitignore` — API keys are never committed
- Database password is URL-encoded in `DATABASE_URL`
- The new Google `AQ.` key format provides enhanced security over legacy `AIza` keys
- All API calls are server-side only — keys never exposed to browser

---

## 📜 License

MIT — Built for the InsideIIM × Altuni AI Labs internship assignment.

---

*Built with ❤️ using Google Antigravity AI, LangGraph, Next.js, and too much chai ☕*
