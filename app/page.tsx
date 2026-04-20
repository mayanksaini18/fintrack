import Link from 'next/link';
import { ArrowRight, BarChart3, PieChart, Target, CalendarClock, Sparkles, Shield } from 'lucide-react';

const features = [
  {
    icon: BarChart3,
    title: 'Track Everything',
    description: 'Log income and expenses with categories, dates, and descriptions. Import bank CSV statements instantly.',
  },
  {
    icon: PieChart,
    title: 'Visual Analytics',
    description: 'Interactive charts showing spending breakdown, monthly trends, and balance over time.',
  },
  {
    icon: Target,
    title: 'Budget Goals',
    description: 'Set monthly limits per category. Get visual alerts when you approach or exceed your budget.',
  },
  {
    icon: CalendarClock,
    title: 'Recurring Tracking',
    description: 'Auto-track rent, subscriptions, EMIs, and salary. Never miss a recurring transaction.',
  },
  {
    icon: Sparkles,
    title: 'AI Insights',
    description: 'Get personalized, data-driven financial advice powered by AI analysis of your spending patterns.',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Your data is yours. Authenticated access with Clerk, stored securely in Neon Postgres.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 sm:px-10 h-16 border-b border-zinc-100 dark:border-zinc-900">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-zinc-900 dark:bg-white flex items-center justify-center">
            <div className="w-3 h-3 rounded-sm bg-white dark:bg-zinc-900" />
          </div>
          <span className="text-base font-bold text-zinc-900 dark:text-white tracking-tight">Kharcha</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/sign-in"
            className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-zinc-900 dark:bg-white dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
          >
            Get started
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-6 sm:px-10 pt-20 pb-24 sm:pt-28 sm:pb-32 text-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(16,185,129,0.08)_0%,_transparent_70%)]" />
        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-medium mb-6 border border-emerald-200/60 dark:border-emerald-800/40">
            <Sparkles className="w-3 h-3" />
            Now with AI-powered insights
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-zinc-900 dark:text-white tracking-tight leading-tight">
            Your finances,
            <br />
            <span className="text-emerald-600 dark:text-emerald-400">crystal clear</span>
          </h1>
          <p className="mt-5 text-base sm:text-lg text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Track expenses, set budgets, and get AI-powered insights — all in one clean dashboard built for Indians.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20"
            >
              Start for free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 sm:px-10 py-20 bg-zinc-50 dark:bg-zinc-900/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white">
              Everything you need to manage money
            </h2>
            <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto">
              Simple yet powerful tools to understand where your money goes and make smarter decisions.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-6 hover:shadow-lg hover:shadow-zinc-900/5 dark:hover:shadow-black/20 transition-shadow"
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-1.5">{feature.title}</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 sm:px-10 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white">
            Start tracking today
          </h2>
          <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
            Free to use. No credit card required. Takes 30 seconds to get started.
          </p>
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 mt-6 px-8 py-3 text-sm font-semibold text-white bg-zinc-900 dark:bg-white dark:text-zinc-900 rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
          >
            Create free account
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 sm:px-10 py-6 border-t border-zinc-100 dark:border-zinc-900">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-zinc-900 dark:bg-white flex items-center justify-center">
              <div className="w-2 h-2 rounded-sm bg-white dark:bg-zinc-900" />
            </div>
            <span className="text-xs font-semibold text-zinc-500">Kharcha</span>
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-600">
            Built with Next.js, Neon, and Claude AI
          </p>
        </div>
      </footer>
    </div>
  );
}
