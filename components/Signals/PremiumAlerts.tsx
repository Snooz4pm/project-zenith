'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import {
    PublicKey,
    Transaction,
    SystemProgram,
    LAMPORTS_PER_SOL,
    TransactionInstruction,
} from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token';
import { Buffer } from 'buffer';
import toast from 'react-hot-toast';

// =============================================================================
// CONSTANTS - CONFIGURE THESE
// =============================================================================

const DEV_WALLET = new PublicKey('GRd3X2emDp2nmSXt1GrM9KA8EDeqW4ifgP3muwoTmzqb');
const MEMBERSHIP_MINT = new PublicKey('11111111111111111111111111111111'); // TODO: Replace with actual NFT mint

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

// Memo program ID
const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

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
    const { publicKey, connected, sendTransaction } = useWallet();
    const { setVisible } = useWalletModal();
    const { connection } = useConnection();

    // Subscription state
    const [subscription, setSubscription] = useState<SubscriptionState>({
        isActive: false,
        expiresAt: null,
        features: { walletTracker: false, newCoins: false, rugPulls: false },
    });

    // UI state
    const [activeTab, setActiveTab] = useState<'subscribe' | 'wallets' | 'coins' | 'rugs' | 'alerts'>('subscribe');
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
    // SUBSCRIPTION CHECK (NFT GATING)
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
            // Check for membership NFT
            const ata = await getAssociatedTokenAddress(MEMBERSHIP_MINT, publicKey);

            try {
                const tokenAccount = await getAccount(connection, ata);
                const balance = Number(tokenAccount.amount);

                if (balance > 0) {
                    // Load stored subscription from localStorage
                    const stored = localStorage.getItem(`sub_${publicKey.toBase58()}`);
                    if (stored) {
                        const data = JSON.parse(stored);
                        const expiresAt = new Date(data.expiresAt);

                        if (expiresAt > new Date()) {
                            setSubscription({
                                isActive: true,
                                expiresAt,
                                features: data.features,
                            });
                            return;
                        }
                    }
                }
            } catch {
                // Token account doesn't exist - no subscription
            }

            setSubscription({
                isActive: false,
                expiresAt: null,
                features: { walletTracker: false, newCoins: false, rugPulls: false },
            });
        } catch (error) {
            console.error('Error checking subscription:', error);
        }
    }, [publicKey, connected, connection]);

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
        if (!publicKey || !sendTransaction) {
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

            // Build transaction
            const tx = new Transaction();

            // 1. SOL transfer to dev wallet
            tx.add(
                SystemProgram.transfer({
                    fromPubkey: publicKey,
                    toPubkey: DEV_WALLET,
                    lamports,
                })
            );

            // 2. Add memo with subscription details
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + SUBSCRIPTION_DAYS);

            const memoData = JSON.stringify({
                action: 'subscribe',
                features: selectedFeatures,
                expires: expiresAt.toISOString(),
            });

            tx.add(
                new TransactionInstruction({
                    keys: [],
                    programId: MEMO_PROGRAM_ID,
                    data: Buffer.from(memoData),
                })
            );

            // Send transaction
            const signature = await sendTransaction(tx, connection);

            toast.loading('Confirming subscription...', { id: 'sub' });
            await connection.confirmTransaction(signature, 'confirmed');

            // Store subscription locally
            const subData = {
                expiresAt: expiresAt.toISOString(),
                features: selectedFeatures,
                txSignature: signature,
            };
            localStorage.setItem(`sub_${publicKey.toBase58()}`, JSON.stringify(subData));

            setSubscription({
                isActive: true,
                expiresAt,
                features: selectedFeatures,
            });

            toast.success('Subscription activated!', { id: 'sub' });
            setShowSubscribeModal(false);

            // Request push notification permission
            if ('Notification' in window && Notification.permission === 'default') {
                Notification.requestPermission();
            }

        } catch (error: any) {
            console.error('Subscription error:', error);
            toast.error(error.message || 'Subscription failed', { id: 'sub' });
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
            <div className="flex gap-1 bg-zinc-900 p-1 rounded-lg">
                {[
                    { id: 'subscribe', label: '📋 Overview' },
                    { id: 'wallets', label: '🐋 Wallets', locked: !subscription.features.walletTracker },
                    { id: 'coins', label: '🆕 New Coins', locked: !subscription.features.newCoins },
                    { id: 'rugs', label: '🚨 Rug Detector', locked: !subscription.features.rugPulls },
                    { id: 'alerts', label: `🔔 Alerts (${alerts.length})` },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        disabled={tab.locked}
                        className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${activeTab === tab.id
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
                {/* Overview Tab */}
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
                            <div className="text-center py-8 text-zinc-500">
                                <p>No active subscription</p>
                                <button
                                    onClick={() => setShowSubscribeModal(true)}
                                    className="mt-4 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg"
                                >
                                    Get Premium Access
                                </button>
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
                    <NewCoinsTab onAlert={addAlert} />
                )}

                {/* Rug Detector Tab */}
                {activeTab === 'rugs' && subscription.features.rugPulls && (
                    <RugDetectorTab onAlert={addAlert} />
                )}

                {/* Alerts Tab */}
                {activeTab === 'alerts' && (
                    <div className="space-y-3">
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
    initialLiquidity: number;
    currentPrice: number;
    priceChange24h: number;
    volume24h: number;
    risk: 'low' | 'medium' | 'high';
    logoURI?: string;
}

function NewCoinsTab({ onAlert }: { onAlert: (alert: Omit<Alert, 'id' | 'timestamp'>) => void }) {
    const [coins, setCoins] = useState<NewCoin[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCoins = async () => {
            try {
                setLoading(true);
                const res = await fetch('/api/signals/new-coins');
                if (!res.ok) throw new Error('Failed to fetch');
                const data = await res.json();
                setCoins(data.coins || []);

                // Alert on new coins
                if (data.coins?.length > 0) {
                    const newest = data.coins[0];
                    onAlert({
                        type: 'newCoin',
                        title: '🆕 New Token Detected',
                        message: `${newest.symbol} launched with $${newest.initialLiquidity.toLocaleString()} liquidity`,
                    });
                }
            } catch (err) {
                setError('Failed to load new coins');
            } finally {
                setLoading(false);
            }
        };

        fetchCoins();
        const interval = setInterval(fetchCoins, 60000); // Refresh every minute
        return () => clearInterval(interval);
    }, [onAlert]);

    if (loading) {
        return (
            <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-zinc-800 rounded-lg animate-pulse" />
                ))}
            </div>
        );
    }

    if (error) {
        return <p className="text-red-400 text-center py-8">{error}</p>;
    }

    return (
        <div className="space-y-3">
            <div className="text-sm text-zinc-500 mb-4">
                🚀 Fresh tokens from the last 7 days with ≥$1K liquidity
            </div>
            {coins.length === 0 ? (
                <p className="text-zinc-500 text-center py-8">No new coins detected</p>
            ) : (
                coins.map((coin) => (
                    <div key={coin.mint} className="flex items-center justify-between bg-zinc-800 p-4 rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-lg">
                                {coin.logoURI ? (
                                    <img src={coin.logoURI} alt={coin.symbol} className="w-full h-full rounded-full" />
                                ) : (
                                    coin.symbol?.charAt(0) || '?'
                                )}
                            </div>
                            <div>
                                <div className="text-white font-medium">{coin.symbol || 'Unknown'}</div>
                                <div className="text-zinc-500 text-sm">{coin.name}</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className={`text-sm font-mono ${coin.priceChange24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {coin.priceChange24h >= 0 ? '+' : ''}{coin.priceChange24h.toFixed(1)}%
                            </div>
                            <div className={`text-xs px-2 py-0.5 rounded ${coin.risk === 'low' ? 'bg-emerald-500/20 text-emerald-400' :
                                    coin.risk === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                        'bg-red-500/20 text-red-400'
                                }`}>
                                {coin.risk.toUpperCase()}
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

