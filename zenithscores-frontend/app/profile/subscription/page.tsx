'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Crown, Calendar, CreditCard, AlertCircle, CheckCircle, Sparkles, X } from 'lucide-react';

interface SubscriptionInfo {
  isPremium: boolean;
  tier: string;
  subscriptionId: string | null;
  subscriptionStatus: string | null;
  subscriptionStart: string | null;
  subscriptionEnd: string | null;
  daysRemaining: number;
}

export default function SubscriptionPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCanceling, setIsCanceling] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Check for success/cancel query params
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');

    if (success === 'true') {
      setShowSuccessMessage(true);
      // Refresh session to get updated tier
      update();
      // Remove query param
      router.replace('/profile/subscription');
    }

    if (canceled === 'true') {
      // User canceled the PayPal flow
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
        update(); // Refresh session
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isPremium = subscriptionInfo?.isPremium || false;
  const isCanceled = subscriptionInfo?.subscriptionStatus === 'canceled';

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Success Message */}
        {showSuccessMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center gap-3"
          >
            <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-green-400">Welcome to Premium!</h3>
              <p className="text-sm text-green-300">Your subscription is now active. Enjoy full access to all features.</p>
            </div>
            <button
              onClick={() => setShowSuccessMessage(false)}
              className="ml-auto p-1 hover:bg-green-500/20 rounded"
            >
              <X className="w-5 h-5 text-green-400" />
            </button>
          </motion.div>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Subscription Management</h1>
          <p className="text-gray-400">Manage your ZenithScores premium membership</p>
        </div>

        {/* Current Plan Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`relative overflow-hidden rounded-2xl p-8 mb-6 ${
            isPremium
              ? 'bg-gradient-to-br from-purple-900/40 to-blue-900/40 border-2 border-purple-500/50'
              : 'bg-slate-900 border border-slate-800'
          }`}
        >
          {isPremium && (
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10 animate-pulse" />
          )}

          <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  isPremium ? 'bg-gradient-to-br from-purple-500 to-blue-500' : 'bg-slate-800'
                }`}>
                  <Crown className={`w-6 h-6 ${isPremium ? 'text-white' : 'text-gray-500'}`} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {isPremium ? 'Premium Plan' : 'Free Plan'}
                  </h2>
                  <p className="text-gray-400 text-sm">
                    {isPremium ? 'Full access to all features' : 'Limited features'}
                  </p>
                </div>
              </div>

              {isPremium && (
                <div className="px-4 py-2 rounded-full bg-green-500/20 text-green-400 font-semibold text-sm">
                  {isCanceled ? 'Canceled' : 'Active'}
                </div>
              )}
            </div>

            {isPremium && subscriptionInfo && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 text-gray-400 mb-2">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">Started</span>
                  </div>
                  <p className="text-white font-semibold">
                    {subscriptionInfo.subscriptionStart
                      ? new Date(subscriptionInfo.subscriptionStart).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 text-gray-400 mb-2">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">{isCanceled ? 'Expires' : 'Renews'}</span>
                  </div>
                  <p className="text-white font-semibold">
                    {subscriptionInfo.subscriptionEnd
                      ? new Date(subscriptionInfo.subscriptionEnd).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 text-gray-400 mb-2">
                    <CreditCard className="w-4 h-4" />
                    <span className="text-sm">Days Remaining</span>
                  </div>
                  <p className="text-white font-semibold">
                    {subscriptionInfo.daysRemaining} days
                  </p>
                </div>
              </div>
            )}

            {isCanceled && (
              <div className="mb-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-400 mb-1">Subscription Canceled</h3>
                  <p className="text-sm text-yellow-300">
                    Your subscription has been canceled. You will retain premium access until{' '}
                    {subscriptionInfo?.subscriptionEnd
                      ? new Date(subscriptionInfo.subscriptionEnd).toLocaleDateString()
                      : 'the end of your billing period'}
                    . After that, your account will be downgraded to the free plan.
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4">
              {!isPremium && (
                <button
                  onClick={handleUpgrade}
                  className="flex-1 py-3 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-xl"
                  style={{
                    boxShadow: '0 0 40px rgba(168, 85, 247, 0.5)',
                  }}
                >
                  <span className="flex items-center justify-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Upgrade to Premium - $19.99/month
                  </span>
                </button>
              )}

              {isPremium && !isCanceled && (
                <button
                  onClick={handleCancelSubscription}
                  disabled={isCanceling}
                  className="flex-1 py-3 px-6 rounded-xl font-semibold text-white bg-slate-800 hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCanceling ? 'Canceling...' : 'Cancel Subscription'}
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Premium Features */}
        {!isPremium && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl bg-slate-900 border border-slate-800 p-8"
          >
            <h3 className="text-2xl font-bold text-white mb-6">Premium Features</h3>
            <ul className="space-y-4">
              {[
                'Real-Time Signal Lab with 0x Protocol integration',
                'Decision Lab - Master market psychology',
                'Advanced Trading Simulator with portfolio tracking',
                'Premium Learning Modules & progress tracking',
                'Market Opportunities Scanner (Terminal & Flow)',
                'Professional Trade Journaling & Analytics',
              ].map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </div>
    </div>
  );
}
