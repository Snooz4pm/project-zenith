import type { Metadata } from "next";
import { DM_Sans, IBM_Plex_Mono } from "next/font/google";
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

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
  weight: ["400", "500", "600"],
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
    <html lang="en" className={`${dmSans.variable} ${ibmPlexMono.variable}`}>
      <body className="antialiased font-sans terminal-mesh">
        <AuthProvider>
          {/* Modern fixed navigation */}
          <Navbar />

          {/* Suspense wraps children for instant navigation */}
          <Suspense fallback={
            <div className="min-h-screen bg-[#0B0E1A] flex items-center justify-center">
              <div className="text-center">
                <div className="relative w-16 h-16 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center mb-4 mx-auto">
                  <span className="text-[#0B0E1A] font-bold text-3xl font-mono">Z</span>
                  <div className="absolute inset-0 rounded-lg bg-cyan-400 opacity-50 animate-ping"></div>
                </div>
                <p className="text-cyan-400 text-sm font-mono uppercase tracking-widest">Initializing Terminal...</p>
              </div>
            </div>
          }>
            {/* pt-16 accounts for fixed navbar height */}
            <main className="min-h-screen flex flex-col pt-16">
              <div className="flex-grow">
                {children}
              </div>
              {/* Terminal Footer */}
              <footer className="bg-[#111827] border-t border-[#2D3F5A] mt-20">
                <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
                  <div className="text-center max-w-4xl mx-auto">
                    <p className="text-[10px] text-cyan-600 uppercase tracking-[0.2em] font-mono font-semibold mb-4">
                      Financial Disclaimer & Regulatory Disclosure
                    </p>
                    <p className="text-xs text-gray-400 leading-relaxed mb-6">
                      ZenithScores is an educational and data-tracking platform. All research, scores, and analysis provided are for
                      <strong className="text-cyan-400"> informational and educational purposes only</strong>. Nothing on this platform constitutes financial, investment,
                      legal, or tax advice. Trading stocks, cryptocurrencies, and other assets carries a high risk of loss.
                      Past performance is not indicative of future results. Always conduct your own research and consult with a qualified
                      financial professional before making any investment decisions.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-500">
                      <a href="/terms" className="hover:text-cyan-400 transition-colors">Terms of Service</a>
                      <span className="text-[#2D3F5A]">•</span>
                      <a href="/privacy" className="hover:text-cyan-400 transition-colors">Privacy Policy</a>
                      <span className="text-[#2D3F5A]">•</span>
                      <span className="text-gray-600">© 2025 ZenithScores</span>
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
