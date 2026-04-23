'use client';

import { Component, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props { children: ReactNode; fallback?: ReactNode }
interface State { hasError: boolean; message: string }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error) {
    console.error('ErrorBoundary caught:', error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/10 dark:border dark:border-rose-500/20 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-800 dark:text-white/90">Something went wrong</p>
            <p className="text-xs text-zinc-400 dark:text-white/35 max-w-xs mt-1">{this.state.message}</p>
          </div>
          <button
            onClick={() => this.setState({ hasError: false, message: '' })}
            className="text-xs px-4 py-1.5 rounded-lg border border-zinc-200 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white/60 dark:hover:text-white/90 dark:hover:bg-white/[0.08] text-zinc-500 hover:text-zinc-700 transition-colors"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
