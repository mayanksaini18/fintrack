import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";

import "@/app/globals.css";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import PWARegister from "@/components/PWARegister";

export const metadata: Metadata = {
  title: "Kharcha",
  description: "Track expenses, set budgets, and get AI-powered financial insights.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Kharcha",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
    ],
    apple: "/icon-192.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#0ea5e9",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
