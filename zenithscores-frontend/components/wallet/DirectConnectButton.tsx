'use client';

import { Wallet, Loader2, ExternalLink } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

/**
 * DirectConnectButton
 * 
 * Hybrid approach: Uses wallet adapter state but triggers Phantom directly.
 * This ensures Phantom opens immediately on click (user intent = clear).
 */

interface DirectConnectButtonProps {
  onConnect?: (publicKey: string) => void;
  onDisconnect?: () => void;
  className?: string;
}

// Get Phantom provider directly
function getPhantom() {
  if (typeof window === 'undefined') return null;
  const anyWindow = window as any;
  if (anyWindow.solana?.isPhantom) return anyWindow.solana;
  if (anyWindow.phantom?.solana?.isPhantom) return anyWindow.phantom.solana;
  return null;
}

export function DirectConnectButton({ 
  onConnect, 
  onDisconnect,
  className 
}: DirectConnectButtonProps) {
  const { publicKey, connected, select, wallets } = useWallet();
  const [isConnecting, setIsConnecting] = useState(false);
  const [phantomInstalled, setPhantomInstalled] = useState<boolean | null>(null);
  const [connectedKey, setConnectedKey] = useState<string | null>(null);

  // Check Phantom on mount
  useEffect(() => {
    setPhantomInstalled(!!getPhantom());
  }, []);

  // Sync with wallet adapter state
  useEffect(() => {
    if (connected && publicKey) {
      const key = publicKey.toString();
      setConnectedKey(key);
      onConnect?.(key);
    }
  }, [connected, publicKey, onConnect]);

  // Listen to direct Phantom events
  useEffect(() => {
    const phantom = getPhantom();
    if (!phantom) return;

    const handleConnect = () => {
      const key = phantom.publicKey?.toString();
      if (key) {
        setConnectedKey(key);
        onConnect?.(key);
        
        // Also select in wallet adapter for sendTransaction to work
        const phantomAdapter = wallets.find(w => 
          w.adapter.name.toLowerCase().includes('phantom')
        );
        if (phantomAdapter) {
          select(phantomAdapter.adapter.name);
        }
      }
    };

    const handleDisconnect = () => {
      setConnectedKey(null);
      onDisconnect?.();
    };

    // Check if already connected
    if (phantom.isConnected && phantom.publicKey) {
      handleConnect();
    }

    phantom.on('connect', handleConnect);
    phantom.on('disconnect', handleDisconnect);

    return () => {
      phantom.off('connect', handleConnect);
      phantom.off('disconnect', handleDisconnect);
    };
  }, [onConnect, onDisconnect, wallets, select]);

  // Auto-reconnect (silent, trusted users only)
  useEffect(() => {
    const phantom = getPhantom();
    if (!phantom || phantom.isConnected) return;

    // Try silent reconnect for returning users
    phantom.connect({ onlyIfTrusted: true }).catch(() => {
      // Silent fail - user hasn't trusted yet
    });
  }, []);

  const handleConnect = useCallback(async () => {
    const phantom = getPhantom();

    if (!phantom) {
      // Phantom not installed - open install page
      window.open('https://phantom.app/', '_blank', 'noopener,noreferrer');
      return;
    }

    setIsConnecting(true);

    try {
      // Direct Phantom connect - opens popup immediately
      const response = await phantom.connect({ onlyIfTrusted: false });
      const key = response.publicKey.toString();
      
      setConnectedKey(key);
      onConnect?.(key);

      // Select in wallet adapter so sendTransaction works
      const phantomAdapter = wallets.find(w => 
        w.adapter.name.toLowerCase().includes('phantom')
      );
      if (phantomAdapter) {
        select(phantomAdapter.adapter.name);
      }
    } catch (error: any) {
      if (!error.message?.includes('User rejected')) {
        console.error('[DirectConnectButton] Connection error:', error);
      }
    } finally {
      setIsConnecting(false);
    }
  }, [onConnect, wallets, select]);

  // Already connected - hide button
  if (connectedKey || (connected && publicKey)) {
    return null;
  }

  const getButtonContent = () => {
    if (isConnecting) {
      return (
        <>
          <Loader2 size={16} className="animate-spin" />
          Connecting...
        </>
      );
    }

    if (phantomInstalled === false) {
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
      disabled={isConnecting}
      className={className || "flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"}
    >
      {getButtonContent()}
    </button>
  );
}

/**
 * Hook for wallet state - works with both direct and adapter connections
 */
export function useDirectWallet() {
  const { publicKey: adapterKey, connected: adapterConnected } = useWallet();
  const [directKey, setDirectKey] = useState<string | null>(null);

  useEffect(() => {
    const phantom = getPhantom();
    if (!phantom) return;

    const updateKey = () => {
      if (phantom.isConnected && phantom.publicKey) {
        setDirectKey(phantom.publicKey.toString());
      } else {
        setDirectKey(null);
      }
    };

    updateKey();
    phantom.on('connect', updateKey);
    phantom.on('disconnect', () => setDirectKey(null));

    return () => {
      phantom.off('connect', updateKey);
      phantom.off('disconnect', () => setDirectKey(null));
    };
  }, []);

  // Use adapter key if available, else direct key
  const publicKey = adapterKey?.toString() || directKey;
  const isConnected = adapterConnected || !!directKey;

  return {
    publicKey,
    isConnected,
    connect: async () => {
      const phantom = getPhantom();
      if (phantom) {
        await phantom.connect({ onlyIfTrusted: false });
      }
    },
    disconnect: async () => {
      const phantom = getPhantom();
      if (phantom) {
        await phantom.disconnect();
      }
    }
  };
}
