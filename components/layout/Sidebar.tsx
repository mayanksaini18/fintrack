'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Receipt, TrendingUp, CalendarClock, Target, MessageSquareText } from 'lucide-react';
import { cn } from '@/lib/utils';
import Logo from '@/components/Logo';
import { useUser, UserButton } from '@clerk/nextjs';

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
  const { user, isSignedIn } = useUser();

  return (
    <aside className="hidden lg:flex flex-col w-[220px] min-h-screen bg-white dark:bg-[#0a0a0a]/90 dark:backdrop-blur-2xl border-r border-zinc-200/80 dark:border-white/[0.06] shrink-0 transition-colors duration-200">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 h-[52px] border-b border-zinc-200/80 dark:border-white/[0.06]">
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
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150',
                active
                  ? 'bg-zinc-100 dark:bg-white/[0.08] text-zinc-900 dark:text-white font-medium'
                  : 'text-zinc-500 dark:text-white/40 hover:text-zinc-900 dark:hover:text-white/80 hover:bg-zinc-50 dark:hover:bg-white/[0.05]'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom — user profile */}
      <div className="px-3 py-3 border-t border-zinc-200/80 dark:border-white/[0.06]">
        {isSignedIn ? (
          <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: 'w-7 h-7 rounded-full ring-1 ring-zinc-200 dark:ring-zinc-700',
                },
              }}
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">
                {user.fullName ?? user.username ?? 'Account'}
              </p>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate">
                {user.primaryEmailAddress?.emailAddress}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-[11px] text-zinc-400 dark:text-zinc-600 px-2">v1.0</p>
        )}
      </div>
    </aside>
  );
}
