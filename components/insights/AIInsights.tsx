'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, RefreshCw } from 'lucide-react';

export default function AIInsights() {
  const [insights, setInsights] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchInsights() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai-insights');
      if (!res.ok) throw new Error('Failed to fetch insights');
      const data = await res.json();
      setInsights(data.insights);
    } catch {
      setError('Could not generate insights. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200/80 dark:border-white/[0.08] bg-white dark:glass overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 dark:border-white/[0.06] bg-gradient-to-r from-zinc-50 to-zinc-50 dark:from-white/[0.03] dark:to-white/[0.03]">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-zinc-100 dark:bg-white/[0.08] flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-300" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">AI Insights</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchInsights}
          disabled={loading}
          className="h-7 text-xs gap-1.5 text-zinc-600 dark:text-zinc-300 hover:text-zinc-800 hover:bg-zinc-100 dark:hover:bg-white/[0.06]"
        >
          {loading ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          {insights ? 'Refresh' : 'Generate'}
        </Button>
      </div>

      <div className="px-5 py-4">
        {!insights && !loading && !error && (
          <div className="text-center py-6">
            <Sparkles className="w-8 h-8 text-zinc-200 dark:text-zinc-700 mx-auto mb-2" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Click Generate to get AI-powered analysis of your spending
            </p>
          </div>
        )}

        {loading && (
          <div className="space-y-3 py-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700 mt-2 shrink-0 animate-pulse" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" style={{ width: `${70 + i * 5}%` }} />
                  <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" style={{ width: `${40 + i * 10}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <p className="text-sm text-rose-600 dark:text-rose-400 py-2">{error}</p>
        )}

        {insights && !loading && (
          <div className="prose prose-sm prose-zinc dark:prose-invert max-w-none [&_ul]:space-y-2 [&_li]:text-sm [&_li]:leading-relaxed [&_strong]:text-zinc-900 dark:[&_strong]:text-zinc-100">
            <div dangerouslySetInnerHTML={{ __html: formatMarkdown(insights) }} />
          </div>
        )}
      </div>
    </div>
  );
}

function formatMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.*?)$/gm, '<li>$1</li>')
    .replace(/^• (.*?)$/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]*<\/li>)/, '<ul>$1</ul>')
    .replace(/\n/g, '<br/>');
}
