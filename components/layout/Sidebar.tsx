'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Receipt, TrendingUp, CalendarClock, Target, MessageSquareText } from 'lucide-react';
import { cn } from '@/lib/utils';
import Logo from '@/components/Logo';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transactions', icon: Receipt },
  { href: '/recurring', label: 'Recurring', icon: CalendarClock },
  { href: '/budgets', label: 'Budgets', icon: Target },
  { href: '/insights', label: 'Insights', icon: TrendingUp },
  { href: '/ai-chat', label: 'AI Chat', icon: MessageSquareText },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col w-[220px] min-h-screen bg-white dark:bg-zinc-950 border-r border-zinc-200/80 dark:border-zinc-800/60 shrink-0 transition-colors duration-200">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 h-[52px] border-b border-zinc-200/80 dark:border-zinc-800/60">
        <Logo size={22} />
        <span className="text-sm font-semibold text-zinc-900 dark:text-white tracking-tight">Kharcha</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2.5 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-100',
                active
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium'
                  : 'text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-5 py-4 border-t border-zinc-200/80 dark:border-zinc-800/60">
        <p className="text-[11px] text-zinc-400 dark:text-zinc-600">v1.0</p>
      </div>
    </aside>
  );
}
