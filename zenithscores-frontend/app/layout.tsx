import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import React, { Suspense } from "react";
import dynamic from "next/dynamic";

// Modern navigation component
const Navbar = dynamic(
  () => import("@/components/navigation/Navbar"),
  { ssr: false }
);

const FloatingCommandButton = dynamic(
  () => import("@/components/FloatingCommandButton"),
  { ssr: false }
);

const TermsAcceptanceModal = dynamic(
  () => import("@/components/TermsAcceptanceModal"),
  { ssr: false }
);

// AuthProvider must wrap everything but can stay server-side
import AuthProvider from "@/components/AuthProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Zenith Scores | Market Intelligence Dashboard",
  description: "Real-time market regime analysis powered by Machine Alpha. Track BULLISH, BEARISH, and CONSOLIDATION signals with VIX and 200-Day SMA indicators.",
  keywords: ["market analysis", "trading signals", "VIX", "SMA", "market regime", "zenith scores"],
  verification: {
    google: 'crE3qi5ygHNAn3Yz803lwq85AS9dDihHP1SfsNKTBKg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased font-sans">
        <AuthProvider>
          {/* Modern fixed navigation */}
          <Navbar />

          {/* Suspense wraps children for instant navigation */}
          <Suspense fallback={
            <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mb-4 mx-auto animate-pulse">
                  <span className="text-white font-bold text-2xl">Z</span>
                </div>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm">Loading...</p>
              </div>
            </div>
          }>
            {/* pt-16 accounts for fixed navbar height */}
            <main className="min-h-screen flex flex-col pt-16">
              <div className="flex-grow">
                {children}
              </div>
              {/* Modern Footer */}
              <footer className="bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 mt-20">
                <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
                  <div className="text-center max-w-4xl mx-auto">
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-600 uppercase tracking-widest font-semibold mb-4">
                      Financial Disclaimer & Regulatory Disclosure
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-6">
                      ZenithScores is an educational and data-tracking platform. All research, scores, and analysis provided are for
                      <strong className="text-zinc-700 dark:text-zinc-300"> informational and educational purposes only</strong>. Nothing on this platform constitutes financial, investment,
                      legal, or tax advice. Trading stocks, cryptocurrencies, and other assets carries a high risk of loss.
                      Past performance is not indicative of future results. Always conduct your own research and consult with a qualified
                      financial professional before making any investment decisions.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                      <a href="/terms" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Terms of Service</a>
                      <span className="text-zinc-300 dark:text-zinc-700">•</span>
                      <a href="/privacy" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Privacy Policy</a>
                      <span className="text-zinc-300 dark:text-zinc-700">•</span>
                      <span className="text-zinc-400 dark:text-zinc-600">© 2025 ZenithScores</span>
                    </div>
                  </div>
                </div>
              </footer>
            </main>
          </Suspense>
          <TermsAcceptanceModal />
          <FloatingCommandButton />
        </AuthProvider>
      </body>
    </html>
  );
}
