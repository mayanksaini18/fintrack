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
  { href: '/dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/transactions', label: 'Transactions', icon: Receipt },
  { href: '/recurring',    label: 'Recurring',    icon: CalendarClock },
  { href: '/budgets',      label: 'Budgets',      icon: Target },
  { href: '/insights',     label: 'Insights',     icon: TrendingUp },
  { href: '/ai-chat',      label: 'AI Chat',      icon: MessageSquareText },
];

const pageMeta: Record<string, { title: string; sub: string }> = {
  '/dashboard':    { title: 'Dashboard',    sub: 'Your financial overview' },
  '/transactions': { title: 'Transactions', sub: 'All income & expenses' },
  '/insights':     { title: 'Insights',     sub: 'AI-powered analysis' },
  '/recurring':    { title: 'Recurring',    sub: 'Scheduled payments' },
  '/budgets':      { title: 'Budgets',      sub: 'Spending limits' },
  '/ai-chat':      { title: 'AI Chat',      sub: 'Kharcha AI assistant' },
};

export default function Header() {
  const pathname = usePathname();
  const meta = pageMeta[pathname] ?? { title: 'Kharcha', sub: '' };
  const { isSignedIn } = useUser();

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between h-[60px] px-6 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200/60 dark:border-zinc-800/60 transition-colors duration-200">
      <div className="flex items-center gap-4">
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
          <SheetContent side="left" className="p-0 w-[228px] bg-[#0d0d18] border-r-0">
            <div className="flex items-center gap-3 px-5 h-[60px] border-b border-white/[0.06]">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                <Logo size={18} />
              </div>
              <span className="text-sm font-semibold text-white tracking-tight">Kharcha</span>
            </div>
            <nav className="px-3 py-4 space-y-0.5">
              {navItems.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + '/');
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150',
                      active
                        ? 'bg-gradient-to-r from-indigo-500/20 to-violet-500/10 text-white font-medium'
                        : 'text-white/40 hover:text-white/80 hover:bg-white/[0.05]'
                    )}
                  >
                    <div className={cn(
                      'w-7 h-7 rounded-lg flex items-center justify-center',
                      active ? 'bg-gradient-to-br from-indigo-500 to-violet-600' : 'bg-white/[0.06]'
                    )}>
                      <Icon className={cn('w-3.5 h-3.5', active ? 'text-white' : 'text-white/60')} />
                    </div>
                    {label}
                  </Link>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>

        <div>
          <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-none">{meta.title}</h1>
          {meta.sub && <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">{meta.sub}</p>}
        </div>
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
              <Button size="sm" className="h-8 text-xs bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white border-0 shadow-md shadow-indigo-500/20">
                Sign up
              </Button>
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
