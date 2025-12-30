'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Zap, TrendingUp, Brain, LineChart, Target, Sparkles } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface PaywallProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
}

const premiumFeatures = [
  {
    icon: Zap,
    title: 'Real-Time Signal Lab',
    description: 'Live trading signals with 0x Protocol integration',
  },
  {
    icon: Brain,
    title: 'Decision Lab Access',
    description: 'Master market psychology with historical scenarios',
  },
  {
    icon: LineChart,
    title: 'Advanced Trading Simulator',
    description: 'Paper trade with real-time data & portfolio tracking',
  },
  {
    icon: Target,
    title: 'Premium Learning Modules',
    description: 'Advanced courses, quizzes & progress tracking',
  },
  {
    icon: TrendingUp,
    title: 'Market Opportunities Scanner',
    description: 'Terminal & Flow - spot opportunities before others',
  },
  {
    icon: Sparkles,
    title: 'Trade Journaling & Analytics',
    description: 'Professional notebook system with insights',
  },
];

export default function Paywall({ isOpen, onClose, featureName = 'this feature' }: PaywallProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isCreatingSubscription, setIsCreatingSubscription] = useState(false);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleUpgrade = async () => {
    if (!session?.user) {
      router.push('/auth/login');
      return;
    }

    setIsCreatingSubscription(true);

    try {
      // Create PayPal subscription
      const response = await fetch('/api/subscription/create', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success && data.approvalUrl) {
        // Redirect to PayPal for payment
        window.location.href = data.approvalUrl;
      } else {
        alert('Failed to create subscription. Please try again.');
        setIsCreatingSubscription(false);
      }
    } catch (error) {
      console.error('Subscription error:', error);
      alert('An error occurred. Please try again.');
      setIsCreatingSubscription(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="relative w-full max-w-4xl bg-[var(--void)] rounded-2xl shadow-2xl overflow-hidden pointer-events-auto border border-[rgba(255,255,255,0.1)]"
              style={{
                boxShadow: '0 0 80px rgba(20, 241, 149, 0.15)',
              }}
            >
              {/* Subtle gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-mint)]/5 via-transparent to-[var(--accent-cyan)]/5" />

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-[var(--text-secondary)]" />
              </button>

              {/* Content */}
              <div className="relative p-8 md:p-12">
                {/* Header */}
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[var(--accent-mint)]/10 border border-[var(--accent-mint)]/20 mb-4"
                  >
                    <Lock className="w-10 h-10 text-[var(--accent-mint)]" />
                  </motion.div>

                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-3xl md:text-4xl font-bold text-white mb-2"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Unlock <span className="text-[var(--accent-mint)]">{featureName}</span>
                  </motion.h2>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-[var(--text-secondary)] text-lg"
                  >
                    Get access to the complete ZenithScores toolkit
                  </motion.p>
                </div>

                {/* Features Grid */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
                >
                  {premiumFeatures.map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-[var(--accent-mint)]/20 transition-all group"
                    >
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[var(--accent-mint)]/10 border border-[var(--accent-mint)]/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <feature.icon className="w-5 h-5 text-[var(--accent-mint)]" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                        <p className="text-sm text-[var(--text-muted)]">{feature.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Pricing */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.2 }}
                  className="relative overflow-hidden rounded-xl bg-white/[0.02] border border-[var(--accent-mint)]/20 p-6 text-center mb-6"
                >
                  <div className="inline-block px-3 py-1 rounded-full bg-[var(--accent-mint)]/10 border border-[var(--accent-mint)]/20 text-[var(--accent-mint)] text-sm font-semibold mb-3 uppercase tracking-wider" style={{ fontFamily: 'var(--font-data)' }}>
                    Limited Time
                  </div>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-5xl font-bold text-white" style={{ fontFamily: 'var(--font-data)' }}>$19.99</span>
                    <span className="text-[var(--text-muted)] text-lg">/month</span>
                  </div>
                  <p className="text-[var(--text-muted)] text-sm">Cancel anytime • No hidden fees</p>
                </motion.div>

                {/* CTA Button */}
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.4 }}
                  onClick={handleUpgrade}
                  disabled={isCreatingSubscription}
                  className="w-full py-4 px-6 rounded-xl font-bold text-lg text-[var(--void)] bg-[var(--accent-mint)] hover:brightness-110 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    boxShadow: '0 0 40px rgba(20, 241, 149, 0.3)',
                  }}
                >
                  {isCreatingSubscription ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-[var(--void)] border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Zap className="w-5 h-5" />
                      Upgrade to Premium
                    </span>
                  )}
                </motion.button>

                {/* Trust badges */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.6 }}
                  className="mt-6 flex items-center justify-center gap-6 text-sm text-[var(--text-muted)]"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[var(--accent-mint)]" />
                    <span>Secure Payment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[var(--accent-mint)]" />
                    <span>Instant Access</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[var(--accent-mint)]" />
                    <span>Cancel Anytime</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
