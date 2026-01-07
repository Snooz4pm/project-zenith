'use client';

/**
 * DirectConnectButton - BULLETPROOF WALLET CONNECTION
 * 
 * RULES (NON-NEGOTIABLE):
 * - connect() must be called synchronously in click handler
 * - NO await before connect()
 * - NO useEffect calling connect()
 * - NO auto-connect logic
 * - NO direct window.phantom access for connect
 */

import { Wallet, Loader2 } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';

interface DirectConnectButtonProps {
  onConnect?: (publicKey: string) => void;
  className?: string;
}

export function DirectConnectButton({
  onConnect,
  className
}: DirectConnectButtonProps) {
  const { publicKey, connected, connecting, connect, select, wallets } = useWallet();

  // Already connected - hide button
  if (connected && publicKey) {
    return null;
  }

  const handleClick = () => {
    // 🔥 MUST be direct, sync, user click - NO AWAIT BEFORE THIS

    // First, try to select Phantom if available
    const phantomWallet = wallets.find(w =>
      w.adapter.name.toLowerCase().includes('phantom')
    );

    if (phantomWallet && phantomWallet.readyState === 'Installed') {
      select(phantomWallet.adapter.name);
    }

    // Then connect immediately - this opens the wallet popup
    connect().catch((err) => {
      // Silent catch - user rejected or no wallet
      if (!err?.message?.includes('User rejected')) {
        console.error('[DirectConnectButton] Connect error:', err);
      }
    });
  };

  return (
    <button
      onClick={handleClick}
      disabled={connecting}
      className={className || "flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"}
    >
      {connecting ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          <Wallet size={16} />
          Connect Wallet
        </>
      )}
    </button>
  );
}

/**
 * Hook for wallet state - simplified, uses wallet adapter only
 */
export function useDirectWallet() {
  const { publicKey, connected, connect, disconnect } = useWallet();

  return {
    publicKey: publicKey?.toString() || null,
    isConnected: connected,
    connect: () => {
      // This should only be called from a click handler!
      connect().catch(() => { });
    },
    disconnect: () => {
      disconnect().catch(() => { });
    }
  };
}
