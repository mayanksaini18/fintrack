'use client';

import InsightsPanel from '@/components/insights/InsightsPanel';

export default function InsightsPage() {
  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <p className="text-xs text-zinc-400">Smart observations derived from your financial data.</p>
      <InsightsPanel />
    </div>
  );
}
