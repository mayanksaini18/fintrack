'use client';

import { useTheme } from './ThemeProvider';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      className="h-7 w-7 text-zinc-500 hover:text-zinc-900 dark:text-white/40 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.06] rounded-md"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Sun className="w-3.5 h-3.5" />
      ) : (
        <Moon className="w-3.5 h-3.5" />
      )}
    </Button>
  );
}
