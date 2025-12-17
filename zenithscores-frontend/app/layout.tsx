import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthProvider from "@/components/AuthProvider";
import FloatingCommandButton from "@/components/FloatingCommandButton";

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
          {/* Main content - no bottom padding needed anymore */}
          <main>
            {children}
          </main>
          <Footer />
          {/* Floating Command Button - mobile only, thumb-friendly nav */}
          <FloatingCommandButton />
        </AuthProvider>
      </body>
    </html>
  );
}


