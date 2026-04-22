'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Receipt, Target, TrendingUp, MessageSquareText } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transactions', icon: Receipt },
  { href: '/budgets', label: 'Budgets', icon: Target },
  { href: '/insights', label: 'Insights', icon: TrendingUp },
  { href: '/ai-chat', label: 'AI Chat', icon: MessageSquareText },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-zinc-950 border-t border-zinc-200/80 dark:border-zinc-800/60 flex items-center justify-around px-2 pb-safe">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + '/');
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-col items-center gap-0.5 px-3 py-2.5 rounded-lg transition-colors min-w-0',
              active ? 'text-zinc-900 dark:text-white' : 'text-zinc-400 dark:text-zinc-600'
            )}
          >
            <Icon className="w-5 h-5 shrink-0" />
            <span className="text-[10px] font-medium truncate">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
