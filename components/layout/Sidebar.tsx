'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Receipt, TrendingUp, CalendarClock,
  Target, MessageSquareText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Logo from '@/components/Logo';

const navItems = [
  { href: '/dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/transactions', label: 'Transactions', icon: Receipt },
  { href: '/recurring',    label: 'Recurring',    icon: CalendarClock },
  { href: '/budgets',      label: 'Budgets',      icon: Target },
  { href: '/insights',     label: 'Insights',     icon: TrendingUp },
  { href: '/ai-chat',      label: 'AI Chat',      icon: MessageSquareText },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-[228px] min-h-screen bg-[#0d0d18] shrink-0">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 h-[60px] border-b border-white/[0.06]">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <Logo size={18} />
        </div>
        <span className="text-sm font-semibold text-white tracking-tight">Kharcha</span>
      </div>

      {/* Nav label */}
      <div className="px-5 pt-6 pb-2">
        <p className="text-[10px] font-semibold text-white/25 uppercase tracking-[0.12em]">Menu</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 group',
                active
                  ? 'bg-gradient-to-r from-indigo-500/20 to-violet-500/10 text-white font-medium'
                  : 'text-white/40 hover:text-white/80 hover:bg-white/[0.05]'
              )}
            >
              <div className={cn(
                'w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150',
                active
                  ? 'bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-500/40'
                  : 'bg-white/[0.06] group-hover:bg-white/10'
              )}>
                <Icon className={cn('w-3.5 h-3.5', active ? 'text-white' : 'text-white/60')} />
              </div>
              {label}
              {active && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-5 py-5 border-t border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <p className="text-[11px] text-white/25">v1.0 · All systems go</p>
        </div>
      </div>
    </aside>
  );
}
