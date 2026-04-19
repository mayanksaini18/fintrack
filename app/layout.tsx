import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";

import "@/app/globals.css";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { ThemeProvider } from "@/components/layout/ThemeProvider";

export const metadata: Metadata = {
  title: "FinTrack",
  description: "A finance dashboard for tracking income, expenses, and insights.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className="antialiased">
          <ThemeProvider>
            <div className="min-h-screen lg:flex">
              <Sidebar />
              <div className="flex min-h-screen min-w-0 flex-1 flex-col">
                <Header />
                <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
              </div>
            </div>
            <Toaster richColors position="top-right" />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
