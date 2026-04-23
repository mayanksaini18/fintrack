'use client';

import InsightsPanel from '@/components/insights/InsightsPanel';
import AIInsights from '@/components/insights/AIInsights';

export default function InsightsPage() {
  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Insights</h1>
        <p className="text-xs text-zinc-400 dark:text-white/35 mt-0.5">Smart observations derived from your financial data.</p>
      </div>
      <AIInsights />
      <InsightsPanel />
    </div>
  );
}
