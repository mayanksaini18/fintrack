import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center lg:text-left">
        <div className="flex items-center justify-center lg:justify-start gap-2.5 mb-6 lg:hidden">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-white flex items-center justify-center">
            <div className="w-3 h-3 rounded-sm bg-white dark:bg-zinc-900" />
          </div>
          <span className="text-lg font-semibold text-zinc-900 dark:text-white tracking-tight">FinTrack</span>
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Welcome back
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1.5 text-sm">
          Sign in to your account to continue tracking your finances
        </p>
      </div>
      <SignIn
        appearance={{
          elements: {
            rootBox: 'w-full',
            cardBox: 'w-full shadow-none',
            card: 'w-full shadow-none bg-transparent p-0',
            headerTitle: 'hidden',
            headerSubtitle: 'hidden',
            socialButtonsBlockButton: 'border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl h-11 transition-colors',
            socialButtonsBlockButtonText: 'text-sm font-medium',
            dividerLine: 'bg-zinc-200 dark:bg-zinc-800',
            dividerText: 'text-zinc-400 text-xs',
            formFieldLabel: 'text-zinc-700 dark:text-zinc-300 text-sm font-medium',
            formFieldInput: 'border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl h-11 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500',
            formButtonPrimary: 'bg-zinc-900 dark:bg-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-xl h-11 text-sm font-semibold transition-colors shadow-none',
            footerAction: 'text-sm',
            footerActionLink: 'text-emerald-600 dark:text-emerald-400 font-medium hover:text-emerald-700',
            footer: 'bg-transparent',
            identityPreview: 'border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-900',
            formFieldAction: 'text-emerald-600 dark:text-emerald-400 text-xs font-medium',
            alert: 'rounded-xl',
          },
        }}
      />
    </div>
  );
}
