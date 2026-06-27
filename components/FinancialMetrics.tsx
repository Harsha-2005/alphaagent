'use client';

import { FinancialData } from '@/types/research';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { DollarSign, TrendingUp, Activity, Scale } from 'lucide-react';

interface FinancialMetricsProps {
  data?: FinancialData;
  revenueHistory?: { period: string; value: number }[];
  isLoading: boolean;
}

function MetricItem({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="metric-card">
      <div className="text-xs text-zinc-500 mb-1">{label}</div>
      <div className="text-sm font-semibold text-white">{value}</div>
      {sub && <div className="text-xs text-zinc-600 mt-0.5">{sub}</div>}
    </div>
  );
}

function formatValue(v?: number, prefix = '', suffix = '', divBy = 1, decimals = 1): string {
  if (v == null) return '—';
  return `${prefix}${(v / divBy).toFixed(decimals)}${suffix}`;
}

function formatLargeNumber(v?: number, currency = ''): string {
  if (v == null) return '—';
  if (Math.abs(v) >= 1e12) return `${currency}${(v / 1e12).toFixed(2)}T`;
  if (Math.abs(v) >= 1e9) return `${currency}${(v / 1e9).toFixed(2)}B`;
  if (Math.abs(v) >= 1e6) return `${currency}${(v / 1e6).toFixed(1)}M`;
  return `${currency}${v.toFixed(0)}`;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="glass-card px-3 py-2 text-xs">
        <p className="text-zinc-400">{label}</p>
        <p className="text-white font-medium">{formatLargeNumber(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

export default function FinancialMetrics({ data, revenueHistory, isLoading }: FinancialMetricsProps) {
  if (isLoading) {
    return (
      <div className="glass-card p-4 space-y-3">
        <div className="h-5 w-32 shimmer rounded" />
        <div className="grid grid-cols-2 gap-2">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="h-14 shimmer rounded-xl" />
          ))}
        </div>
        <div className="h-36 shimmer rounded-xl" />
      </div>
    );
  }

  if (!data) return null;

  const currency = data.currency || '';
  const currencySymbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : '';

  const chartData = revenueHistory?.map((h) => ({
    name: h.period,
    value: h.value,
  })) || [];

  const analystColor = data.analystRating === 'buy' || data.analystRating === 'strongBuy'
    ? 'text-emerald-400' : data.analystRating === 'sell' || data.analystRating === 'strongSell'
    ? 'text-red-400' : 'text-yellow-400';

  return (
    <div className="glass-card p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-indigo-400" />
        <h2 className="text-sm font-semibold text-white">Financial Metrics</h2>
      </div>

      {/* Current price */}
      {data.currentPrice && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-white/03 border border-white/06">
          <div>
            <div className="text-2xl font-bold text-white">
              {currencySymbol}{data.currentPrice.toFixed(2)}
            </div>
            <div className="text-xs text-zinc-500 mt-0.5">{data.ticker} · {data.exchange}</div>
          </div>
          {data.week52High && data.week52Low && (
            <div className="text-right">
              <div className="text-xs text-zinc-500 mb-1">52W Range</div>
              <div className="text-xs text-zinc-300">
                {currencySymbol}{data.week52Low.toFixed(0)} — {currencySymbol}{data.week52High.toFixed(0)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-2">
        <MetricItem
          label="Market Cap"
          value={formatLargeNumber(data.marketCap, currencySymbol)}
        />
        <MetricItem
          label="P/E Ratio"
          value={formatValue(data.peRatio, '', 'x')}
          sub="Trailing"
        />
        <MetricItem
          label="Revenue (TTM)"
          value={formatLargeNumber(data.revenueAnnual, currencySymbol)}
        />
        <MetricItem
          label="Revenue Growth"
          value={formatValue(data.revenueGrowthYoY, '', '%')}
          sub="Year-over-Year"
        />
        <MetricItem
          label="Net Margin"
          value={formatValue(data.netIncomeMargin, '', '%')}
        />
        <MetricItem
          label="EBITDA Margin"
          value={formatValue(data.ebitdaMargin, '', '%')}
        />
        <MetricItem
          label="Free Cash Flow"
          value={formatLargeNumber(data.freeCashFlow, currencySymbol)}
        />
        <MetricItem
          label="Debt/Equity"
          value={formatValue(data.debtToEquity, '', 'x')}
        />
        <MetricItem
          label="ROE"
          value={formatValue(data.returnOnEquity, '', '%')}
        />
        <MetricItem
          label="Beta"
          value={formatValue(data.beta)}
        />
      </div>

      {/* Analyst rating */}
      {data.analystRating && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-white/03 border border-white/06">
          <div>
            <div className="text-xs text-zinc-500 mb-1">Analyst Consensus</div>
            <div className={`text-sm font-semibold capitalize ${analystColor}`}>
              {data.analystRating.replace(/([A-Z])/g, ' $1').trim()}
            </div>
          </div>
          {data.priceTarget && (
            <div className="text-right">
              <div className="text-xs text-zinc-500 mb-1">Price Target</div>
              <div className="text-sm font-medium text-white">
                {currencySymbol}{data.priceTarget.toFixed(2)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Revenue chart */}
      {chartData.length > 1 && (
        <div>
          <div className="text-xs text-zinc-500 mb-3">Revenue History</div>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="name"
                tick={{ fill: '#71717a', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((_, index) => (
                  <Cell
                    key={index}
                    fill={index === chartData.length - 1 ? 'rgb(99,102,241)' : 'rgba(99,102,241,0.4)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
