import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";

import "@/app/globals.css";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import PWARegister from "@/components/PWARegister";

export const metadata: Metadata = {
  title: "Kharcha",
  description: "Track expenses, set budgets, and get AI-powered financial insights.",
  manifest: "/manifest.json",
  themeColor: "#18181b",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Kharcha",
  },
  icons: {
    icon: "/icon-192.svg",
    apple: "/icon-192.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
          <meta name="mobile-web-app-capable" content="yes" />
        </head>
        <body className="antialiased">
          <ThemeProvider>
            {children}
            <Toaster richColors position="top-right" />
            <PWARegister />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
