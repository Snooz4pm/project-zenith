import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import React, { Suspense } from "react";
import dynamic from "next/dynamic";

// 🔧 NUCLEAR FIX: Make all heavy/animated components client-only
// This prevents CSR hydration blocking that causes navigation freezes
const CardNav = dynamic(
  () => import("@/components/CardNav"),
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

// Web3 Provider for wallet connections - must stay client-side
const Web3Provider = dynamic(
  () => import("@/components/providers/Web3Provider"),
  { ssr: false }
);

const SolanaProvider = dynamic(
  () => import("@/components/providers/SolanaProvider"),
  { ssr: false }
);

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
        <Web3Provider>
          <SolanaProvider>
            <AuthProvider>
              {/* GSAP-powered CardNav - floating navigation */}
              <CardNav />

              {/* 🔧 NUCLEAR FIX: Suspense wraps children for instant navigation */}
              <Suspense fallback={
                <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-4">
                      <span style={{
                        color: '#b5b5b5a4',
                        background: 'linear-gradient(120deg, rgba(255,255,255,0) 40%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0) 60%)',
                        backgroundSize: '200% 100%',
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        display: 'inline-block',
                        animation: 'shine 3s linear infinite',
                      }}>
                        ZENITHSCORES
                      </span>
                    </div>
                    <p className="text-gray-500 text-sm">Loading...</p>
                  </div>
                  <style>{`
                @keyframes shine {
                  0% { background-position: 100%; }
                  100% { background-position: -100%; }
                }
              `}</style>
                </div>
              }>
                {/* pt-20 accounts for floating CardNav height */}
                <main className="min-h-screen flex flex-col pt-20 md:pt-24">
                  <div className="flex-grow">
                    {children}
                  </div>
                  {/* Global Financial Disclaimer Footer */}
                  <div className="bg-black/80 backdrop-blur-md border-t border-white/5 py-12 px-6 mt-12">
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
          </SolanaProvider>
        </Web3Provider>
      </body>
    </html>
  );
}
