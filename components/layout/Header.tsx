'use client';

import { usePathname } from 'next/navigation';
import RoleSwitcher from './RoleSwitcher';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import Logo from '@/components/Logo';
import { LayoutDashboard, Receipt, TrendingUp, CalendarClock, Target, MessageSquareText } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { UserButton, useUser } from '@clerk/nextjs';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transactions', icon: Receipt },
  { href: '/recurring', label: 'Recurring', icon: CalendarClock },
  { href: '/budgets', label: 'Budgets', icon: Target },
  { href: '/insights', label: 'Insights', icon: TrendingUp },
  { href: '/ai-chat', label: 'AI Chat', icon: MessageSquareText },
];

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/transactions': 'Transactions',
  '/insights': 'Insights',
  '/recurring': 'Recurring',
  '/budgets': 'Budgets',
  '/ai-chat': 'AI Chat',
};

export default function Header() {
  const pathname = usePathname();
  const title = pageTitles[pathname] ?? 'Kharcha';
  const { isSignedIn } = useUser();

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between h-[52px] px-6 bg-zinc-50/90 dark:bg-[#09090c]/80 dark:backdrop-blur-2xl border-b border-zinc-200/60 dark:border-white/[0.06] transition-colors duration-200">
      <div className="flex items-center gap-3">
        {/* Mobile menu */}
        <Sheet>
          <SheetTrigger
            render={
              <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8 text-zinc-500 hover:text-zinc-900">
                <Menu className="w-4 h-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            }
          />
          <SheetContent side="left" className="p-0 w-[220px] bg-white dark:bg-[#09090c]/95 dark:backdrop-blur-2xl border-r border-zinc-200/80 dark:border-white/[0.06]">
            <div className="flex items-center gap-2.5 px-5 h-[52px] border-b border-zinc-200/80 dark:border-white/[0.06]">
              <Logo size={22} />
              <span className="text-sm font-semibold text-zinc-900 dark:text-white tracking-tight">Kharcha</span>
            </div>
            <nav className="px-2.5 py-4 space-y-0.5">
              {navItems.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + '/');
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150',
                      active
                        ? 'bg-zinc-100 dark:bg-violet-500/15 dark:border dark:border-violet-500/20 text-zinc-900 dark:text-violet-200 font-medium'
                        : 'text-zinc-500 dark:text-white/40 hover:text-zinc-900 dark:hover:text-white/80 hover:bg-zinc-50 dark:hover:bg-white/[0.05]'
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {label}
                  </Link>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>
        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{title}</span>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        {isSignedIn ? (
          <>
            <RoleSwitcher />
            <UserButton />
          </>
        ) : (
          <>
            <Link href="/sign-in">
              <Button variant="ghost" size="sm" className="h-8 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
                Sign in
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm" className="h-8 text-xs bg-zinc-900 hover:bg-zinc-800 dark:bg-violet-600 dark:hover:bg-violet-500 text-white">
                Sign up
              </Button>
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
