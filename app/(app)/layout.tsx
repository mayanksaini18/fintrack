import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen lg:flex relative">
      {/* Ambient glow orbs — dark mode only */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10 hidden dark:block">
        <div className="absolute -top-48 -left-48 w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute top-1/2 -right-48 w-[500px] h-[500px] rounded-full bg-blue-600/8 blur-[120px]" />
        <div className="absolute -bottom-32 left-1/3 w-[400px] h-[400px] rounded-full bg-violet-500/8 blur-[100px]" />
      </div>

      <Sidebar />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 px-4 py-6 sm:px-6 pb-24 lg:pb-6">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
