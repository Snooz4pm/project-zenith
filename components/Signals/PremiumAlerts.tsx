'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import {
    PublicKey,
    Transaction,
    SystemProgram,
    LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import toast from 'react-hot-toast';
import bs58 from 'bs58';
import TokenDiscovery from './TokenDiscovery';

// =============================================================================
// CONSTANTS - CONFIGURE THESE
// =============================================================================

const DEV_WALLET = new PublicKey('GRd3X2emDp2nmSXt1GrM9KA8EDeqW4ifgP3muwoTmzqb');

// Pricing in SOL
const PRICES = {
    single: 0.05,
    duo: 0.08,
    all: 0.12,
};

// Subscription duration
const SUBSCRIPTION_DAYS = 30;

// Wallet size thresholds (in USD)
const WALLET_SIZE_THRESHOLDS = {
    small: 1000,      // < $1K
    medium: 100000,   // $1K - $100K
    big: 100000,      // > $100K
};

// =============================================================================
// TYPES
// =============================================================================

interface SubscriptionState {
    isActive: boolean;
    expiresAt: Date | null;
    features: {
        walletTracker: boolean;
        newCoins: boolean;
        rugPulls: boolean;
    };
}

interface WatchedWallet {
    address: string;
    label: string;
    sizeFilter: 'all' | 'small' | 'medium' | 'big';
}

interface Alert {
    id: string;
    type: 'whale' | 'newCoin' | 'rugPull';
    title: string;
    message: string;
    timestamp: Date;
    data?: any;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function PremiumAlerts() {
    const { publicKey, connected, sendTransaction, signMessage } = useWallet();
    const { setVisible } = useWalletModal();
    const { connection } = useConnection();

    // Subscription state
    const [subscription, setSubscription] = useState<SubscriptionState>({
        isActive: false,
        expiresAt: null,
        features: { walletTracker: false, newCoins: false, rugPulls: false },
    });

    // UI state
    const [activeTab, setActiveTab] = useState<'discovery' | 'subscribe' | 'wallets' | 'coins' | 'rugs' | 'alerts'>('discovery');
    const [isLoading, setIsLoading] = useState(false);
    const [showSubscribeModal, setShowSubscribeModal] = useState(false);

    // Feature selection for subscription
    const [selectedFeatures, setSelectedFeatures] = useState({
        walletTracker: false,
        newCoins: false,
        rugPulls: false,
    });

    // Wallet tracker state
    const [watchedWallets, setWatchedWallets] = useState<WatchedWallet[]>([]);
    const [newWalletAddress, setNewWalletAddress] = useState('');
    const [newWalletLabel, setNewWalletLabel] = useState('');
    const [sizeFilter, setSizeFilter] = useState<'all' | 'small' | 'medium' | 'big'>('all');

    // Alerts
    const [alerts, setAlerts] = useState<Alert[]>([]);

    // Memo opt-in
    const [memoOptIn, setMemoOptIn] = useState(false);

    // =============================================================================
    // SUBSCRIPTION CHECK (DATABASE-BACKED)
    // =============================================================================

    const checkSubscription = useCallback(async () => {
        if (!publicKey || !connected) {
            setSubscription({
                isActive: false,
                expiresAt: null,
                features: { walletTracker: false, newCoins: false, rugPulls: false },
            });
            return;
        }

        try {
            // Check subscription status from database
            const res = await fetch(`/api/premium/subscribe?wallet=${publicKey.toBase58()}`);
            const data = await res.json();

            if (data.isActive && data.features) {
                setSubscription({
                    isActive: true,
                    expiresAt: new Date(data.expiresAt),
                    features: data.features,
                });
            } else {
                setSubscription({
                    isActive: false,
                    expiresAt: null,
                    features: { walletTracker: false, newCoins: false, rugPulls: false },
                });
            }
        } catch (error) {
            console.error('Error checking subscription:', error);
            setSubscription({
                isActive: false,
                expiresAt: null,
                features: { walletTracker: false, newCoins: false, rugPulls: false },
            });
        }
    }, [publicKey, connected]);

    useEffect(() => {
        checkSubscription();
    }, [checkSubscription]);

    // =============================================================================
    // SUBSCRIPTION PAYMENT
    // =============================================================================

    const calculatePrice = () => {
        const count = Object.values(selectedFeatures).filter(Boolean).length;
        if (count === 0) return 0;
        if (count === 3) return PRICES.all;
        if (count === 2) return PRICES.duo;
        return PRICES.single;
    };

    const handleSubscribe = async () => {
        if (!publicKey || !sendTransaction || !signMessage) {
            setVisible(true);
            return;
        }

        const price = calculatePrice();
        if (price === 0) {
            toast.error('Select at least one feature');
            return;
        }

        setIsLoading(true);

        try {
            const lamports = Math.ceil(price * LAMPORTS_PER_SOL);

            // STEP 1: SOL Transfer to Dev Wallet
            toast.loading('Step 1/3: Sending payment...', { id: 'sub' });

            const tx = new Transaction();
            tx.add(
                SystemProgram.transfer({
                    fromPubkey: publicKey,
                    toPubkey: DEV_WALLET,
                    lamports,
                })
            );

            const paymentTxHash = await sendTransaction(tx, connection);
            await connection.confirmTransaction(paymentTxHash, 'confirmed');

            toast.loading('Step 2/3: Sign to confirm subscription...', { id: 'sub' });

            // STEP 2: Sign subscription message (FREE, no gas)
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + SUBSCRIPTION_DAYS);

            const subscriptionMessage = `I subscribe to Zenith Premium Alerts until ${expiresAt.toISOString()}`;
            const messageBytes = new TextEncoder().encode(subscriptionMessage);
            const signatureBytes = await signMessage(messageBytes);
            const signatureBase58 = bs58.encode(signatureBytes);

            toast.loading('Step 3/3: Saving subscription...', { id: 'sub' });

            // STEP 3: Store in database
            const res = await fetch('/api/premium/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress: publicKey.toBase58(),
                    paymentTxHash,
                    signedMessage: subscriptionMessage,
                    signature: signatureBase58,
                    features: selectedFeatures,
                    amountPaid: price,
                }),
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.error || 'Failed to save subscription');

            setSubscription({
                isActive: true,
                expiresAt,
                features: selectedFeatures,
            });

            toast.success('Subscription activated! ✓', { id: 'sub' });
            setShowSubscribeModal(false);

            // Request push notification permission
            if ('Notification' in window && Notification.permission === 'default') {
                Notification.requestPermission();
            }

        } catch (error: any) {
            console.error('Subscription error:', error);
            if (error.message?.includes('User rejected')) {
                toast.error('Cancelled by user', { id: 'sub' });
            } else {
                toast.error(error.message || 'Subscription failed', { id: 'sub' });
            }
        } finally {
            setIsLoading(false);
        }
    };

    // =============================================================================
    // WALLET TRACKER
    // =============================================================================

    const addWatchedWallet = () => {
        if (!newWalletAddress) return;

        try {
            new PublicKey(newWalletAddress); // Validate address

            const wallet: WatchedWallet = {
                address: newWalletAddress,
                label: newWalletLabel || `Wallet ${watchedWallets.length + 1}`,
                sizeFilter,
            };

            setWatchedWallets(prev => [...prev, wallet]);
            setNewWalletAddress('');
            setNewWalletLabel('');
            toast.success('Wallet added to watchlist');
        } catch {
            toast.error('Invalid wallet address');
        }
    };

    const removeWatchedWallet = (address: string) => {
        setWatchedWallets(prev => prev.filter(w => w.address !== address));
    };

    // =============================================================================
    // NOTIFICATIONS
    // =============================================================================

    const sendPushNotification = (title: string, body: string) => {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, { body, icon: '/favicon.ico' });
        }
    };

    const addAlert = (alert: Omit<Alert, 'id' | 'timestamp'>) => {
        const newAlert: Alert = {
            ...alert,
            id: Math.random().toString(36).slice(2),
            timestamp: new Date(),
        };
        setAlerts(prev => [newAlert, ...prev].slice(0, 50));
        sendPushNotification(alert.title, alert.message);
    };

    // =============================================================================
    // EXPIRY CHECK & RENEWAL REMINDER
    // =============================================================================

    useEffect(() => {
        if (!subscription.isActive || !subscription.expiresAt) return;

        const checkExpiry = () => {
            const now = new Date();
            const expiry = new Date(subscription.expiresAt!);
            const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

            if (daysLeft <= 3 && daysLeft > 0) {
                toast((t) => (
                    <div>
                        <p className="font-medium">Subscription expiring in {daysLeft} day{daysLeft > 1 ? 's' : ''}</p>
                        <button
                            onClick={() => {
                                setShowSubscribeModal(true);
                                toast.dismiss(t.id);
                            }}
                            className="mt-2 px-3 py-1 bg-emerald-600 text-white rounded text-sm"
                        >
                            Renew Now
                        </button>
                    </div>
                ), { duration: 10000 });
            }

            if (daysLeft <= 0) {
                setSubscription(prev => ({ ...prev, isActive: false }));
                toast.error('Subscription expired');
            }
        };

        checkExpiry();
        const interval = setInterval(checkExpiry, 1000 * 60 * 60); // Check hourly
        return () => clearInterval(interval);
    }, [subscription.isActive, subscription.expiresAt]);

    // =============================================================================
    // RENDER
    // =============================================================================

    const daysRemaining = subscription.expiresAt
        ? Math.max(0, Math.ceil((subscription.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Premium Alerts</h2>
                    <p className="text-zinc-400 text-sm">Real-time notifications for whale moves, new coins & rug pulls</p>
                </div>

                {subscription.isActive ? (
                    <div className="text-right">
                        <div className="text-emerald-400 font-medium text-sm">✓ Active Subscription</div>
                        <div className="text-zinc-500 text-xs">{daysRemaining} days remaining</div>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowSubscribeModal(true)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium"
                    >
                        Subscribe
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-zinc-900 p-1 rounded-lg overflow-x-auto">
                {[
                    { id: 'discovery', label: '🔥 Discovery' },
                    { id: 'subscribe', label: '📋 Plans' },
                    { id: 'wallets', label: '🐋 Wallets', locked: !subscription.features.walletTracker },
                    { id: 'coins', label: '🆕 New Coins', locked: !subscription.features.newCoins },
                    { id: 'rugs', label: '🚨 Rug Check', locked: !subscription.features.rugPulls },
                    { id: 'alerts', label: `🔔 Alerts (${alerts.length})` },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        disabled={tab.locked}
                        className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab.id
                            ? 'bg-zinc-800 text-white'
                            : tab.locked
                                ? 'text-zinc-600 cursor-not-allowed'
                                : 'text-zinc-400 hover:text-white'
                            }`}
                    >
                        {tab.label} {tab.locked && '🔒'}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                {/* Discovery Tab - Live Token Feed */}
                {activeTab === 'discovery' && (
                    <TokenDiscovery isPremium={subscription.isActive} />
                )}

                {/* Plans Tab */}
                {activeTab === 'subscribe' && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-white">Your Subscription</h3>

                        {subscription.isActive ? (
                            <div className="grid grid-cols-3 gap-4">
                                <FeatureCard
                                    title="Whale Tracker"
                                    icon="🐋"
                                    active={subscription.features.walletTracker}
                                />
                                <FeatureCard
                                    title="New Coins"
                                    icon="🆕"
                                    active={subscription.features.newCoins}
                                />
                                <FeatureCard
                                    title="Rug Detector"
                                    icon="🚨"
                                    active={subscription.features.rugPulls}
                                />
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* FREE vs PREMIUM Comparison */}
                                <div className="grid md:grid-cols-2 gap-4">
                                    {/* FREE Tier */}
                                    <div className="border border-zinc-700 rounded-xl p-6 bg-zinc-800/50">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-lg font-bold text-white">FREE</h4>
                                            <span className="text-2xl font-bold text-white">$0</span>
                                        </div>
                                        <ul className="space-y-3 text-sm">
                                            <li className="flex items-center gap-2 text-zinc-300">
                                                <span className="text-emerald-400">✓</span>
                                                View new token listings
                                            </li>
                                            <li className="flex items-center gap-2 text-zinc-300">
                                                <span className="text-emerald-400">✓</span>
                                                Basic price & volume data
                                            </li>
                                            <li className="flex items-center gap-2 text-zinc-300">
                                                <span className="text-emerald-400">✓</span>
                                                Simple rug check (pass/fail)
                                            </li>
                                            <li className="flex items-center gap-2 text-zinc-500">
                                                <span className="text-zinc-600">✗</span>
                                                <span className="line-through">Ape Score algorithm</span>
                                            </li>
                                            <li className="flex items-center gap-2 text-zinc-500">
                                                <span className="text-zinc-600">✗</span>
                                                <span className="line-through">Rug Risk breakdown</span>
                                            </li>
                                            <li className="flex items-center gap-2 text-zinc-500">
                                                <span className="text-zinc-600">✗</span>
                                                <span className="line-through">Whale wallet tracking</span>
                                            </li>
                                            <li className="flex items-center gap-2 text-zinc-500">
                                                <span className="text-zinc-600">✗</span>
                                                <span className="line-through">Push notifications</span>
                                            </li>
                                        </ul>
                                        <div className="mt-6">
                                            <div className="w-full py-3 text-center text-zinc-500 text-sm border border-zinc-700 rounded-lg">
                                                Current Plan
                                            </div>
                                        </div>
                                    </div>

                                    {/* PREMIUM Tier */}
                                    <div className="border-2 border-emerald-500/50 rounded-xl p-6 bg-gradient-to-b from-emerald-900/20 to-zinc-900 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 bg-emerald-500 text-black text-xs font-bold px-3 py-1 rounded-bl-lg">
                                            RECOMMENDED
                                        </div>
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-lg font-bold text-white">PREMIUM</h4>
                                            <div className="text-right">
                                                <span className="text-2xl font-bold text-emerald-400">0.05 SOL</span>
                                                <span className="text-zinc-500 text-sm">/30 days</span>
                                            </div>
                                        </div>
                                        <ul className="space-y-3 text-sm">
                                            <li className="flex items-center gap-2 text-zinc-300">
                                                <span className="text-emerald-400">✓</span>
                                                Everything in FREE
                                            </li>
                                            <li className="flex items-center gap-2 text-white font-medium">
                                                <span className="text-emerald-400">✓</span>
                                                🦧 <strong>Ape Score</strong> - Token quality rating (0-100)
                                            </li>
                                            <li className="flex items-center gap-2 text-white font-medium">
                                                <span className="text-emerald-400">✓</span>
                                                🚨 <strong>Rug Risk Score</strong> - 20+ signal analysis
                                            </li>
                                            <li className="flex items-center gap-2 text-white font-medium">
                                                <span className="text-emerald-400">✓</span>
                                                🐋 <strong>Whale Tracker</strong> - Smart money alerts
                                            </li>
                                            <li className="flex items-center gap-2 text-white font-medium">
                                                <span className="text-emerald-400">✓</span>
                                                📱 <strong>Push Notifications</strong> - Real-time alerts
                                            </li>
                                            <li className="flex items-center gap-2 text-white font-medium">
                                                <span className="text-emerald-400">✓</span>
                                                💎 <strong>Verdict Badges</strong> - STRONG APE / HIGH RISK
                                            </li>
                                        </ul>
                                        <div className="mt-6">
                                            <button
                                                onClick={() => setShowSubscribeModal(true)}
                                                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-all hover:shadow-lg hover:shadow-emerald-500/20"
                                            >
                                                🚀 Upgrade to Premium
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Value Proposition */}
                                <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4 text-center">
                                    <p className="text-zinc-400 text-sm">
                                        💡 <strong className="text-white">Save 2+ hours of research</strong> per trade with our proprietary scoring algorithms
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Memo Opt-in */}
                        <div className="border-t border-zinc-800 pt-4">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={memoOptIn}
                                    onChange={(e) => {
                                        setMemoOptIn(e.target.checked);
                                        localStorage.setItem('memoOptIn', String(e.target.checked));
                                    }}
                                    className="w-4 h-4 rounded"
                                />
                                <div>
                                    <div className="text-white text-sm">Enable Memo Alerts</div>
                                    <div className="text-zinc-500 text-xs">Receive alerts as on-chain memo transactions (0.0001 SOL)</div>
                                </div>
                            </label>
                        </div>
                    </div>
                )}

                {/* Wallet Tracker Tab */}
                {activeTab === 'wallets' && subscription.features.walletTracker && (
                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <input
                                type="text"
                                value={newWalletAddress}
                                onChange={(e) => setNewWalletAddress(e.target.value)}
                                placeholder="Wallet address to track"
                                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
                            />
                            <input
                                type="text"
                                value={newWalletLabel}
                                onChange={(e) => setNewWalletLabel(e.target.value)}
                                placeholder="Label (optional)"
                                className="w-40 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
                            />
                            <select
                                value={sizeFilter}
                                onChange={(e) => setSizeFilter(e.target.value as any)}
                                className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
                            >
                                <option value="all">All Sizes</option>
                                <option value="small">&lt;$1K</option>
                                <option value="medium">$1K-$100K</option>
                                <option value="big">&gt;$100K</option>
                            </select>
                            <button
                                onClick={addWatchedWallet}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg"
                            >
                                Add
                            </button>
                        </div>

                        <div className="space-y-2">
                            {watchedWallets.length === 0 ? (
                                <p className="text-zinc-500 text-center py-8">No wallets being tracked</p>
                            ) : (
                                watchedWallets.map((wallet) => (
                                    <div key={wallet.address} className="flex items-center justify-between bg-zinc-800 p-3 rounded-lg">
                                        <div>
                                            <div className="text-white font-medium">{wallet.label}</div>
                                            <div className="text-zinc-500 text-sm font-mono">{wallet.address.slice(0, 8)}...{wallet.address.slice(-8)}</div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-xs text-zinc-400 bg-zinc-700 px-2 py-1 rounded">
                                                {wallet.sizeFilter === 'all' ? 'All' : wallet.sizeFilter}
                                            </span>
                                            <button
                                                onClick={() => removeWatchedWallet(wallet.address)}
                                                className="text-red-400 hover:text-red-300"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* New Coins Tab */}
                {activeTab === 'coins' && subscription.features.newCoins && (
                    <NewCoinsTab onAlert={addAlert} isPremium={subscription.isActive} />
                )}

                {/* Rug Detector Tab */}
                {activeTab === 'rugs' && subscription.features.rugPulls && (
                    <RugDetectorTab onAlert={addAlert} />
                )}

                {/* Alerts Tab */}
                {activeTab === 'alerts' && (
                    <div className="space-y-4">
                        {/* Notification Types Explained - Collapsible */}
                        <details className="group">
                            <summary className="flex items-center justify-between cursor-pointer p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50 hover:border-zinc-600/50 transition-all">
                                <span className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                                    <span>📋</span> Notification Types Explained
                                </span>
                                <span className="text-zinc-500 text-xs group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <div className="mt-3 p-4 bg-zinc-800/30 rounded-lg border border-zinc-700/30 space-y-4">
                                {/* Severity Levels */}
                                <div>
                                    <h4 className="text-xs font-semibold text-zinc-400 mb-2">SEVERITY LEVELS</h4>
                                    <div className="grid grid-cols-3 gap-2 text-xs">
                                        <div className="p-2 bg-zinc-700/30 rounded">
                                            <span className="text-zinc-500">INFO</span>
                                            <p className="text-zinc-600 mt-1">In-app only</p>
                                        </div>
                                        <div className="p-2 bg-yellow-500/10 rounded border border-yellow-500/20">
                                            <span className="text-yellow-400">SIGNAL</span>
                                            <p className="text-zinc-500 mt-1">Worth noting</p>
                                        </div>
                                        <div className="p-2 bg-red-500/10 rounded border border-red-500/20">
                                            <span className="text-red-400">CRITICAL</span>
                                            <p className="text-zinc-500 mt-1">Push eligible</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Alert Types */}
                                <div>
                                    <h4 className="text-xs font-semibold text-zinc-400 mb-2">ALERT TYPES</h4>
                                    <div className="space-y-2 text-xs">
                                        <div className="flex items-start gap-3 p-2 rounded bg-blue-500/5 border-l-2 border-blue-500">
                                            <span>🐋</span>
                                            <div>
                                                <span className="text-blue-400 font-medium">Whale Activity</span>
                                                <p className="text-zinc-500">Large wallet bought/sold $100K+. Smart money signal.</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 p-2 rounded bg-emerald-500/5 border-l-2 border-emerald-500">
                                            <span>🚀</span>
                                            <div>
                                                <span className="text-emerald-400 font-medium">Strong Ape Opportunity</span>
                                                <p className="text-zinc-500">New token with Ape Score 70+. Potential gem to research.</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 p-2 rounded bg-red-500/5 border-l-2 border-red-500">
                                            <span>🚨</span>
                                            <div>
                                                <span className="text-red-400 font-medium">Rug Risk Spike</span>
                                                <p className="text-zinc-500">Token risk increased significantly. Consider exiting.</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 p-2 rounded bg-purple-500/5 border-l-2 border-purple-500">
                                            <span>🎓</span>
                                            <div>
                                                <span className="text-purple-400 font-medium">Pump Graduation</span>
                                                <p className="text-zinc-500">Pump.fun token at 90%+ bonding. May moon or dump.</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 p-2 rounded bg-yellow-500/5 border-l-2 border-yellow-500">
                                            <span>📈</span>
                                            <div>
                                                <span className="text-yellow-400 font-medium">Volume Spike</span>
                                                <p className="text-zinc-500">500%+ volume increase. Something happening.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Ape Score Breakdown */}
                                <div>
                                    <h4 className="text-xs font-semibold text-zinc-400 mb-2">APE SCORE VERDICTS</h4>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20">
                                            <span className="text-emerald-400">STRONG_APE</span>
                                            <span className="text-zinc-500 ml-2">75-100</span>
                                        </div>
                                        <div className="p-2 rounded bg-yellow-500/10 border border-yellow-500/20">
                                            <span className="text-yellow-400">CAUTIOUS</span>
                                            <span className="text-zinc-500 ml-2">55-74</span>
                                        </div>
                                        <div className="p-2 rounded bg-orange-500/10 border border-orange-500/20">
                                            <span className="text-orange-400">HIGH_RISK</span>
                                            <span className="text-zinc-500 ml-2">35-54</span>
                                        </div>
                                        <div className="p-2 rounded bg-red-500/10 border border-red-500/20">
                                            <span className="text-red-400">DEGEN_ONLY</span>
                                            <span className="text-zinc-500 ml-2">0-34</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </details>

                        {/* Alerts List */}
                        {alerts.length === 0 ? (
                            <p className="text-zinc-500 text-center py-8">No alerts yet</p>
                        ) : (
                            alerts.map((alert) => (
                                <div
                                    key={alert.id}
                                    className={`p-4 rounded-lg border ${alert.type === 'rugPull'
                                        ? 'bg-red-900/20 border-red-500/30'
                                        : alert.type === 'whale'
                                            ? 'bg-blue-900/20 border-blue-500/30'
                                            : 'bg-emerald-900/20 border-emerald-500/30'
                                        }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-medium text-white">{alert.title}</div>
                                            <div className="text-sm text-zinc-400">{alert.message}</div>
                                        </div>
                                        <div className="text-xs text-zinc-500">
                                            {alert.timestamp.toLocaleTimeString()}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Locked Feature Message */}
                {(activeTab === 'wallets' && !subscription.features.walletTracker) ||
                    (activeTab === 'coins' && !subscription.features.newCoins) ||
                    (activeTab === 'rugs' && !subscription.features.rugPulls) ? (
                    <div className="text-center py-12">
                        <p className="text-4xl mb-4">🔒</p>
                        <p className="text-zinc-400 mb-4">This feature requires a subscription</p>
                        <button
                            onClick={() => setShowSubscribeModal(true)}
                            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg"
                        >
                            Unlock Now
                        </button>
                    </div>
                ) : null}
            </div>

            {/* Subscribe Modal */}
            {showSubscribeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md w-full">
                        <h3 className="text-xl font-bold text-white mb-4">🔔 Premium Signals</h3>

                        <div className="space-y-3 mb-6">
                            <FeatureCheckbox
                                label="🐋 Whale Tracker"
                                description="Monitor wallets for large transactions"
                                checked={selectedFeatures.walletTracker}
                                onChange={(checked) => setSelectedFeatures(prev => ({ ...prev, walletTracker: checked }))}
                            />
                            <FeatureCheckbox
                                label="🆕 New Coins"
                                description="Get alerts on fresh token launches"
                                checked={selectedFeatures.newCoins}
                                onChange={(checked) => setSelectedFeatures(prev => ({ ...prev, newCoins: checked }))}
                            />
                            <FeatureCheckbox
                                label="🚨 Rug Detector"
                                description="Warnings for suspicious token activity"
                                checked={selectedFeatures.rugPulls}
                                onChange={(checked) => setSelectedFeatures(prev => ({ ...prev, rugPulls: checked }))}
                            />
                        </div>

                        <div className="border-t border-zinc-800 pt-4 mb-6">
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-zinc-400">Price:</span>
                                <span className="text-white font-mono">{calculatePrice()} SOL</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-400">Duration:</span>
                                <span className="text-white">30 days</span>
                            </div>
                            {Object.values(selectedFeatures).filter(Boolean).length === 3 && (
                                <div className="text-emerald-400 text-xs mt-2">✓ Bundle discount applied (-20%)</div>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowSubscribeModal(false)}
                                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubscribe}
                                disabled={isLoading || calculatePrice() === 0}
                                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium disabled:opacity-50"
                            >
                                {isLoading ? 'Processing...' : 'Pay & Subscribe'}
                            </button>
                        </div>

                        <p className="text-xs text-zinc-500 mt-4 text-center">
                            ⚠️ Non-refundable. Features are for informational purposes only.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function FeatureCard({ title, icon, active }: { title: string; icon: string; active: boolean }) {
    return (
        <div className={`p-4 rounded-lg border ${active
            ? 'bg-emerald-900/20 border-emerald-500/30'
            : 'bg-zinc-800 border-zinc-700'
            }`}>
            <div className="text-2xl mb-2">{icon}</div>
            <div className="text-white font-medium">{title}</div>
            <div className={`text-xs mt-1 ${active ? 'text-emerald-400' : 'text-zinc-500'}`}>
                {active ? '✓ Active' : '○ Not subscribed'}
            </div>
        </div>
    );
}

function FeatureCheckbox({
    label,
    description,
    checked,
    onChange,
}: {
    label: string;
    description: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}) {
    return (
        <label className="flex items-start gap-3 p-3 bg-zinc-800 rounded-lg cursor-pointer hover:bg-zinc-750">
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="mt-1 w-4 h-4 rounded"
            />
            <div>
                <div className="text-white font-medium">{label}</div>
                <div className="text-zinc-500 text-sm">{description}</div>
            </div>
            <div className="ml-auto text-zinc-400 text-sm">+0.05 SOL</div>
        </label>
    );
}

// =============================================================================
// NEW COINS TAB
// =============================================================================

interface NewCoin {
    mint: string;
    name: string;
    symbol: string;
    createdAt: number;
    logoURI?: string;
    price: number;
    priceChange24h: number;
    volume24h: number;
    liquidity: number;
    // Premium fields
    apeScore?: number;
    verdict?: 'STRONG_APE' | 'CAUTIOUS' | 'HIGH_RISK' | 'DEGEN_ONLY';
    whaleInterest?: boolean;
    similarTo?: string;
}

function NewCoinsTab({ onAlert, isPremium }: { onAlert: (alert: Omit<Alert, 'id' | 'timestamp'>) => void; isPremium: boolean }) {
    const [coins, setCoins] = useState<NewCoin[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const alertedRef = React.useRef(false); // Prevent duplicate alerts

    useEffect(() => {
        const fetchCoins = async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await fetch(`/api/signals/new-coins?premium=${isPremium}`);
                if (!res.ok) throw new Error('Failed to fetch');
                const data = await res.json();
                setCoins(data.coins || []);

                // Alert on high-score coins for premium users (once only)
                if (isPremium && data.coins?.length > 0 && !alertedRef.current) {
                    const topCoin = data.coins[0];
                    if (topCoin.apeScore >= 70) {
                        alertedRef.current = true;
                        onAlert({
                            type: 'newCoin',
                            title: '🚀 Strong Ape Opportunity',
                            message: `${topCoin.symbol} scored ${topCoin.apeScore}/100 - ${topCoin.verdict}`,
                        });
                    }
                }
            } catch (err) {
                setError('Failed to load new coins');
                console.error('[NewCoins] Fetch error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchCoins();
        const interval = setInterval(fetchCoins, 60000); // Refresh every minute
        return () => clearInterval(interval);
    }, [isPremium]); // Removed onAlert from deps to prevent infinite loop

    if (loading) {
        return (
            <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-20 bg-zinc-800 rounded-lg animate-pulse" />
                ))}
            </div>
        );
    }

    if (error) {
        return <p className="text-red-400 text-center py-8">{error}</p>;
    }

    const getVerdictStyle = (verdict?: string) => {
        switch (verdict) {
            case 'STRONG_APE': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
            case 'CAUTIOUS': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            case 'HIGH_RISK': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
            case 'DEGEN_ONLY': return 'bg-red-500/20 text-red-400 border-red-500/30';
            default: return 'bg-zinc-700 text-zinc-400';
        }
    };

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-zinc-500">
                    🚀 Fresh tokens from the last 7 days
                </div>
                {isPremium && (
                    <div className="text-xs text-emerald-400 flex items-center gap-1">
                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                        Ape Scores Active
                    </div>
                )}
            </div>

            {coins.length === 0 ? (
                <p className="text-zinc-500 text-center py-8">No new coins detected</p>
            ) : (
                coins.map((coin) => (
                    <div key={coin.mint} className="bg-zinc-800/50 rounded-xl border border-white/5 p-4 hover:border-emerald-500/20 transition-all">
                        <div className="flex items-center justify-between">
                            {/* Left: Token Info */}
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center text-xl overflow-hidden">
                                    {coin.logoURI ? (
                                        <img src={coin.logoURI} alt={coin.symbol} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-white font-bold">{coin.symbol?.charAt(0) || '?'}</span>
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-white font-bold">{coin.symbol || 'Unknown'}</span>
                                        {coin.whaleInterest && (
                                            <span className="text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">🐋</span>
                                        )}
                                        {coin.similarTo && (
                                            <span className="text-xs text-zinc-500">Like {coin.similarTo}</span>
                                        )}
                                    </div>
                                    <div className="text-zinc-500 text-sm">{coin.name}</div>
                                    <div className="text-xs text-zinc-600 font-mono">
                                        ${(coin.liquidity / 1000).toFixed(1)}K liq • ${(coin.volume24h / 1000).toFixed(1)}K vol
                                    </div>
                                </div>
                            </div>

                            {/* Right: Score or Locked */}
                            <div className="text-right">
                                {isPremium && coin.apeScore !== undefined ? (
                                    <>
                                        {/* APE SCORE */}
                                        <div className="flex items-center justify-end gap-2 mb-1">
                                            <span className="text-zinc-500 text-xs">APE</span>
                                            <div className={`text-2xl font-bold font-mono ${coin.apeScore >= 70 ? 'text-emerald-400' :
                                                coin.apeScore >= 50 ? 'text-yellow-400' :
                                                    'text-red-400'
                                                }`}>
                                                {coin.apeScore}
                                            </div>
                                        </div>
                                        {/* Verdict Badge */}
                                        <div className={`text-xs px-2 py-1 rounded-full border ${getVerdictStyle(coin.verdict)}`}>
                                            {coin.verdict?.replace('_', ' ')}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {/* BASIC: Just price change */}
                                        <div className={`text-lg font-mono ${coin.priceChange24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {coin.priceChange24h >= 0 ? '+' : ''}{coin.priceChange24h.toFixed(1)}%
                                        </div>
                                        {/* Locked Ape Score */}
                                        <div className="text-xs text-zinc-600 flex items-center gap-1 justify-end mt-1">
                                            🔒 Ape Score
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}

// =============================================================================
// RUG DETECTOR TAB
// =============================================================================

function RugDetectorTab({ onAlert }: { onAlert: (alert: Omit<Alert, 'id' | 'timestamp'>) => void }) {
    const [mintAddress, setMintAddress] = useState('');
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const checkToken = async () => {
        if (!mintAddress) return;

        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`/api/signals/rug-check?mint=${mintAddress}`);
            if (!res.ok) throw new Error('Failed to check token');
            const data = await res.json();
            setResult(data);

            if (data.isRug) {
                onAlert({
                    type: 'rugPull',
                    title: '🚨 Rug Pull Warning!',
                    message: `Token ${mintAddress.slice(0, 8)}... flagged as high-risk`,
                });
            }
        } catch (err) {
            setError('Failed to analyze token');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex gap-3">
                <input
                    type="text"
                    value={mintAddress}
                    onChange={(e) => setMintAddress(e.target.value)}
                    placeholder="Enter token mint address..."
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white"
                />
                <button
                    onClick={checkToken}
                    disabled={loading || !mintAddress}
                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium disabled:opacity-50"
                >
                    {loading ? 'Checking...' : 'Check'}
                </button>
            </div>

            {error && <p className="text-red-400 text-center">{error}</p>}

            {result && (
                <div className={`p-6 rounded-xl border ${result.isRug ? 'bg-red-900/20 border-red-500/30' :
                    result.score < 50 ? 'bg-yellow-900/20 border-yellow-500/30' :
                        'bg-emerald-900/20 border-emerald-500/30'
                    }`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="text-lg font-bold text-white">Safety Score</div>
                        <div className={`text-3xl font-bold font-mono ${result.score >= 70 ? 'text-emerald-400' :
                            result.score >= 40 ? 'text-yellow-400' :
                                'text-red-400'
                            }`}>
                            {result.score}/100
                        </div>
                    </div>

                    {result.risks?.length > 0 && (
                        <div className="space-y-2 mb-4">
                            <div className="text-sm text-zinc-400">Detected Risks:</div>
                            {result.risks.map((risk: string, i: number) => (
                                <div key={i} className="flex items-center gap-2 text-sm text-red-400">
                                    <span>⚠️</span>
                                    <span>{risk}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-zinc-500">Mint Authority</span>
                            <span className={result.details?.mintAuthority ? 'text-red-400' : 'text-emerald-400'}>
                                {result.details?.mintAuthority ? 'Active ⚠️' : 'Revoked ✓'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-zinc-500">Freeze Authority</span>
                            <span className={result.details?.freezeAuthority ? 'text-red-400' : 'text-emerald-400'}>
                                {result.details?.freezeAuthority ? 'Active ⚠️' : 'None ✓'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-zinc-500">LP Status</span>
                            <span className={result.details?.lpBurned ? 'text-emerald-400' : 'text-yellow-400'}>
                                {result.details?.lpBurned ? 'Burned ✓' : `${result.details?.lpLockedPercent || 0}% Locked`}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-zinc-500">Top Holder</span>
                            <span className={result.details?.topHolderPercent > 20 ? 'text-yellow-400' : 'text-emerald-400'}>
                                {result.details?.topHolderPercent?.toFixed(1) || '0'}%
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {!result && !loading && (
                <div className="text-center py-8 text-zinc-500">
                    <p className="text-4xl mb-4">🛡️</p>
                    <p>Enter a token address to check for rug pull risks</p>
                </div>
            )}
        </div>
    );
}

