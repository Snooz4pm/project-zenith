'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Zap, ArrowRight, Shield, Wallet, TrendingUp, Users, ChevronRight, Sparkles } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { SolanaSwapDrawer } from '@/components/SolanaSwapDrawer';

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

export default function HomePage() {
  const router = useRouter();
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();
  const [showSwap, setShowSwap] = useState(false);

  const handleStartSwapping = () => {
    if (!connected) {
      setVisible(true);
    } else {
      setShowSwap(true);
    }
  };

  const handleExplore = () => {
    router.push('/command-center');
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-emerald-500/30 selection:text-emerald-50">

      {/* HERO SECTION */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">

        {/* Background Effects */}
        <div className="absolute inset-0 z-0">
          {/* Gradient orbs */}
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '12s' }} />
          
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
              backgroundSize: '60px 60px'
            }}
          />

          {/* Noise overlay */}
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
          }} />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial="initial"
            animate="animate"
            variants={staggerContainer}
            className="max-w-5xl mx-auto text-center"
          >
            {/* System Status */}
            <motion.div variants={fadeInUp} className="mb-8 flex justify-center">
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-zinc-900/80 border border-zinc-800 backdrop-blur-md">
                <div className="relative flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs uppercase tracking-widest text-zinc-500 font-mono">Live on Solana</span>
                </div>
                <div className="w-px h-4 bg-zinc-700" />
                <span className="text-xs text-emerald-400 font-mono">Jupiter Powered</span>
              </div>
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              variants={fadeInUp}
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-8 leading-[1.1] tracking-tight"
            >
              Market Intelligence,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400">
                Engineered for 2026.
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={fadeInUp}
              className="text-lg sm:text-xl text-zinc-400 mb-12 max-w-2xl mx-auto leading-relaxed"
            >
              Swap Solana tokens instantly. Best routes via Jupiter.
              <span className="text-emerald-400"> Zero custody, your keys always.</span>
            </motion.p>

            {/* CTA Buttons */}
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              {/* Primary CTA - Start Swapping */}
              <button
                onClick={handleStartSwapping}
                className="group relative px-8 py-4 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-black font-bold text-lg overflow-hidden transition-all hover:shadow-[0_0_40px_rgba(16,185,129,0.3)] hover:scale-105"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Start Swapping
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              {/* Secondary CTA - Explore */}
              <button
                onClick={handleExplore}
                className="group px-8 py-4 rounded-full bg-zinc-900 border border-zinc-700 text-white font-medium text-lg hover:border-emerald-500/50 hover:bg-zinc-800 transition-all"
              >
                <span className="flex items-center gap-2">
                  Explore the System
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            </motion.div>

            {/* Trust Badges */}
            <motion.div variants={fadeInUp} className="flex flex-wrap items-center justify-center gap-6 text-sm text-zinc-500">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-500" />
                <span>Non-custodial</span>
              </div>
              <div className="w-px h-4 bg-zinc-800 hidden sm:block" />
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-500" />
                <span>Wallet-only auth</span>
              </div>
              <div className="w-px h-4 bg-zinc-800 hidden sm:block" />
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span>Best swap rates</span>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 rounded-full border-2 border-zinc-700 flex items-start justify-center p-2">
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-emerald-500"
            />
          </div>
        </motion.div>
      </section>

      {/* FEATURES SECTION */}
      <section className="py-32 bg-zinc-950 border-t border-zinc-900 relative">
        <div className="container mx-auto px-6">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Trade Smarter, Not Harder.
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
              A Solana-native trading terminal with real-time discovery,
              intelligent signals, and instant execution.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Feature 1 - Swap */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              whileHover={{ y: -5 }}
              className="group p-8 rounded-2xl bg-black border border-zinc-800 hover:border-emerald-500/30 transition-all"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-7 h-7 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Solana Swap</h3>
              <p className="text-zinc-500 leading-relaxed mb-4">
                On-chain swaps via Jupiter. Best routes, lowest fees.
                Connect wallet, select tokens, execute instantly.
              </p>
              <Link href="/swap" className="inline-flex items-center gap-2 text-emerald-400 text-sm font-medium hover:text-emerald-300 transition-colors">
                Start Trading <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

            {/* Feature 2 - Discovery */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              whileHover={{ y: -5 }}
              className="group p-8 rounded-2xl bg-black border border-zinc-800 hover:border-emerald-500/30 transition-all"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Sparkles className="w-7 h-7 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Crypto Finds</h3>
              <p className="text-zinc-500 leading-relaxed mb-4">
                Token discovery terminal. Flow analysis, trending pairs,
                and regime detection across Solana DEXs.
              </p>
              <Link href="/markets/crypto-finds" className="inline-flex items-center gap-2 text-purple-400 text-sm font-medium hover:text-purple-300 transition-colors">
                Discover Tokens <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

            {/* Feature 3 - Community */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              whileHover={{ y: -5 }}
              className="group p-8 rounded-2xl bg-black border border-zinc-800 hover:border-emerald-500/30 transition-all"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-7 h-7 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Community</h3>
              <p className="text-zinc-500 leading-relaxed mb-4">
                Public profiles, follows, and messaging.
                Share insights, track traders, build your network.
              </p>
              <Link href="/community" className="inline-flex items-center gap-2 text-blue-400 text-sm font-medium hover:text-blue-300 transition-colors">
                Join Community <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(16,185,129,0.08),_transparent_60%)]" />
        
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Ready to trade?
            </h2>
            <p className="text-zinc-400 text-lg mb-10">
              Connect your wallet and start swapping in seconds.
              No signup required for basic trades.
            </p>
            <button
              onClick={handleStartSwapping}
              className="group px-10 py-5 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-black font-bold text-lg hover:shadow-[0_0_60px_rgba(16,185,129,0.4)] transition-all hover:scale-105"
            >
              <span className="flex items-center gap-3">
                <Wallet className="w-5 h-5" />
                {connected ? 'Open Swap' : 'Connect Wallet'}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 border-t border-zinc-900">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                <Zap className="w-4 h-4 text-black" />
              </div>
              <span className="font-bold">ZenithScores</span>
            </div>
            
            <div className="flex items-center gap-8 text-sm text-zinc-500">
              <Link href="/zenith" className="hover:text-white transition-colors">Platform</Link>
              <Link href="/security" className="hover:text-white transition-colors">Security</Link>
              <Link href="/data" className="hover:text-white transition-colors">Data</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            </div>

            <p className="text-sm text-zinc-600">
              © 2026 ZenithScores. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Swap Drawer */}
      <SolanaSwapDrawer
        isOpen={showSwap}
        onClose={() => setShowSwap(false)}
        token={null}
      />
    </div>
  );
}
