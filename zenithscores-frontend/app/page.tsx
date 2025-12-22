'use client';

import { Suspense, useRef, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowRight, Activity, Cpu, ShieldCheck, History, Zap, TrendingUp, ChevronDown } from 'lucide-react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
// Background removed
import PredictiveSearch from '@/components/PredictiveSearch';
import MarketPulse from '@/components/MarketPulse';
import ShimmerText from '@/components/ShimmerText';
import AnimatedCounter from '@/components/AnimatedCounter';
import InteractiveCard from '@/components/InteractiveCard';
// MagneticButton removed
import GlowingBorder from '@/components/GlowingBorder';
import LiveIndicator from '@/components/LiveIndicator';
import AnimatedProgress from '@/components/AnimatedProgress';

// Threads background removed

// Animation variants
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const fadeUpItem = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut' as const,
    },
  },
};

const scaleInItem = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: 'easeOut' as const,
    },
  },
};

export default function LandingPage() {
  const methodologyRef = useRef<HTMLDivElement>(null);
  const isMethodologyInView = useInView(methodologyRef, { once: true, margin: '-100px' });
  const [showScanningExplainer, setShowScanningExplainer] = useState(false);
  const [activeScanningStep, setActiveScanningStep] = useState<string | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setShowScanningExplainer(true);
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setShowScanningExplainer(false);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans selection:bg-cyan-500/30 overflow-x-hidden">

      {/* Background removed */}

      {/* HERO SECTION */}
      <div className="relative pt-16 md:pt-24 border-b border-white/5">


        <div className="container mx-auto px-4 md:px-6 py-12 md:py-24 lg:py-32 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">

          {/* Left: Product Statement */}
          <motion.div
            className="relative z-10"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {/* Status Badge */}
            <motion.div
              variants={fadeUpItem}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 backdrop-blur-sm mb-8"
            >
              <LiveIndicator status="live" size="sm" showLabel={false} />
              <span className="text-cyan-400 text-xs font-mono font-bold tracking-wider">
                SYSTEM STATUS: OPERATIONAL
              </span>
            </motion.div>

            {/* Main Headline with Shimmer */}
            <motion.h1
              variants={fadeUpItem}
              className="text-3xl md:text-5xl lg:text-7xl font-heading mb-6 md:mb-8 leading-[1.1]"
            >
              <span className="text-white">Live Market Scores for </span>
              <br />
              <ShimmerText
                colors={['#00f0ff', '#a855f7', '#f72585', '#a855f7', '#00f0ff']}
                speed={4}
                className="font-heading"
              >
                Stocks & Crypto.
              </ShimmerText>
              <br />
              <span className="text-emerald-400">Free Forever.</span>
            </motion.h1>

            <motion.p
              variants={fadeUpItem}
              className="text-xl text-gray-400 max-w-lg leading-relaxed mb-12"
            >
              Real-time algorithmically-driven scores. No sign-up required.
            </motion.p>

            {/* Live Search Bar */}
            <motion.div variants={fadeUpItem} className="mb-10 relative z-20">
              <GlowingBorder
                colors={['#00f0ff', '#a855f7', '#f72585']}
                borderWidth={2}
                animated={true}
                glowIntensity={0.3}
                className="rounded-xl"
              >
                <Suspense fallback={<div className="w-full max-w-lg h-14 bg-gray-900 rounded-xl" />}>
                  <PredictiveSearch
                    mode="all"
                    behavior="navigate"
                    placeholder="Analyze any asset (e.g. NVDA, BTC, SOXS)..."
                    className="w-full max-w-lg"
                  />
                </Suspense>
              </GlowingBorder>
            </motion.div>

            {/* TOP MOVERS LEADERBOARD */}
            <motion.div variants={scaleInItem}>
              <InteractiveCard
                className="mb-12 w-full max-w-lg"
                tiltEnabled={true}
                maxTilt={5}
                glowColor="rgba(0, 240, 255, 0.2)"
              >
                <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/5">
                  <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2">
                    <Activity size={14} className="text-emerald-400" /> Top Opportunities
                  </h3>
                  <LiveIndicator status="live" size="sm" label="LIVE RANKING" />
                </div>
                <div className="divide-y divide-white/5">
                  {/* Row 1: NVDA */}
                  <Link href="/stocks/NVDA" className="flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors group">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-600 font-mono text-xs">01</span>
                      <div>
                        <div className="font-bold text-sm text-white group-hover:text-cyan-400 transition-colors">NVDA</div>
                        <div className="text-[10px] text-gray-500">Technology / AI</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-mono text-emerald-400">+4.2%</span>
                      <div className="w-10 h-8 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-sm shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                        92
                      </div>
                    </div>
                  </Link>

                  {/* Row 2: BTC */}
                  <Link href="/crypto/BTC" className="flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors group">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-600 font-mono text-xs">02</span>
                      <div>
                        <div className="font-bold text-sm text-white group-hover:text-orange-400 transition-colors">BTC</div>
                        <div className="text-[10px] text-gray-500">Bitcoin Network</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-mono text-emerald-400">+1.8%</span>
                      <div className="w-10 h-8 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-sm shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                        88
                      </div>
                    </div>
                  </Link>

                  {/* Row 3: SOXS */}
                  <Link href="/stocks/SOXS" className="flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors group">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-600 font-mono text-xs">03</span>
                      <div>
                        <div className="font-bold text-sm text-white group-hover:text-red-400 transition-colors">SOXS</div>
                        <div className="text-[10px] text-gray-500">Bear 3x Semi</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-mono text-red-500">-2.4%</span>
                      <div className="w-10 h-8 rounded bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 font-bold text-sm shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                        34
                      </div>
                    </div>
                  </Link>

                  <Link href="/stocks" className="block bg-white/5 py-2 text-center text-[10px] font-bold text-gray-400 hover:text-white hover:bg-white/10 transition-colors uppercase tracking-wider">
                    View Full Leaderboard →
                  </Link>
                </div>
              </InteractiveCard>
            </motion.div>

            {/* Auth CTA - Login or Get Started */}
            <motion.div
              variants={fadeUpItem}
              className="flex flex-col sm:flex-row gap-4"
            >
              <button
                onClick={() => window.location.href = '/auth/login?callbackUrl=/command-center'}
                className="group relative px-10 py-5 bg-gradient-to-r from-cyan-600 to-purple-600 text-white font-bold text-lg rounded-2xl hover:from-cyan-500 hover:to-purple-500 transition-all flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(0,240,255,0.3)] transform hover:-translate-y-1 hover:shadow-[0_0_60px_rgba(0,240,255,0.5)] duration-300"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign in with Google
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>

              <Link
                href="/auth/register"
                className="px-10 py-5 bg-transparent border-2 border-white/20 text-white font-bold text-lg rounded-2xl hover:bg-white/10 hover:border-white/40 transition-all flex items-center justify-center gap-2 transform hover:-translate-y-1 duration-300"
              >
                Create Account
              </Link>
            </motion.div>
          </motion.div>

          {/* Right: Enhanced Radar Visualization - Hidden on small mobile */}
          <motion.div
            className="relative min-h-[300px] md:min-h-[450px] h-auto w-full hidden sm:block"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <InteractiveCard
              className="h-full flex items-center justify-center p-0"
              tiltEnabled={true}
              maxTilt={8}
              glowColor="rgba(0, 240, 255, 0.3)"
            >
              {/* Radar Conic Gradient (The Sweep) */}
              <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-2xl">
                <div className="w-[800px] h-[800px] bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(0,240,255,0.3)_360deg)] animate-[radar-sweep_3s_linear_infinite] rounded-full opacity-60" />
              </div>

              {/* Static Rings */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[150px] h-[150px] border border-cyan-500/30 rounded-full animate-[breathing_4s_ease-in-out_infinite]" />
                <div className="w-[280px] h-[280px] border border-cyan-500/20 rounded-full absolute animate-[breathing_5s_ease-in-out_infinite_0.5s]" />
                <div className="w-[410px] h-[410px] border border-cyan-500/10 rounded-full absolute animate-[breathing_6s_ease-in-out_infinite_1s]" />

                {/* Crosshairs */}
                <div className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
                <div className="absolute h-full w-[1px] bg-gradient-to-b from-transparent via-cyan-500/20 to-transparent" />
              </div>

              {/* Active TARGET Blips */}
              <motion.div
                animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.8 }}
                className="absolute top-1/4 left-1/3 w-3 h-3 bg-red-500 rounded-full shadow-[0_0_15px_#ef4444,0_0_30px_#ef4444]"
              />
              <motion.div
                animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
                transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
                className="absolute bottom-1/3 right-1/4 w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_15px_#10b981,0_0_30px_#10b981]"
              />
              <motion.div
                animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
                transition={{ duration: 2.5, repeat: Infinity, delay: 0.2 }}
                className="absolute top-1/2 right-1/3 w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_15px_#00f0ff,0_0_30px_#00f0ff]"
              />
              <motion.div
                animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
                transition={{ duration: 2.8, repeat: Infinity, delay: 2 }}
                className="absolute bottom-1/4 left-1/4 w-2.5 h-2.5 bg-purple-400 rounded-full shadow-[0_0_15px_#a855f7,0_0_30px_#a855f7]"
              />

              {/* Center Display - Hoverable/Expandable */}
              <div
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className="relative z-10 flex flex-col items-center"
              >
                <button
                  onClick={() => setShowScanningExplainer(!showScanningExplainer)}
                  className="w-full text-center bg-black/60 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-2xl cursor-pointer hover:border-cyan-500/30 hover:shadow-[0_0_30px_rgba(0,240,255,0.2)] transition-all duration-300 group z-20 relative"
                >
                  <div className="text-5xl font-mono font-bold tracking-tighter text-white mb-2 flex items-center justify-center gap-1 group-hover:text-cyan-300 transition-colors">
                    <span>Scanning</span>
                    <motion.span
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse' }}
                    >
                      ...
                    </motion.span>
                  </div>
                  <div className="text-[10px] text-cyan-400 font-mono tracking-[0.2em] uppercase mb-4">
                    <AnimatedCounter value={24392} suffix=" Assets" className="text-cyan-400" /> Analyzed Real-Time
                  </div>
                  <AnimatedProgress
                    value={78}
                    max={100}
                    height={6}
                    gradientFrom="#00f0ff"
                    gradientTo="#a855f7"
                    showGlow={true}
                  />
                  {/* Click hint */}
                  <div className="mt-4 text-[10px] text-gray-500 group-hover:text-cyan-400 transition-colors flex items-center justify-center gap-1">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">Hover to reveal methodology</span>
                    <ChevronDown className={`w-3 h-3 opacity-0 group-hover:opacity-100 transition-all duration-300 ${showScanningExplainer ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {/* Inline Scanning Explainer - "Tab Underneath" Style */}
                <motion.div
                  initial={{ height: 0, opacity: 0, y: -20 }}
                  animate={showScanningExplainer ? { height: 'auto', opacity: 1, y: 0 } : { height: 0, opacity: 0, y: -20 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden w-full max-w-2xl"
                >
                  <div className="pt-4 pb-2 px-2">
                    <div className="bg-[#0a0a12]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
                      {/* Decorations */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent blur-[1px]" />
                      <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

                      {/* Interactive Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                        {[
                          {
                            id: 'data',
                            title: 'Data Collection',
                            desc: '50+ Exchanges',
                            color: '#00f0ff',
                            icon: Activity,
                            details: 'We ingest raw tick data from 50+ centralized and decentralized exchanges, normalizing order books and trade history in milliseconds to ensure zero latency in signal generation.'
                          },
                          {
                            id: 'ai',
                            title: 'AI Analysis',
                            desc: 'Momentum & Volatility',
                            color: '#a855f7',
                            icon: Cpu,
                            details: 'Our proprietary transformer models process price action to detect institutional accumulation, identifying anomalies that standard technical indicators miss.'
                          },
                          {
                            id: 'trend',
                            title: 'Trend Detection',
                            desc: 'Breakout Signals',
                            color: '#10b981',
                            icon: TrendingUp,
                            details: 'Multi-timeframe analysis confirms trend strength. We filter out false positives by cross-referencing volume profiles with historical breakout patterns.'
                          },
                          {
                            id: 'risk',
                            title: 'Risk Assessment',
                            desc: 'Downside Protection',
                            color: '#f59e0b',
                            icon: ShieldCheck,
                            details: 'Every potential signal is stress-tested against volatility spikes. We calculate dynamic stop-loss levels and liquidity depth to ensure safe entry and exit.'
                          },
                          {
                            id: 'score',
                            title: 'Score Generation',
                            desc: '0-100 Zenith Score',
                            color: '#f72585',
                            icon: Zap,
                            details: 'All metrics synthesize into a single, actionable Zenith Score. >80 indicates strong bullish momentum, while <20 signals oversold capitulation.'
                          },
                          {
                            id: 'update',
                            title: 'Real-Time Updates',
                            desc: 'Every 15 Seconds',
                            color: '#06b6d4',
                            icon: History,
                            details: 'Markets never sleep. Our engine re-evaluates every asset every 15 seconds, instantly updating scores as new tick data arrives.'
                          },
                        ].map((step, i) => (
                          <motion.button
                            key={step.id}
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent closing the expander
                              setActiveScanningStep(activeScanningStep === step.id ? null : step.id);
                            }}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 + 0.1 }}
                            className={`relative flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 text-left w-full group overflow-hidden ${activeScanningStep === step.id
                              ? 'bg-white/10 border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.05)]'
                              : 'bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/[0.07]'
                              }`}
                          >
                            {/* Active Glow Background */}
                            {activeScanningStep === step.id && (
                              <div
                                className="absolute inset-0 opacity-20"
                                style={{ background: `linear-gradient(90deg, ${step.color}00, ${step.color}40)` }}
                              />
                            )}

                            <div
                              className={`p-2 rounded-lg transition-colors duration-300 ${activeScanningStep === step.id ? 'bg-white/10' : 'bg-white/5'
                                }`}
                              style={{ color: step.color }}
                            >
                              <step.icon size={18} className={activeScanningStep === step.id ? 'drop-shadow-[0_0_8px_currentColor]' : ''} />
                            </div>
                            <div className="relative z-10">
                              <div className={`text-xs font-bold transition-colors ${activeScanningStep === step.id ? 'text-white' : 'text-gray-200'}`}>
                                {step.title}
                              </div>
                              <div className="text-[10px] text-gray-400 group-hover:text-gray-300 transition-colors">
                                {step.desc}
                              </div>
                            </div>

                            {/* Active Indicator Arrow */}
                            <motion.div
                              animate={{
                                opacity: activeScanningStep === step.id ? 1 : 0,
                                x: activeScanningStep === step.id ? 0 : -10
                              }}
                              className="ml-auto text-white"
                            >
                              <ChevronDown size={14} className="rotate-270" />
                            </motion.div>
                          </motion.button>
                        ))}
                      </div>

                      {/* Detail View Container */}
                      <AnimatePresence mode="wait">
                        {activeScanningStep && (() => {
                          const step = [
                            { id: 'data', details: 'We ingest raw tick data from 50+ centralized and decentralized exchanges, normalizing order books and trade history in milliseconds to ensure zero latency in signal generation.', color: '#00f0ff' },
                            { id: 'ai', details: 'Our proprietary transformer models process price action to detect institutional accumulation, identifying anomalies that standard technical indicators miss.', color: '#a855f7' },
                            { id: 'trend', details: 'Multi-timeframe analysis confirms trend strength. We filter out false positives by cross-referencing volume profiles with historical breakout patterns.', color: '#10b981' },
                            { id: 'risk', details: 'Every potential signal is stress-tested against volatility spikes. We calculate dynamic stop-loss levels and liquidity depth to ensure safe entry and exit.', color: '#f59e0b' },
                            { id: 'score', details: 'All metrics synthesize into a single, actionable Zenith Score. >80 indicates strong bullish momentum, while <20 signals oversold capitulation.', color: '#f72585' },
                            { id: 'update', details: 'Markets never sleep. Our engine re-evaluates every asset every 15 seconds, instantly updating scores as new tick data arrives.', color: '#06b6d4' },
                          ].find(s => s.id === activeScanningStep);

                          if (!step) return null;

                          return (
                            <motion.div
                              key="detail"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <div
                                className="p-4 rounded-xl bg-gradient-to-br from-white/5 to-transparent border border-white/5"
                                style={{ borderLeft: `3px solid ${step.color}` }}
                              >
                                <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                                  <span style={{ color: step.color }}>///</span> SYSTEM LOGIC
                                </h4>
                                <p className="text-xs md:text-sm text-gray-300 leading-relaxed font-mono">
                                  {step.details}
                                </p>
                              </div>
                            </motion.div>
                          );
                        })()}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              </div>
            </InteractiveCard>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown size={24} className="text-gray-500" />
        </motion.div>
      </div>

      {/* SECTION 1.2: FEATURED DEEP DIVE */}
      <div className="container mx-auto px-6 py-24 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <InteractiveCard
            className="p-8 lg:p-12"
            tiltEnabled={true}
            maxTilt={3}
            glowColor="rgba(16, 185, 129, 0.2)"
          >
            <div className="flex flex-col lg:flex-row items-center gap-12 relative">
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />

              {/* Left: Ticker & Score */}
              <div className="flex-1 text-center lg:text-left relative z-10">
                <div className="flex items-center justify-center lg:justify-start gap-3 mb-6">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20 uppercase tracking-widest shadow-[0_0_10px_rgba(16,185,129,0.2)] flex items-center gap-1">
                    <Zap size={12} /> Algo Spotlight
                  </span>
                  <span className="text-gray-500 text-[10px] font-mono border-l border-white/10 pl-3">DETECTED 4M AGO</span>
                </div>

                <h2 className="text-6xl md:text-7xl font-bold text-white mb-2 tracking-tight">NVDA</h2>
                <p className="text-xl md:text-2xl text-gray-400 mb-8 font-light">
                  Nvidia Corporation <span className="text-gray-600 mx-2">•</span> AI Hardware
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10 max-w-sm mx-auto lg:mx-0">
                  <div className="bg-white/5 rounded-xl p-4 border border-white/5 backdrop-blur-sm">
                    <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Momentum</div>
                    <div className="text-white font-bold text-lg">Extremely High</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/5 backdrop-blur-sm">
                    <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Volume Inflow</div>
                    <div className="text-emerald-400 font-bold text-lg">
                      +<AnimatedCounter value={240} suffix="%" decimals={0} /> <span className="text-xs font-normal text-gray-500">vs Avg</span>
                    </div>
                  </div>
                </div>

                <Link
                  href="/stocks/NVDA"
                  className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-600 to-purple-600 text-white font-bold rounded-xl hover:from-cyan-500 hover:to-purple-500 transition-all shadow-[0_0_30px_rgba(0,240,255,0.3)] transform hover:-translate-y-1 duration-300"
                >
                  Unlock Full Analysis <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              {/* Right: Visual Score */}
              <div className="flex-1 w-full max-w-md relative z-10">
                <div className="relative glass-panel rounded-2xl p-8 border border-white/10 flex flex-col items-center bg-black/40 shadow-2xl">
                  <div className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 border-b border-white/5 pb-4 w-full text-center">
                    Live Zenith Score
                  </div>

                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full animate-[breathing_3s_ease-in-out_infinite]" />
                    <div className="text-9xl font-black text-white tracking-tighter drop-shadow-2xl relative z-10">
                      <AnimatedCounter value={92} duration={2} />
                    </div>
                  </div>

                  <div className="text-emerald-400 font-bold text-xl mb-8 flex items-center gap-2 bg-emerald-900/20 px-4 py-2 rounded-lg border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                    <TrendingUp size={24} /> Strong Accumulation
                  </div>

                  <AnimatedProgress
                    value={92}
                    max={100}
                    height={12}
                    gradientFrom="#059669"
                    gradientTo="#10b981"
                    showGlow={true}
                    className="w-full"
                  />
                  <div className="flex justify-between w-full text-[10px] text-gray-500 font-mono mt-2 uppercase">
                    <span>Bearish</span>
                    <span>Neutral</span>
                    <span className="text-white font-bold">Bullish</span>
                  </div>
                </div>
              </div>
            </div>
          </InteractiveCard>
        </motion.div>
      </div>

      {/* SECTION 1.5: MARKET PULSE & FORECAST */}
      <MarketPulse />

      {/* SECTION 2: HOW ZENITH THINKS */}
      <div ref={methodologyRef} className="container mx-auto px-6 py-24 relative z-10">
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isMethodologyInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2 font-mono">Methodology</h2>
          <h3 className="text-3xl font-bold text-white font-sans">How Zenith Thinks</h3>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          variants={staggerContainer}
          initial="hidden"
          animate={isMethodologyInView ? "visible" : "hidden"}
        >
          <motion.div variants={scaleInItem}>
            <InteractiveCard className="p-8 h-full" glowColor="rgba(0, 240, 255, 0.3)">
              <Cpu className="w-8 h-8 text-cyan-400 mb-6 group-hover:scale-110 transition-transform duration-300" />
              <h4 className="text-xl font-bold text-white mb-2 font-sans">Market Strength</h4>
              <p className="text-gray-400 leading-relaxed">
                Zenith isolates pure price movement from noise, measuring momentum, volume influx, and volatility compression.
              </p>
            </InteractiveCard>
          </motion.div>

          <motion.div variants={scaleInItem}>
            <InteractiveCard className="p-8 h-full" glowColor="rgba(168, 85, 247, 0.3)">
              <ShieldCheck className="w-8 h-8 text-purple-400 mb-6 group-hover:scale-110 transition-transform duration-300" />
              <h4 className="text-xl font-bold text-white mb-2 font-sans">Risk Awareness</h4>
              <p className="text-gray-400 leading-relaxed">
                Every score is penalized for downside instability, drawdown frequency, and low liquidity events.
              </p>
            </InteractiveCard>
          </motion.div>

          <motion.div variants={scaleInItem}>
            <InteractiveCard className="p-8 h-full" glowColor="rgba(16, 185, 129, 0.3)">
              <History className="w-8 h-8 text-emerald-400 mb-6 group-hover:scale-110 transition-transform duration-300" />
              <h4 className="text-xl font-bold text-white mb-2 font-sans">Historical Truth</h4>
              <p className="text-gray-400 leading-relaxed">
                Zenith does not predict blindly. Current setups are cross-referenced against 5 years of historical outcome data.
              </p>
            </InteractiveCard>
          </motion.div>
        </motion.div>
      </div>

    </div>
  );
}
