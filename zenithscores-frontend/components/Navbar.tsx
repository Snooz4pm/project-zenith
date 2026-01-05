'use client';

/**
 * Main Navbar - Exact specification
 * 
 * [ Logo ]  Swap  Learn  Community        Dashboard  Connect Wallet
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useWalletIdentity } from '@/lib/wallet-identity';
import { Wallet, ChevronDown, LogOut } from 'lucide-react';
import { useState } from 'react';

const NAV_LINKS = [
    { href: '/swap', label: 'Swap', alsoActive: ['/'] },
    { href: '/learn', label: 'Learn' },
    { href: '/community', label: 'Community' },
];

export default function Navbar() {
    const pathname = usePathname();
    const { connected, publicKey, disconnect: walletDisconnect } = useWallet();
    const { setVisible } = useWalletModal();
    const { user, isAuthenticated, authenticate, disconnect } = useWalletIdentity();
    const [showDropdown, setShowDropdown] = useState(false);

    const handleConnect = () => {
        if (!connected) {
            setVisible(true);
        } else if (!isAuthenticated) {
            authenticate();
        }
    };

    const handleDisconnect = () => {
        disconnect();
        setShowDropdown(false);
    };

    const formatWallet = (address: string) => {
        return `${address.slice(0, 4)}...${address.slice(-4)}`;
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center">
                            <span className="text-black font-bold text-sm">Z</span>
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
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        isActive 
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
                        {/* Dashboard (Command Center) - Only show when authenticated */}
                        {isAuthenticated && (
                            <Link
                                href="/command-center"
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    pathname === '/command-center'
                                        ? 'bg-white/10 text-white'
                                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                Dashboard
                            </Link>
                        )}

                        {/* Connect Wallet / User Menu */}
                        {!connected ? (
                            <button
                                onClick={() => setVisible(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-colors text-sm font-medium"
                            >
                                <Wallet size={16} />
                                Connect Wallet
                            </button>
                        ) : (
                            <div className="relative">
                                <button
                                    onClick={() => setShowDropdown(!showDropdown)}
                                    className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                                >
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center">
                                        <span className="text-[10px] font-bold text-black">
                                            {user?.username?.[0]?.toUpperCase() || publicKey?.toBase58().slice(0, 2).toUpperCase()}
                                        </span>
                                    </div>
                                    <span className="text-sm text-white font-mono">
                                        {user?.username || formatWallet(publicKey?.toBase58() || '')}
                                    </span>
                                    <ChevronDown size={14} className="text-zinc-400" />
                                </button>

                                {/* Dropdown */}
                                {showDropdown && (
                                    <div className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-white/10 rounded-lg shadow-xl py-1 z-50">
                                        <Link
                                            href="/dashboard"
                                            onClick={() => setShowDropdown(false)}
                                            className="block px-4 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-white transition-colors"
                                        >
                                            Dashboard
                                        </Link>
                                        <Link
                                            href={`/profile/${publicKey?.toBase58()}`}
                                            onClick={() => setShowDropdown(false)}
                                            className="block px-4 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-white transition-colors"
                                        >
                                            My Profile
                                        </Link>
                                        <Link
                                            href="/settings"
                                            onClick={() => setShowDropdown(false)}
                                            className="block px-4 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-white transition-colors"
                                        >
                                            Settings
                                        </Link>
                                        <hr className="border-white/5 my-1" />
                                        <button
                                            onClick={handleDisconnect}
                                            className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                                        >
                                            <LogOut size={14} />
                                            Disconnect
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}

