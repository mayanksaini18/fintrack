import Logo from '@/components/Logo';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4 py-12 overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

      {/* Gradient blobs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-400/20 dark:bg-emerald-500/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-400/20 dark:bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-400/10 dark:bg-violet-500/5 rounded-full blur-3xl" />

      {/* Floating finance icons */}
      <div className="absolute top-[12%] left-[8%] text-4xl opacity-20 dark:opacity-10 animate-bounce" style={{ animationDuration: '4s' }}>💰</div>
      <div className="absolute top-[20%] right-[12%] text-3xl opacity-20 dark:opacity-10 animate-bounce" style={{ animationDuration: '5s', animationDelay: '1s' }}>📊</div>
      <div className="absolute bottom-[18%] left-[15%] text-3xl opacity-20 dark:opacity-10 animate-bounce" style={{ animationDuration: '6s', animationDelay: '2s' }}>🏦</div>
      <div className="absolute bottom-[25%] right-[10%] text-4xl opacity-20 dark:opacity-10 animate-bounce" style={{ animationDuration: '4.5s', animationDelay: '0.5s' }}>📈</div>
      <div className="absolute top-[45%] left-[5%] text-2xl opacity-15 dark:opacity-10 animate-bounce" style={{ animationDuration: '5.5s', animationDelay: '1.5s' }}>💳</div>
      <div className="absolute top-[10%] right-[30%] text-2xl opacity-15 dark:opacity-10 animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '0.8s' }}>🪙</div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <Logo size={40} />
          <span className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Kharcha</span>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-xl shadow-zinc-900/5 dark:shadow-black/20 p-8">
          {children}
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-zinc-400 dark:text-zinc-600">
          Track expenses · Analyze spending · Get smart insights
        </p>
      </div>
    </div>
  );
}
