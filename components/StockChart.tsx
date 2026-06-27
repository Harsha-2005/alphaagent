'use client';

import {
  AreaChart, Area, BarChart, Bar, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, ResponsiveContainer, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ReferenceLine,
} from 'recharts';

interface StockChartProps {
  companyName: string;
  ticker?: string;
  financialData?: any;
  verdict?: string;
  confidence?: number;
}

// Generate realistic mock price history (52 weeks)
function generatePriceHistory(basePrice: number, volatility = 0.02) {
  const data = [];
  let price = basePrice * 0.78; // start lower for uptrend
  const now = new Date();
  for (let i = 52; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i * 7);
    const change = (Math.random() - 0.46) * volatility * price;
    price = Math.max(price + change, 1);
    data.push({
      date: date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      price: parseFloat(price.toFixed(2)),
      volume: Math.round(1000000 + Math.random() * 5000000),
    });
  }
  return data;
}

function generateRevenueData() {
  return [
    { quarter: 'Q1 FY23', revenue: 4200, profit: 180, margin: 4.3 },
    { quarter: 'Q2 FY23', revenue: 4850, profit: 310, margin: 6.4 },
    { quarter: 'Q3 FY23', revenue: 5100, profit: 420, margin: 8.2 },
    { quarter: 'Q4 FY23', revenue: 5600, profit: 580, margin: 10.4 },
    { quarter: 'Q1 FY24', revenue: 6200, profit: 720, margin: 11.6 },
    { quarter: 'Q2 FY24', revenue: 6800, profit: 890, margin: 13.1 },
    { quarter: 'Q3 FY24', revenue: 7400, profit: 1050, margin: 14.2 },
    { quarter: 'Q4 FY24', revenue: 8100, profit: 1280, margin: 15.8 },
  ];
}

function generateScoreData(verdict: string) {
  const isInvest = verdict === 'INVEST';
  return [
    { metric: 'Revenue Growth',    score: isInvest ? 82 : 54 },
    { metric: 'Profitability',     score: isInvest ? 76 : 48 },
    { metric: 'Market Position',   score: isInvest ? 88 : 62 },
    { metric: 'Management',        score: isInvest ? 80 : 58 },
    { metric: 'Valuation',         score: isInvest ? 68 : 72 },
    { metric: 'Risk Profile',      score: isInvest ? 74 : 42 },
  ];
}

const CUSTOM_TOOLTIP_STYLE = {
  backgroundColor: 'rgba(9,9,11,0.95)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '8px',
  padding: '10px 14px',
  color: '#fff',
  fontSize: '12px',
};

export default function StockChart({ companyName, ticker, financialData, verdict = 'INVEST', confidence = 75 }: StockChartProps) {
  const basePrice = financialData?.currentPrice || 850;
  const priceData = generatePriceHistory(basePrice);
  const revenueData = generateRevenueData();
  const scoreData = generateScoreData(verdict);

  const currentPrice = priceData[priceData.length - 1].price;
  const startPrice = priceData[0].price;
  const priceChange = ((currentPrice - startPrice) / startPrice * 100).toFixed(1);
  const isPositive = parseFloat(priceChange) > 0;

  const verdictColor = verdict === 'INVEST' ? '#10b981' : verdict === 'PASS' ? '#ef4444' : '#f59e0b';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">📊 Graphical Analysis</h2>
          <p className="text-xs text-zinc-500 mt-0.5">{companyName}{ticker ? ` · ${ticker}` : ''} · Demo data for illustration</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${
            isPositive ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : 'text-red-400 border-red-500/30 bg-red-500/10'
          }`}>
            {isPositive ? '▲' : '▼'} {Math.abs(parseFloat(priceChange))}% (52W)
          </span>
        </div>
      </div>

      {/* Price Chart */}
      <div className="card p-4">
        <p className="text-xs text-zinc-400 font-medium mb-3 uppercase tracking-wide">52-Week Price Action</p>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={priceData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isPositive ? '#6366f1' : '#ef4444'} stopOpacity={0.3} />
                <stop offset="95%" stopColor={isPositive ? '#6366f1' : '#ef4444'} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 10 }} tickLine={false} interval={8} />
            <YAxis tick={{ fill: '#71717a', fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} formatter={(v: any) => [`₹${v}`, 'Price']} />
            <ReferenceLine y={startPrice} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" />
            <Area
              type="monotone" dataKey="price" stroke={isPositive ? '#6366f1' : '#ef4444'}
              strokeWidth={2} fill="url(#priceGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Revenue + Profit Chart */}
      <div className="card p-4">
        <p className="text-xs text-zinc-400 font-medium mb-3 uppercase tracking-wide">Revenue & Net Profit (₹ Cr)</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={revenueData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="quarter" tick={{ fill: '#71717a', fontSize: 10 }} tickLine={false} />
            <YAxis tick={{ fill: '#71717a', fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} formatter={(v: any, n: string) => [`₹${v} Cr`, n === 'revenue' ? 'Revenue' : 'Net Profit']} />
            <Legend wrapperStyle={{ fontSize: '11px', color: '#71717a' }} />
            <Bar dataKey="revenue" fill="rgba(99,102,241,0.7)" radius={[3, 3, 0, 0]} name="revenue" />
            <Bar dataKey="profit" fill="rgba(16,185,129,0.7)" radius={[3, 3, 0, 0]} name="profit" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Net Margin Trend */}
      <div className="card p-4">
        <p className="text-xs text-zinc-400 font-medium mb-3 uppercase tracking-wide">Net Margin Trend (%)</p>
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={revenueData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="marginGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="quarter" tick={{ fill: '#71717a', fontSize: 10 }} tickLine={false} />
            <YAxis tick={{ fill: '#71717a', fontSize: 10 }} tickLine={false} axisLine={false} unit="%" />
            <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} formatter={(v: any) => [`${v}%`, 'Net Margin']} />
            <Area type="monotone" dataKey="margin" stroke="#10b981" strokeWidth={2} fill="url(#marginGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Radar: Investment Scorecard */}
      <div className="card p-4">
        <p className="text-xs text-zinc-400 font-medium mb-1 uppercase tracking-wide">Investment Scorecard</p>
        <p className="text-xs text-zinc-600 mb-3">Multidimensional analysis across 6 key parameters</p>
        <div className="flex items-center gap-6">
          <div className="flex-1">
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={scoreData}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: '#71717a', fontSize: 10 }} />
                <Radar name="Score" dataKey="score" stroke={verdictColor} fill={verdictColor} fillOpacity={0.2} strokeWidth={2} />
                <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} formatter={(v: any) => [`${v}/100`, 'Score']} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          {/* Confidence meter */}
          <div className="flex flex-col items-center gap-2 min-w-[80px]">
            <p className="text-xs text-zinc-500 text-center">AI Confidence</p>
            <div className="relative w-16 h-16">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15.9" fill="none"
                  stroke={verdictColor} strokeWidth="3"
                  strokeDasharray={`${confidence} ${100 - confidence}`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
                {confidence}%
              </span>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color: verdictColor, backgroundColor: `${verdictColor}15`, border: `1px solid ${verdictColor}30` }}>
              {verdict}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
