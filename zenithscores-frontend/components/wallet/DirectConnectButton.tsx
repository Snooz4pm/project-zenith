'use client';

import { Wallet, Loader2, ExternalLink, LogOut } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

/**
 * DirectConnectButton
 * 
 * Wallet adapter based connection - Phantom trusted flow.
 * Uses @solana/wallet-adapter-react (the standard).
 * 
 * Click → Wallet adapter triggers Phantom → Clean UX
 */

interface DirectConnectButtonProps {
  onConnect?: (publicKey: string) => void;
  onDisconnect?: () => void;
  className?: string;
}

export function DirectConnectButton({ 
  onConnect, 
  onDisconnect,
  className 
}: DirectConnectButtonProps) {
  const { 
    publicKey, 
    connected, 
    connecting, 
    disconnect,
    select,
    wallets,
    connect
  } = useWallet();

  const [isConnecting, setIsConnecting] = useState(false);

  // Notify parent when connection changes
  useEffect(() => {
    if (connected && publicKey) {
      onConnect?.(publicKey.toString());
    }
  }, [connected, publicKey, onConnect]);

  const handleConnect = useCallback(async () => {
    setIsConnecting(true);

    try {
      // Find Phantom wallet adapter
      const phantomWallet = wallets.find(w => 
        w.adapter.name.toLowerCase().includes('phantom')
      );

      if (phantomWallet) {
        // Select Phantom adapter
        select(phantomWallet.adapter.name);
        
        // Small delay for adapter to register
        await new Promise(r => setTimeout(r, 100));
        
        // Connect via adapter (triggers Phantom popup)
        await connect();
      } else {
        // No Phantom found - redirect to install
        window.open('https://phantom.app/', '_blank', 'noopener,noreferrer');
      }
    } catch (error: any) {
      // User rejected or error
      if (!error.message?.includes('rejected')) {
        console.error('[DirectConnectButton] Connection error:', error);
      }
    } finally {
      setIsConnecting(false);
    }
  }, [wallets, select, connect]);

  const handleDisconnect = useCallback(async () => {
    await disconnect();
    onDisconnect?.();
  }, [disconnect, onDisconnect]);

  // Check if Phantom is available
  const phantomAvailable = wallets.some(w => 
    w.adapter.name.toLowerCase().includes('phantom') && w.readyState === 'Installed'
  );

  // Connected state - show disconnect option or hide
  if (connected && publicKey) {
    return null; // Parent handles profile display
  }

  const isLoading = isConnecting || connecting;

  // Button content based on state
  const getButtonContent = () => {
    if (isLoading) {
      return (
        <>
          <Loader2 size={16} className="animate-spin" />
          Connecting...
        </>
      );
    }

    if (!phantomAvailable) {
      return (
        <>
          <ExternalLink size={16} />
          Install Phantom
        </>
      );
    }

    return (
      <>
        <Wallet size={16} />
        Connect Wallet
      </>
    );
  };

  return (
    <button
      onClick={handleConnect}
      disabled={isLoading}
      className={className || "flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"}
    >
      {getButtonContent()}
    </button>
  );
}

/**
 * Hook for wallet connection state
 * Uses wallet adapter (Phantom-trusted)
 */
export function useDirectWallet() {
  const { publicKey, connected, connect, disconnect } = useWallet();

  return {
    publicKey: publicKey?.toString() || null,
    isConnected: connected,
    connect,
    disconnect
  };
}
