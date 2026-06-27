'use client';

import { NewsItem, SentimentScore } from '@/types/research';
import { Newspaper, ExternalLink } from 'lucide-react';

interface NewsSentimentProps {
  newsItems?: NewsItem[];
  sentiment?: SentimentScore;
  isLoading: boolean;
}

function SentimentBar({ sentiment }: { sentiment: SentimentScore }) {
  const total = sentiment.positiveCount + sentiment.neutralCount + sentiment.negativeCount || 1;
  const positivePct = (sentiment.positiveCount / total) * 100;
  const neutralPct = (sentiment.neutralCount / total) * 100;
  const negativePct = (sentiment.negativeCount / total) * 100;

  const overallColor =
    sentiment.label === 'Very Positive' || sentiment.label === 'Positive'
      ? 'text-emerald-400'
      : sentiment.label === 'Very Negative' || sentiment.label === 'Negative'
      ? 'text-red-400'
      : 'text-yellow-400';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500">Overall Sentiment</span>
        <span className={`text-xs font-semibold ${overallColor}`}>{sentiment.label}</span>
      </div>
      {/* Stacked sentiment bar */}
      <div className="h-2 rounded-full overflow-hidden flex">
        <div className="bg-emerald-500 transition-all" style={{ width: `${positivePct}%` }} />
        <div className="bg-zinc-600 transition-all" style={{ width: `${neutralPct}%` }} />
        <div className="bg-red-500 transition-all" style={{ width: `${negativePct}%` }} />
      </div>
      <div className="flex justify-between text-xs text-zinc-600">
        <span>🟢 {sentiment.positiveCount}</span>
        <span>🟡 {sentiment.neutralCount}</span>
        <span>🔴 {sentiment.negativeCount}</span>
      </div>
    </div>
  );
}

function NewsCard({ item }: { item: NewsItem }) {
  const badgeClass =
    item.sentiment === 'positive'
      ? 'badge-positive'
      : item.sentiment === 'negative'
      ? 'badge-negative'
      : 'badge-neutral';

  const badgeLabel =
    item.sentiment === 'positive' ? 'Positive' : item.sentiment === 'negative' ? 'Negative' : 'Neutral';

  const timeAgo = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const diff = (Date.now() - date.getTime()) / 1000;
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      return `${Math.floor(diff / 86400)}d ago`;
    } catch {
      return '';
    }
  };

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-3 rounded-xl border border-white/05 hover:border-white/10 hover:bg-white/02 transition-all group"
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0 ${badgeClass}`}>
          {badgeLabel}
        </span>
        <ExternalLink className="w-3 h-3 text-zinc-700 group-hover:text-zinc-500 transition-colors shrink-0 mt-0.5" />
      </div>
      <p className="text-xs text-zinc-300 leading-snug mb-1.5 line-clamp-2">{item.title}</p>
      <p className="text-xs text-zinc-600 leading-snug line-clamp-2">{item.summary}</p>
      <div className="flex items-center gap-2 mt-2 text-xs text-zinc-600">
        <span>{item.source}</span>
        <span>·</span>
        <span>{timeAgo(item.publishedAt)}</span>
      </div>
    </a>
  );
}

export default function NewsSentiment({ newsItems, sentiment, isLoading }: NewsSentimentProps) {
  if (isLoading) {
    return (
      <div className="glass-card p-4 space-y-3">
        <div className="h-5 w-32 shimmer rounded" />
        <div className="h-12 shimmer rounded-xl" />
        {Array(3).fill(0).map((_, i) => (
          <div key={i} className="h-20 shimmer rounded-xl" />
        ))}
      </div>
    );
  }

  if (!newsItems && !sentiment) return null;

  return (
    <div className="glass-card p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Newspaper className="w-4 h-4 text-indigo-400" />
        <h2 className="text-sm font-semibold text-white">News & Sentiment</h2>
        {newsItems && (
          <span className="ml-auto text-xs text-zinc-600">{newsItems.length} articles</span>
        )}
      </div>

      {/* Sentiment overview */}
      {sentiment && (
        <div className="p-3 rounded-xl bg-white/03 border border-white/06">
          <SentimentBar sentiment={sentiment} />
        </div>
      )}

      {/* News list */}
      {newsItems && newsItems.length > 0 ? (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {newsItems.map((item, i) => (
            <NewsCard key={i} item={item} />
          ))}
        </div>
      ) : (
        <p className="text-xs text-zinc-600 text-center py-4">No recent news found</p>
      )}
    </div>
  );
}
