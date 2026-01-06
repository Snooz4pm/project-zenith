'use client';

import Link from 'next/link';
import { Wallet } from 'lucide-react';
import { useDirectWallet } from '@/components/wallet/DirectConnectButton';
import { connectWallet, disconnectWallet } from '@/lib/connectWallet';

export default function MobileTopNav() {
  const { isConnected: connected, publicKey } = useDirectWallet();

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 md:hidden bg-[var(--void)]/95 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center justify-between h-16 px-4" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="relative w-8 h-8 flex items-center justify-center">
              <div
                className="absolute inset-0 bg-[var(--accent-mint)] opacity-20"
                style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
              />
              <div
                className="absolute inset-[2px] bg-[var(--void)]"
                style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
              />
              <span className="relative text-[var(--accent-mint)] font-bold text-base" style={{ fontFamily: "var(--font-display)" }}>Z</span>
            </div>
            <span className="text-sm font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>Zenith</span>
          </Link>

          {/* Right Actions - Connect Wallet */}
          <div className="flex items-center gap-2">
            {!connected ? (
              <button
                onClick={() => connectWallet()}
                className="p-2 bg-[var(--accent-mint)]/10 text-[var(--accent-mint)] rounded-lg active:scale-95 transition-transform"
              >
                <Wallet size={20} />
              </button>
            ) : (
              <button
                onClick={() => disconnectWallet()}
                className="p-1 rounded-full border border-white/10"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent-mint)] to-[var(--accent-cyan)] flex items-center justify-center text-xs font-bold text-white">
                  {publicKey?.slice(0, 2).toUpperCase()}
                </div>
              </button>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
