'use client';

import { Suspense, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, BarChart2, Zap, BookOpen, Activity, ChevronRight, TrendingUp } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';

// Animations
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
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div className="min-h-screen bg-[var(--void)] text-[var(--text-primary)] selection:bg-[var(--accent-mint)] selection:text-[var(--void)]">

      {/* ====================================
          HERO SECTION
         ==================================== */}
      <section className="relative h-screen min-h-[800px] flex items-center justify-center overflow-hidden">

        {/* Animated Background Mesh */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(20,241,149,0.05),_transparent_50%)]" />
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_rgba(0,212,255,0.1),_transparent_50%)] animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_left,_rgba(20,241,149,0.05),_transparent_50%)]" />

          {/* Noise Overlay */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }} />
        </div>

        <div className="container mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial="initial"
            animate="animate"
            variants={staggerContainer}
            className="max-w-4xl mx-auto"
          >
            {/* Tagline */}
            <motion.div variants={fadeInUp} className="mb-6 flex justify-center">
              <div className="px-4 py-2 rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] backdrop-blur-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--accent-mint)] animate-pulse" />
                <span className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)] font-medium" style={{ fontFamily: "var(--font-data)" }}>
                  System v2.0 Online
                </span>
              </div>
            </motion.div>

            {/* Main Heading */}
            <motion.h1 variants={fadeInUp} className="text-6xl md:text-8xl font-bold mb-8 leading-tight tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
              Market Intelligence, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-mint)] to-[var(--accent-cyan)]">
                Engineered.
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p variants={fadeInUp} className="text-xl text-[var(--text-secondary)] mb-12 max-w-2xl mx-auto leading-relaxed font-light">
              Sophisticated market analysis powered by the zenith v2 algorithm.
              Detect accumulation, momentum shifts, and volatility anomalies in real-time.
            </motion.p>

            {/* CTAs */}
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link
                href="/crypto" // Default market view
                className="group relative px-8 py-4 bg-[var(--text-primary)] text-[var(--void)] rounded-xl font-bold text-lg overflow-hidden transition-transform hover:scale-105"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent-mint)] to-[var(--accent-cyan)] opacity-0 group-hover:opacity-20 transition-opacity" />
                <span className="relative flex items-center gap-2">
                  Explore Markets <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>

              <Link
                href="/learning"
                className="px-8 py-4 rounded-xl border border-[rgba(255,255,255,0.1)] text-[var(--text-primary)] font-medium hover:bg-[rgba(255,255,255,0.05)] transition-colors flex items-center gap-2"
              >
                Start Learning <ChevronRight size={18} className="text-[var(--text-muted)]" />
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">Scroll to Initialize</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-[var(--text-muted)] to-transparent" />
        </motion.div>
      </section>

      {/* ====================================
          FEATURE BENTO GRID
         ==================================== */}
      <section className="py-32 relative z-10 border-t border-[rgba(255,255,255,0.05)] bg-[var(--void)]">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

            {/* Feature 1: Score Algorithm (Wide) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-2 p-8 rounded-3xl glass-panel relative group overflow-hidden min-h-[300px]"
            >
              <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-40 transition-opacity duration-500">
                <Activity size={120} />
              </div>
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-[var(--accent-mint)] flex items-center justify-center mb-6 text-[var(--void)]">
                    <Zap size={24} fill="currentColor" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Zenith Score Algorithm</h3>
                  <p className="text-[var(--text-secondary)] leading-relaxed max-w-md">
                    Our proprietary 0-100 scoring engine synthesizes volume, volatility, and trend data into a single actionable metric.
                  </p>
                </div>
                <div className="mt-8">
                  <div className="h-2 w-full bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--accent-mint)] w-[85%] relative">
                      <div className="absolute right-0 top-0 bottom-0 w-2 bg-white animate-pulse" />
                    </div>
                  </div>
                  <div className="flex justify-between mt-2 text-xs font-mono text-[var(--text-muted)]">
                    <span>BEARISH</span>
                    <span>NEUTRAL</span>
                    <span className="text-[var(--accent-mint)]">BULLISH</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Feature 2: Market Analysis */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="p-8 rounded-3xl glass-panel relative group overflow-hidden hover:border-[var(--accent-cyan)] transition-colors"
            >
              <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-[var(--accent-cyan)] blur-[60px] opacity-20 group-hover:opacity-30 transition-opacity" />
              <div className="w-12 h-12 rounded-xl bg-[rgba(0,212,255,0.1)] border border-[rgba(0,212,255,0.2)] flex items-center justify-center mb-6 text-[var(--accent-cyan)]">
                <BarChart2 size={24} />
              </div>
              <h3 className="text-xl font-bold mb-2">Market Regime</h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Instantly identify if the market is trending, consolidating, or reversing with our regime detection models.
              </p>
            </motion.div>

            {/* Feature 3: Learning Paths */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="p-8 rounded-3xl glass-panel relative group overflow-hidden hover:border-[var(--accent-gold)] transition-colors"
            >
              <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-[var(--accent-gold)] blur-[60px] opacity-10 group-hover:opacity-20 transition-opacity" />
              <div className="w-12 h-12 rounded-xl bg-[rgba(251,191,36,0.1)] border border-[rgba(251,191,36,0.2)] flex items-center justify-center mb-6 text-[var(--accent-gold)]">
                <BookOpen size={24} />
              </div>
              <h3 className="text-xl font-bold mb-2">Learning Paths</h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Structured curriculums designed to take you from novice to institutional-grade trader.
              </p>
            </motion.div>

            {/* Feature 4: Trading Tools (Wide bottom or small? Logic says small to fill grid if 4 columns) */}
            {/* Design choice: Make bottom row or just 4 cols. User asked for 4 columns. */}

            {/* Feature 4: Real-time Data */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-4 p-12 rounded-3xl glass-panel relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-12"
            >
              <div className="max-w-xl relative z-10">
                <h3 className="text-3xl font-bold mb-4">Real-Time Data Feeds</h3>
                <p className="text-[var(--text-secondary)] text-lg mb-8">
                  Direct connection to institutional data providers. Millisecond latency on crypto, forex, and equity markets.
                </p>
                <div className="flex gap-4">
                  <div className="px-4 py-2 rounded-lg bg-[rgba(255,255,255,0.05)] text-sm font-mono border border-[rgba(255,255,255,0.05)]">
                    <span className="text-[var(--accent-mint)]">●</span> NASDAQ
                  </div>
                  <div className="px-4 py-2 rounded-lg bg-[rgba(255,255,255,0.05)] text-sm font-mono border border-[rgba(255,255,255,0.05)]">
                    <span className="text-[var(--accent-mint)]">●</span> NYSE
                  </div>
                  <div className="px-4 py-2 rounded-lg bg-[rgba(255,255,255,0.05)] text-sm font-mono border border-[rgba(255,255,255,0.05)]">
                    <span className="text-[var(--accent-mint)]">●</span> BINANCE
                  </div>
                </div>
              </div>

              {/* Decorative Chart Graphic */}
              <div className="relative w-full max-w-md h-40 bg-[rgba(0,0,0,0.3)] rounded-xl border border-[rgba(255,255,255,0.05)] flex items-end p-4 gap-1">
                {[40, 65, 50, 80, 55, 90, 70, 85, 95, 100].map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    whileInView={{ height: `${h}%` }}
                    transition={{ duration: 0.5, delay: i * 0.05 }}
                    className="flex-1 bg-[var(--accent-mint)] opacity-80 rounded-t-sm"
                  />
                ))}
              </div>
            </motion.div>

          </div>
        </div>
      </section>
    </div>
  );
}
