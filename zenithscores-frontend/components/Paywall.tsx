'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Zap, Brain } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface PaywallProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
}

export default function Paywall({ isOpen, onClose, featureName = 'this feature' }: PaywallProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isCreatingSubscription, setIsCreatingSubscription] = useState(false);

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
      const response = await fetch('/api/subscription/create', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success && data.approvalUrl) {
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
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Compact Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="relative w-full max-w-sm bg-[var(--void)] rounded-2xl shadow-2xl overflow-hidden pointer-events-auto border border-[var(--accent-mint)]/20"
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 z-10 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4 text-zinc-500" />
              </button>

              {/* Content */}
              <div className="p-6">
                {/* Header */}
                <div className="text-center mb-5">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--accent-mint)]/10 border border-[var(--accent-mint)]/20 mb-3">
                    <Lock className="w-6 h-6 text-[var(--accent-mint)]" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-1">
                    Unlock <span className="text-[var(--accent-mint)]">{featureName}</span>
                  </h2>
                  <p className="text-zinc-500 text-sm">
                    Premium access required
                  </p>
                </div>

                {/* Features - Compact */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                    <Brain className="w-5 h-5 text-[var(--accent-mint)] mx-auto mb-1.5" />
                    <div className="text-xs font-medium text-white">Decision</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                    <Zap className="w-5 h-5 text-[var(--accent-mint)] mx-auto mb-1.5" />
                    <div className="text-xs font-medium text-white">Signal</div>
                  </div>
                </div>

                {/* Pricing - Compact */}
                <div className="rounded-xl bg-white/[0.02] border border-[var(--accent-mint)]/20 p-4 text-center mb-4">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <span className="text-3xl font-bold text-white">$19.99</span>
                    <span className="text-zinc-500 text-sm">/mo</span>
                  </div>
                  <p className="text-zinc-500 text-xs">Cancel anytime</p>
                </div>

                {/* CTA Button */}
                <button
                  onClick={handleUpgrade}
                  disabled={isCreatingSubscription}
                  className="w-full py-3 rounded-xl font-bold text-sm text-[var(--void)] bg-[var(--accent-mint)] hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingSubscription ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-[var(--void)] border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Zap className="w-4 h-4" />
                      Upgrade to Premium
                    </span>
                  )}
                </button>

                {/* Trust */}
                <div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-zinc-600">
                  <span>🔒 Secure</span>
                  <span>⚡ Instant</span>
                  <span>✓ Cancel Anytime</span>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
