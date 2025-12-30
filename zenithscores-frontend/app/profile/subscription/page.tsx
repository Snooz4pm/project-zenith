'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Crown, Calendar, CreditCard, AlertCircle, CheckCircle, Sparkles, X, Zap, Brain, Target, BookOpen, BarChart2, FileText } from 'lucide-react';

interface SubscriptionInfo {
  isPremium: boolean;
  tier: string;
  subscriptionId: string | null;
  subscriptionStatus: string | null;
  subscriptionStart: string | null;
  subscriptionEnd: string | null;
  daysRemaining: number;
}

const premiumFeatures = [
  { icon: Zap, label: 'Signal Lab', desc: 'Real-time trading signals' },
  { icon: Brain, label: 'Decision Lab', desc: 'Master market psychology' },
  { icon: Target, label: 'Opportunities', desc: 'Terminal & Flow scanner' },
  { icon: BookOpen, label: 'Premium Courses', desc: 'Advanced learning paths' },
  { icon: BarChart2, label: 'Simulator', desc: 'Paper trade with live data' },
  { icon: FileText, label: 'Journal Pro', desc: 'Trade analytics & insights' },
];

export default function SubscriptionPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCanceling, setIsCanceling] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');

    if (success === 'true') {
      setShowSuccessMessage(true);
      update();
      router.replace('/profile/subscription');
    }

    if (canceled === 'true') {
      router.replace('/profile/subscription');
    }
  }, [searchParams, router, update]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    if (status === 'authenticated') {
      fetchSubscriptionStatus();
    }
  }, [status, router]);

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await fetch('/api/subscription/status');
      const data = await response.json();

      if (data.success) {
        setSubscriptionInfo(data);
      }
    } catch (error) {
      console.error('Failed to fetch subscription status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will retain access until the end of your billing period.')) {
      return;
    }

    setIsCanceling(true);

    try {
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message);
        fetchSubscriptionStatus();
        update();
      } else {
        alert(data.error || 'Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Cancel subscription error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsCanceling(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      const response = await fetch('/api/subscription/create', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success && data.approvalUrl) {
        window.location.href = data.approvalUrl;
      } else {
        alert('Failed to create subscription. Please try again.');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      alert('An error occurred. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--void)] flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-[var(--accent-mint)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isPremium = subscriptionInfo?.isPremium || false;
  const isCanceled = subscriptionInfo?.subscriptionStatus === 'canceled';

  return (
    <div className="min-h-screen bg-[var(--void)] py-12 px-4">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-[radial-gradient(circle_at_top_right,_rgba(20,241,149,0.08),_transparent_60%)]" />
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-[radial-gradient(circle_at_bottom_left,_rgba(0,212,255,0.05),_transparent_60%)]" />
      </div>

      <div className="max-w-2xl mx-auto relative z-10">
        {/* Success Message */}
        {showSuccessMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-[var(--accent-mint)]/10 border border-[var(--accent-mint)]/30 flex items-center gap-3"
          >
            <CheckCircle className="w-6 h-6 text-[var(--accent-mint)] flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-[var(--accent-mint)]">Welcome to Premium!</h3>
              <p className="text-sm text-[var(--accent-mint)]/80">Your subscription is now active.</p>
            </div>
            <button
              onClick={() => setShowSuccessMessage(false)}
              className="ml-auto p-1 hover:bg-white/10 rounded"
            >
              <X className="w-5 h-5 text-[var(--accent-mint)]" />
            </button>
          </motion.div>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--accent-mint)]/10 border border-[var(--accent-mint)]/20 mb-4"
          >
            <Crown className="w-8 h-8 text-[var(--accent-mint)]" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            {isPremium ? 'Premium Active' : 'Upgrade to Premium'}
          </h1>
          <p className="text-[var(--text-secondary)]">
            {isPremium ? 'Manage your subscription' : 'Unlock the full ZenithScores experience'}
          </p>
        </div>

        {/* Current Plan Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`relative overflow-hidden rounded-2xl p-6 mb-6 border ${isPremium
              ? 'bg-[var(--accent-mint)]/5 border-[var(--accent-mint)]/30'
              : 'bg-white/[0.02] border-white/10'
            }`}
        >
          {/* Animated glow for premium */}
          {isPremium && (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(20,241,149,0.1),_transparent_70%)] animate-pulse" />
          )}

          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPremium ? 'bg-[var(--accent-mint)]' : 'bg-white/10'
                  }`}>
                  <Crown className={`w-5 h-5 ${isPremium ? 'text-[var(--void)]' : 'text-zinc-500'}`} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {isPremium ? 'Premium' : 'Free'}
                  </h2>
                  <p className="text-xs text-[var(--text-muted)]">
                    {isPremium ? '$19.99/month' : 'Limited access'}
                  </p>
                </div>
              </div>

              {isPremium && (
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${isCanceled
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-[var(--accent-mint)]/20 text-[var(--accent-mint)]'
                  }`}>
                  {isCanceled ? 'Canceled' : 'Active'}
                </span>
              )}
            </div>

            {/* Subscription Details */}
            {isPremium && subscriptionInfo && (
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                  <Calendar className="w-4 h-4 text-[var(--accent-mint)] mx-auto mb-1" />
                  <div className="text-[10px] text-zinc-500 mb-0.5">Started</div>
                  <div className="text-xs text-white font-mono">
                    {subscriptionInfo.subscriptionStart
                      ? new Date(subscriptionInfo.subscriptionStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      : 'N/A'}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                  <Calendar className="w-4 h-4 text-[var(--accent-cyan)] mx-auto mb-1" />
                  <div className="text-[10px] text-zinc-500 mb-0.5">{isCanceled ? 'Expires' : 'Renews'}</div>
                  <div className="text-xs text-white font-mono">
                    {subscriptionInfo.subscriptionEnd
                      ? new Date(subscriptionInfo.subscriptionEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      : 'N/A'}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                  <CreditCard className="w-4 h-4 text-[var(--accent-mint)] mx-auto mb-1" />
                  <div className="text-[10px] text-zinc-500 mb-0.5">Days Left</div>
                  <div className="text-xs text-white font-mono">{subscriptionInfo.daysRemaining}</div>
                </div>
              </div>
            )}

            {isCanceled && (
              <div className="mb-4 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-300">
                  Access until {subscriptionInfo?.subscriptionEnd
                    ? new Date(subscriptionInfo.subscriptionEnd).toLocaleDateString()
                    : 'billing period ends'}
                </p>
              </div>
            )}

            {/* Actions */}
            {!isPremium ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleUpgrade}
                className="w-full py-3 rounded-xl font-bold text-[var(--void)] bg-[var(--accent-mint)] hover:brightness-110 transition-all"
                style={{ boxShadow: '0 0 30px rgba(20, 241, 149, 0.3)' }}
              >
                <span className="flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Upgrade Now - $19.99/mo
                </span>
              </motion.button>
            ) : !isCanceled ? (
              <button
                onClick={handleCancelSubscription}
                disabled={isCanceling}
                className="w-full py-2.5 rounded-xl text-sm font-medium text-zinc-400 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors disabled:opacity-50"
              >
                {isCanceling ? 'Canceling...' : 'Cancel Subscription'}
              </button>
            ) : null}
          </div>
        </motion.div>

        {/* Premium Features Grid */}
        {!isPremium && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl bg-white/[0.02] border border-white/5 p-6"
          >
            <h3 className="text-lg font-bold text-white mb-4">What you get</h3>
            <div className="grid grid-cols-2 gap-3">
              {premiumFeatures.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-[var(--accent-mint)]/20 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-[var(--accent-mint)]/10 flex items-center justify-center group-hover:bg-[var(--accent-mint)]/20 transition-colors">
                    <feature.icon className="w-4 h-4 text-[var(--accent-mint)]" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{feature.label}</div>
                    <div className="text-[10px] text-zinc-500">{feature.desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Trust badges */}
        <div className="mt-6 flex items-center justify-center gap-6 text-[10px] text-zinc-600">
          <span>🔒 Secure Payment</span>
          <span>⚡ Instant Access</span>
          <span>✓ Cancel Anytime</span>
        </div>
      </div>
    </div>
  );
}
