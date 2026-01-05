'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Zap, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Home() {
  return (
    <div className="relative min-h-[90vh] flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden">

      {/* Background Ambient Glows (Subtler) */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-accent-mint/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-accent-emerald/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Hero Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 text-center max-w-4xl mx-auto space-y-8"
      >
        {/* Logo / Brand Mark */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="mx-auto w-20 h-20 mb-8 relative flex items-center justify-center"
        >
          {/* Hexagon Shape (CSS) */}
          <div className="absolute inset-0 bg-gradient-to-br from-surface-3 to-black border border-accent-mint/20 clip-hexagon" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}></div>
          <span className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-accent-mint to-accent-emerald z-10 font-display">Z</span>

          {/* Subtle Pulse */}
          <div className="absolute inset-0 bg-accent-mint/20 blur-xl animate-pulse" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}></div>
        </motion.div>

        {/* Title */}
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight font-display">
          <span className="text-white">Zenith</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-mint to-accent-cyan ml-2">Scores</span>
        </h1>

        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-text-secondary font-light max-w-2xl mx-auto leading-relaxed">
          Professional Solana Trading Terminal
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">

          {/* Primary CTA: Launch Terminal */}
          <Link href="/swap">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="relative group rounded-full p-[1px] overflow-hidden cursor-pointer"
            >
              {/* Spinning Emerald Border */}
              <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0_340deg,var(--color-accent-mint)_360deg)] animate-spin-slow opacity-100" />

              <div className="relative px-8 py-4 bg-black rounded-full flex items-center gap-3 transition-all group-hover:bg-surface-1">
                <span className="text-lg font-medium text-white group-hover:text-accent-mint transition-colors">
                  Launch Terminal
                </span>
                <ArrowRight className="w-5 h-5 text-accent-mint group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
          </Link>

          {/* Secondary CTA: Learn More */}
          <Link href="/about">
            <motion.button
              whileHover={{ scale: 1.05 }}
              className="px-8 py-4 text-text-secondary hover:text-white transition-colors text-lg font-medium"
            >
              Learn More
            </motion.button>
          </Link>
        </div>
      </motion.div>

      {/* Feature Pills (Below Hero) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 1 }}
        className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-16 max-w-5xl mx-auto"
      >
        <FeaturePill
          icon={<Zap className="w-5 h-5 text-accent-mint" />}
          title="Fast Jupiter Aggregation"
        />
        <FeaturePill
          icon={<ShieldCheck className="w-5 h-5 text-accent-emerald" />}
          title="Secure Non-Custodial"
        />
        <FeaturePill
          icon={<Activity className="w-5 h-5 text-accent-cyan" />}
          title="Pro Analytics & Signals"
        />
      </motion.div>

    </div>
  );
}

function FeaturePill({ icon, title }: { icon: React.ReactNode, title: string }) {
  return (
    <div className="group flex flex-col items-center gap-3">
      <div className="p-3 bg-white/5 rounded-full border border-white/5 group-hover:border-accent-mint/20 transition-colors">
        {icon}
      </div>
      <div className="relative pb-2">
        <span className="text-sm font-medium text-text-secondary group-hover:text-white transition-colors">
          {title}
        </span>
        {/* Silver Underline */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[1px] bg-text-secondary/30 group-hover:w-full group-hover:bg-accent-mint transition-all duration-300" />
      </div>
    </div>
  );
}
