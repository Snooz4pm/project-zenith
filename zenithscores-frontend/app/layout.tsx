import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import React, { Suspense } from "react";
import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";

// 🔧 NUCLEAR FIX: Make all heavy/animated components client-only
// This prevents CSR hydration blocking that causes navigation freezes
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
          <Navbar />

          {/* 🔧 NUCLEAR FIX: Suspense wraps children for instant navigation */}
          <Suspense fallback={<div className="min-h-screen bg-[#0a0a12]" />}>
            <main>
              {children}
              {/* Global Financial Disclaimer Footer */}
              <div className="bg-black/50 border-t border-white/5 py-8 mt-12 px-6">
                <div className="container mx-auto max-w-4xl text-center">
                  <p className="text-[10px] text-gray-500 leading-relaxed uppercase tracking-widest mb-4">
                    Financial Disclaimer & Regulatory Disclosure
                  </p>
                  <p className="text-xs text-gray-400 leading-relaxed max-w-3xl mx-auto">
                    ZenithScores is an educational and data-tracking platform. All research, scores, and analysis provided are for
                    <strong> informational and educational purposes only</strong>. Nothing on this platform constitutes financial, investment,
                    legal, or tax advice. Trading stocks, cryptocurrencies, and other assets carries a high risk of loss.
                    Past performance is not indicative of future results. Always conduct your own research and consult with a qualified
                    financial professional before making any investment decisions.
                  </p>
                  <div className="flex justify-center gap-6 mt-6">
                    <a href="/terms" className="text-[10px] text-gray-600 hover:text-white transition-colors">Terms of Service</a>
                    <a href="/privacy" className="text-[10px] text-gray-600 hover:text-white transition-colors">Privacy Policy</a>
                    <span className="text-[10px] text-gray-700">© 2025 ZenithScores Ecosystem</span>
                  </div>
                </div>
              </div>
            </main>
          </Suspense>

          {/* 🔧 NUCLEAR FIX: These are dynamically imported with ssr:false */}
          <TermsAcceptanceModal />
          <FloatingCommandButton />
        </AuthProvider>
      </body>
    </html>
  );
}
