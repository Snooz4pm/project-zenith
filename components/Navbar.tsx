'use client';

/**
 * Main Navbar - Enhanced with wallet chip
 * Uses centralized wallet balance store (NO direct RPC calls)
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, LogOut, Wallet, Copy, ExternalLink, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { DirectConnectButton, useDirectWallet } from './wallet/DirectConnectButton';
import ReclaimSOL from './Navbar/ReclaimSOL';
import { disconnectWallet } from '@/lib/connectWallet';
import { useWalletBalanceStore } from '@/lib/store/useWalletBalanceStore';

interface NavLink {
    href: string;
    label: string;
    alsoActive?: string[];
}

const NAV_LINKS: NavLink[] = [
    { href: '/signals', label: 'Signals' },
    { href: '/smart-swap', label: 'Smart Swap' },
    { href: '/smart-swap-v1', label: 'Smart V1' },
    { href: '/unlock-value', label: 'Unlock Value' },
];

export default function Navbar() {
    const pathname = usePathname();
    const { publicKey, isConnected } = useDirectWallet();
    const [showDropdown, setShowDropdown] = useState(false);
    const [copied, setCopied] = useState(false);

    // Use centralized balance store (NO RPC CALLS HERE)
    const { sol: solBalance, loading, fetchBalance, clearBalance } = useWalletBalanceStore();

    // Trigger balance fetch when wallet connects (store handles deduplication)
    useEffect(() => {
        if (isConnected && publicKey) {
            fetchBalance(publicKey);
            // Refresh every 30s
            const interval = setInterval(() => {
                fetchBalance(publicKey);
            }, 30000);
            return () => clearInterval(interval);
        } else {
            clearBalance();
        }
    }, [isConnected, publicKey, fetchBalance, clearBalance]);

    const handleDisconnect = async () => {
        await disconnectWallet();
        setShowDropdown(false);
        clearBalance();
    };

    const handleCopy = () => {
        if (publicKey) {
            navigator.clipboard.writeText(publicKey);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const formatWallet = (address: string) => {
        return `${address.slice(0, 4)}...${address.slice(-4)}`;
    };

    const formatBalance = (balance: number) => {
        if (balance >= 1000) return `${(balance / 1000).toFixed(1)}K`;
        return balance.toFixed(2);
    };

    // Hide Navbar on Homepage
    if (pathname === '/') return null;

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                            <span className="text-white font-medium text-sm">Z</span>
                        </div>
                        <span className="font-bold text-white hidden sm:block">ZenithScores</span>
                    </Link>

                    {/* Center Navigation */}
                    <div className="flex items-center gap-1">
                        {NAV_LINKS.map((link) => {
                            const isActive = pathname === link.href ||
                                link.alsoActive?.includes(pathname) ||
                                (link.href !== '/' && pathname.startsWith(link.href));

                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                                        ? 'bg-white/10 text-white'
                                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    {link.label}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Right Side */}
                    <div className="flex items-center gap-3">
                        {/* Connect Wallet / User Menu */}
                        {!isConnected || !publicKey ? (
                            <DirectConnectButton />
                        ) : (
                            <div className="relative">
                                <button
                                    onClick={() => setShowDropdown(!showDropdown)}
                                    className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                                >
                                    {/* Avatar */}
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center">
                                        <span className="text-[10px] font-bold text-black">
                                            {publicKey.slice(0, 2).toUpperCase()}
                                        </span>
                                    </div>

                                    {/* Address + Balance */}
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-white font-mono">
                                            {formatWallet(publicKey)}
                                        </span>
                                        {solBalance !== null && (
                                            <span className="text-xs text-emerald-400 font-mono hidden sm:block">
                                                {loading ? '...' : `${formatBalance(solBalance)} SOL`}
                                            </span>
                                        )}
                                    </div>

                                    <ChevronDown size={14} className={`text-zinc-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Dropdown */}
                                {showDropdown && (
                                    <>
                                        {/* Backdrop */}
                                        <div
                                            className="fixed inset-0 z-40"
                                            onClick={() => setShowDropdown(false)}
                                        />

                                        {/* Menu */}
                                        <div className="absolute right-0 mt-2 w-56 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl py-2 z-50">
                                            {/* Balance Display */}
                                            {solBalance !== null && (
                                                <div className="px-4 py-3 border-b border-white/5">
                                                    <p className="text-xs text-zinc-500">Balance</p>
                                                    <p className="text-lg font-mono text-white">
                                                        {formatBalance(solBalance)} <span className="text-zinc-400">SOL</span>
                                                    </p>
                                                </div>
                                            )}

                                            {/* View Portfolio */}
                                            <Link
                                                href="/wallet"
                                                onClick={() => setShowDropdown(false)}
                                                className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-white/5 transition-colors flex items-center gap-3"
                                            >
                                                <Wallet size={14} className="text-zinc-400" />
                                                View Portfolio
                                            </Link>

                                            {/* Copy Address */}
                                            <button
                                                onClick={handleCopy}
                                                className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-white/5 transition-colors flex items-center gap-3"
                                            >
                                                {copied ? (
                                                    <Check size={14} className="text-emerald-400" />
                                                ) : (
                                                    <Copy size={14} className="text-zinc-400" />
                                                )}
                                                {copied ? 'Copied!' : 'Copy Address'}
                                            </button>

                                            {/* View on Solscan */}
                                            <a
                                                href={`https://solscan.io/account/${publicKey}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-white/5 transition-colors flex items-center gap-3"
                                            >
                                                <ExternalLink size={14} className="text-zinc-400" />
                                                View on Solscan
                                            </a>

                                            {/* Divider */}
                                            <div className="my-2 border-t border-white/5" />

                                            {/* Reclaim Hidden SOL */}
                                            <div className="my-2 border-t border-white/5" />
                                            <div className="px-4 py-2.5">
                                                <div className="mb-2 text-xs text-emerald-400 font-bold">Free SOL</div>
                                                <div className="rounded-lg bg-black/80 border border-emerald-400/30 p-2">
                                                    <div className="mb-2 text-sm text-white font-semibold">Reclaim Hidden SOL</div>
                                                    <div className="mb-2">
                                                        <ReclaimSOL />
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Disconnect */}
                                            <button
                                                onClick={handleDisconnect}
                                                className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-3"
                                            >
                                                <LogOut size={14} />
                                                Disconnect
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
