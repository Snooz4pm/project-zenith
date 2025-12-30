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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="relative w-full max-w-4xl bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto"
              style={{
                border: '1px solid rgba(168, 85, 247, 0.3)',
                boxShadow: '0 0 80px rgba(168, 85, 247, 0.4)',
              }}
            >
              {/* Animated gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10 animate-pulse" />

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>

              {/* Content */}
              <div className="relative p-8 md:p-12">
                {/* Header */}
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 mb-4"
                  >
                    <Lock className="w-10 h-10 text-white" />
                  </motion.div>

                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-3xl md:text-4xl font-bold text-white mb-2"
                  >
                    Unlock <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">{featureName}</span>
                  </motion.h2>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-gray-300 text-lg"
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
                      className="flex items-start gap-3 p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
                    >
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <feature.icon className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                        <p className="text-sm text-gray-400">{feature.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Pricing */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.2 }}
                  className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 p-[2px] mb-6"
                >
                  <div className="bg-slate-900 rounded-xl p-6 text-center">
                    <div className="inline-block px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-sm font-semibold mb-3">
                      LIMITED TIME
                    </div>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="text-5xl font-bold text-white">$19.99</span>
                      <span className="text-gray-400 text-lg">/month</span>
                    </div>
                    <p className="text-gray-400 text-sm">Cancel anytime • No hidden fees</p>
                  </div>
                </motion.div>

                {/* CTA Button */}
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.4 }}
                  onClick={handleUpgrade}
                  disabled={isCreatingSubscription}
                  className="w-full py-4 px-6 rounded-xl font-bold text-lg text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    boxShadow: '0 0 40px rgba(168, 85, 247, 0.5)',
                  }}
                >
                  {isCreatingSubscription ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      Upgrade to Premium
                      <Sparkles className="w-5 h-5" />
                    </span>
                  )}
                </motion.button>

                {/* Trust badges */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.6 }}
                  className="mt-6 flex items-center justify-center gap-6 text-sm text-gray-400"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span>Secure Payment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span>Instant Access</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
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
