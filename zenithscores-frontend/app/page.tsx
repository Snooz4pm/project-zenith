'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import ExploreButton from '@/components/ui/ExploreButton';
import { Shield, Database, Layout, ArrowRight } from 'lucide-react';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-emerald-500/30 selection:text-emerald-50">

      {/* HERO SECTION */}
      <section className="relative h-screen min-h-[800px] flex items-center justify-center overflow-hidden">

        {/* Background Effects */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(16,185,129,0.03),_transparent_50%)]" />
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_rgba(16,185,129,0.05),_transparent_60%)] animate-pulse" style={{ animationDuration: '8s' }} />

          {/* Subtle Grid */}
          <div className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
              backgroundSize: '50px 50px'
            }}
          />
        </div>

        <div className="container mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial="initial"
            animate="animate"
            variants={staggerContainer}
            className="max-w-5xl mx-auto flex flex-col items-center"
          >
            {/* System Tag */}
            <motion.div variants={fadeInUp} className="mb-8">
              <div className="px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 font-mono">
                  System v2.0 Online
                </span>
              </div>
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              variants={fadeInUp}
              className="text-6xl md:text-8xl font-bold mb-8 leading-tight tracking-tight mix-blend-color-dodge"
            >
              Market Intelligence, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">
                Engineered.
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={fadeInUp}
              className="text-xl text-zinc-400 mb-12 max-w-2xl mx-auto leading-relaxed font-light"
            >
              Sophisticated analysis powered by the V2 regime detection system.
              Detect accumulation, momentum shifts, and volatility anomalies in real-time.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center gap-6">
              <ExploreButton />

              <Link href="/zenith" className="group text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-2">
                About Zenith
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>

          </motion.div>
        </div>
      </section>

      {/* VALUE PROPOSITION SECTION */}
      <section className="py-32 bg-zinc-950 border-t border-white/5 relative z-10">
        <div className="container mx-auto px-6">

          <div className="text-center mb-24">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Precision. Privacy. Performance.</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
              Zenith is a non-custodial interface for the modern trader. We provide institutional-grade data visualization
              and direct execution capabilities without ever holding your funds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            {/* Card 1 */}
            <motion.div
              whileHover={{ y: -5 }}
              className="p-8 rounded-2xl bg-black border border-white/10 hover:border-emerald-500/30 transition-colors group"
            >
              <div className="w-12 h-12 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center mb-6 group-hover:border-emerald-500/30 transition-colors">
                <Layout className="text-emerald-500" size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Global Markets</h3>
              <p className="text-zinc-500 leading-relaxed">
                Real-time data aggregation from Finnhub and Alpha Vantage.
                Stocks, Forex, and Crypto in a single terminal.
              </p>
            </motion.div>

            {/* Card 2 */}
            <motion.div
              whileHover={{ y: -5 }}
              className="p-8 rounded-2xl bg-black border border-white/10 hover:border-emerald-500/30 transition-colors group"
            >
              <div className="w-12 h-12 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center mb-6 group-hover:border-emerald-500/30 transition-colors">
                <Shield className="text-emerald-500" size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Non-Custodial</h3>
              <p className="text-zinc-500 leading-relaxed">
                Connect your wallet to execute. Your keys, your assets.
                We never access your private data.
              </p>
            </motion.div>

            {/* Card 3 */}
            <motion.div
              whileHover={{ y: -5 }}
              className="p-8 rounded-2xl bg-black border border-white/10 hover:border-emerald-500/30 transition-colors group"
            >
              <div className="w-12 h-12 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center mb-6 group-hover:border-emerald-500/30 transition-colors">
                <Database className="text-emerald-500" size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Decision Lab</h3>
              <p className="text-zinc-500 leading-relaxed">
                Refine your psychology. Track behavior patterns and
                optimize your decision-making process.
              </p>
            </motion.div>

          </div>
        </div>
      </section>

    </div>
  );
}
