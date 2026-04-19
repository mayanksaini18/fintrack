export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 bg-zinc-900 dark:bg-zinc-950 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-transparent to-blue-500/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(16,185,129,0.15)_0%,_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(59,130,246,0.15)_0%,_transparent_50%)]" />
        <div className="relative z-10 max-w-md px-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
              <div className="w-4 h-4 rounded-md bg-zinc-900" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">FinTrack</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Take control of your finances
          </h2>
          <p className="text-zinc-400 text-base leading-relaxed">
            Track expenses, analyze spending patterns, and get AI-powered insights to make smarter financial decisions.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4 text-center">
            <div className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10">
              <div className="text-2xl font-bold text-emerald-400">100%</div>
              <div className="text-xs text-zinc-500 mt-1">Free to use</div>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10">
              <div className="text-2xl font-bold text-blue-400">Smart</div>
              <div className="text-xs text-zinc-500 mt-1">AI insights</div>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10">
              <div className="text-2xl font-bold text-purple-400">Safe</div>
              <div className="text-xs text-zinc-500 mt-1">Bank-level</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex w-full lg:w-1/2 items-center justify-center px-4 sm:px-8 bg-white dark:bg-zinc-950">
        {children}
      </div>
    </div>
  );
}
