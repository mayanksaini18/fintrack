import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
          Welcome back
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">
          Sign in to continue managing your finances
        </p>
      </div>
      <SignIn
        appearance={{
          elements: {
            rootBox: 'w-full',
            cardBox: 'w-full shadow-none',
            card: 'w-full shadow-none bg-transparent p-0 gap-4',
            headerTitle: 'hidden',
            headerSubtitle: 'hidden',
            socialButtonsBlockButton: 'border border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-white/[0.04] hover:bg-zinc-100 dark:hover:bg-white/[0.08] text-zinc-700 dark:text-zinc-300 rounded-xl h-11 transition-colors',
            socialButtonsBlockButtonText: 'text-sm font-medium',
            dividerLine: 'bg-zinc-200 dark:bg-white/10',
            dividerText: 'text-zinc-400 dark:text-white/30 text-xs uppercase tracking-wider',
            formFieldLabel: 'text-zinc-700 dark:text-zinc-300 text-sm font-medium',
            formFieldInput: 'border border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-white/[0.04] rounded-xl h-11 text-zinc-900 dark:text-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/50 transition-all',
            formButtonPrimary: 'bg-violet-600 hover:bg-violet-700 rounded-xl h-11 text-sm font-semibold transition-colors shadow-none text-white',
            footerAction: 'text-sm',
            footerActionLink: 'text-violet-600 dark:text-violet-400 font-medium hover:text-violet-700',
            footer: 'bg-transparent',
            identityPreview: 'border border-zinc-200 dark:border-white/[0.08] rounded-xl bg-zinc-50 dark:bg-white/[0.04]',
            formFieldAction: 'text-violet-600 dark:text-violet-400 text-xs font-medium',
            alert: 'rounded-xl',
            otpCodeFieldInput: 'border border-zinc-200 dark:border-zinc-800 rounded-lg',
          },
        }}
      />
    </div>
  );
}
