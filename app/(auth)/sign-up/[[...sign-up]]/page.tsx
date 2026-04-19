import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
          Create your account
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">
          Start tracking expenses and get smart financial insights
        </p>
      </div>
      <SignUp
        appearance={{
          elements: {
            rootBox: 'w-full',
            cardBox: 'w-full shadow-none',
            card: 'w-full shadow-none bg-transparent p-0 gap-4',
            headerTitle: 'hidden',
            headerSubtitle: 'hidden',
            socialButtonsBlockButton: 'border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl h-11 transition-colors',
            socialButtonsBlockButtonText: 'text-sm font-medium',
            dividerLine: 'bg-zinc-200 dark:bg-zinc-800',
            dividerText: 'text-zinc-400 text-xs uppercase tracking-wider',
            formFieldLabel: 'text-zinc-700 dark:text-zinc-300 text-sm font-medium',
            formFieldInput: 'border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl h-11 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all',
            formButtonPrimary: 'bg-emerald-600 hover:bg-emerald-700 rounded-xl h-11 text-sm font-semibold transition-colors shadow-none text-white',
            footerAction: 'text-sm',
            footerActionLink: 'text-emerald-600 dark:text-emerald-400 font-medium hover:text-emerald-700',
            footer: 'bg-transparent',
            identityPreview: 'border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-800/50',
            formFieldAction: 'text-emerald-600 dark:text-emerald-400 text-xs font-medium',
            alert: 'rounded-xl',
            otpCodeFieldInput: 'border border-zinc-200 dark:border-zinc-800 rounded-lg',
          },
        }}
      />
    </div>
  );
}
