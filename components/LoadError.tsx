'use client';

import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Shown instead of an empty state when loading failed, so an empty list isn't mistaken for no data
export default function LoadError({ what, onRetry }: { what: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <AlertTriangle className="w-8 h-8 text-amber-500" />
      <p className="text-sm text-zinc-600 dark:text-zinc-300">Couldn&apos;t load your {what}.</p>
      <Button variant="outline" size="sm" className="h-8 text-xs" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
