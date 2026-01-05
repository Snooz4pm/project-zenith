'use client';

import { Wallet } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useWalletIdentity } from '@/lib/wallet-identity';

interface WalletGateProps {
  /** Message to display above the connect button */
  message?: string;
  /** Additional CSS classes */
  className?: string;
  /** Action being gated (for analytics/logging) */
  action?: string;
  /** If true, requires authenticated user, not just connected wallet */
  requireAuth?: boolean;
}

const DEFAULT_MESSAGE = "Connect your wallet to track learning, join communities, and interact with others.";

/**
 * Soft inline gate for features requiring wallet
 * Shows a friendly prompt - no popup, no paywall
 */
export default function WalletGate({ 
  message = DEFAULT_MESSAGE,
  className = "",
  action = "interact",
  requireAuth = true
}: WalletGateProps) {
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();
  const { isAuthenticated, authenticate, isLoading } = useWalletIdentity();

  // If only connection needed and wallet is connected, don't show
  if (!requireAuth && connected) return null;

  // If auth needed and user is authenticated, don't show
  if (requireAuth && isAuthenticated) return null;

  const handleClick = async () => {
    if (!connected) {
      setVisible(true);
    } else if (!isAuthenticated) {
      await authenticate();
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center p-6 rounded-xl bg-white/[0.02] border border-white/10 text-center ${className}`}>
      <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
        <Wallet className="w-6 h-6 text-emerald-400" />
      </div>
      
      <p className="text-sm text-zinc-400 whitespace-pre-line mb-4 max-w-xs">
        {message}
      </p>
      
      <button
        onClick={handleClick}
        disabled={isLoading}
        className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-emerald-500 text-black hover:bg-emerald-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Connecting...' : connected ? 'Sign to Continue' : 'Connect Wallet'}
      </button>
    </div>
  );
}
