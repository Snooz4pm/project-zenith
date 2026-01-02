import type { Metadata } from "next";
import { JetBrains_Mono, Syne, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import React, { Suspense } from "react";
import dynamic from "next/dynamic";
import { Analytics } from "@vercel/analytics/next";

// Modern navigation component
const Navbar = dynamic(
  () => import("@/components/navigation/Navbar"),
  { ssr: false }
);

const MobileTopNav = dynamic(
  () => import("@/components/navigation/MobileTopNav"),
  { ssr: false }
);

const TermsAcceptanceModal = dynamic(
  () => import("@/components/TermsAcceptanceModal"),
  { ssr: false }
);

const MobileBottomNav = dynamic(
  () => import("@/components/navigation/MobileBottomNavNew"),
  { ssr: false }
);

// AuthProvider must wrap everything but can stay server-side
import AuthProvider from "@/components/AuthProvider";
import { Providers } from "./providers";
import { DisciplineGatePanelProvider } from "@/contexts/DisciplineGatePanelContext";

// DisciplinePanel - mounted at ROOT for proper z-index stacking
const DisciplinePanel = dynamic(
  () => import("@/components/gate/DisciplinePanel").then(m => m.DisciplinePanel),
  { ssr: false }
);

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.zenithscores.com'),
  title: "ZenithScores | Market Intelligence",
  description: "Real-time market regime analysis powered by Machine Alpha. Track BULLISH, BEARISH, and CONSOLIDATION signals with VIX and 200-Day SMA indicators.",
  keywords: ["market analysis", "trading signals", "VIX", "SMA", "market regime", "zenith scores"],
  verification: {
    google: 'crE3qi5ygHNAn3Yz803lwq85AS9dDihHP1SfsNKTBKg',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
  },
  themeColor: '#000000',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ZenithScores',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jetbrainsMono.variable} ${syne.variable} ${ibmPlexMono.variable} antialiased`}>
      <body className="antialiased bg-[var(--void)] text-[var(--text-primary)] relative overflow-x-hidden selection:bg-cyan-500/30 overscroll-behavior-none touch-pan-y">
        <div className="fixed inset-0 z-[-1] pointer-events-none bg-[radial-gradient(circle_at_top_center,_rgba(20,241,149,0.03),_transparent_70%)]" />
        <div className="fixed inset-0 z-[-1] pointer-events-none bg-[radial-gradient(circle_at_bottom_left,_rgba(0,212,255,0.03),_transparent_70%)]" />
        <AuthProvider>
          <Providers>
            <DisciplineGatePanelProvider>
              {/* Desktop navigation */}
              <div className="hidden md:block">
                <Navbar />
              </div>

              {/* Mobile navigation */}
              <div className="md:hidden">
                <MobileTopNav />
              </div>

              <MobileBottomNav />

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
                {/* pt-16 accounts for fixed navbar height, pb-20 for mobile nav */}
                <main className="min-h-screen flex flex-col pt-16 pb-20 md:pb-0">
                  <div className="flex-grow">
                    {children}
                  </div>
                  {/* Terminal Footer */}
                  <footer className="bg-[var(--void)] border-t border-[rgba(255,255,255,0.05)] mt-20 md:mb-0 mb-16">
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
                          <a href="/zenith" className="hover:text-cyan-400 transition-colors">Platform</a>
                          <span className="text-white/10">•</span>
                          <a href="/security" className="hover:text-cyan-400 transition-colors">Security</a>
                          <span className="text-white/10">•</span>
                          <a href="/data" className="hover:text-cyan-400 transition-colors">Data</a>
                          <span className="text-white/10">•</span>
                          <a href="/terms" className="hover:text-cyan-400 transition-colors">Terms</a>
                          <span className="text-white/10">•</span>
                          <a href="/privacy" className="hover:text-cyan-400 transition-colors">Privacy</a>
                          <span className="text-white/10">•</span>
                          <span className="text-gray-600">© 2025 ZenithScores</span>
                        </div>
                      </div>
                    </div>
                  </footer>
                </main>
              </Suspense>
              <TermsAcceptanceModal />
              {/* DisciplinePanel mounted at ROOT for proper z-index */}
              <DisciplinePanel />
            </DisciplineGatePanelProvider>
          </Providers>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
