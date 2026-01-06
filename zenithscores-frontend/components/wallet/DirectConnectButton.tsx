'use client';

import { Wallet, Loader2, ExternalLink } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { connectWallet, autoReconnect, disconnectWallet } from '@/lib/connectWallet';
import { getPhantom, isPhantomInstalled } from '@/lib/phantom';

/**
 * DirectConnectButton
 * 
 * Production-grade Phantom connection — no modal, no bullshit.
 * Same behavior as Jupiter, Raydium, Drift, Tensor.
 * 
 * Click → Phantom opens instantly
 * No modal
 * No extra clicks
 * Clean terminal behavior
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
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedKey, setConnectedKey] = useState<string | null>(null);
  const [phantomInstalled, setPhantomInstalled] = useState<boolean | null>(null);

  // Check Phantom installation on mount
  useEffect(() => {
    setPhantomInstalled(isPhantomInstalled());
  }, []);

  // Auto-reconnect on mount (silent, no popup)
  useEffect(() => {
    const tryAutoReconnect = async () => {
      const result = await autoReconnect();
      if (result.success && result.publicKey) {
        setConnectedKey(result.publicKey);
        onConnect?.(result.publicKey);
      }
    };
    
    tryAutoReconnect();
  }, [onConnect]);

  // Listen for Phantom events
  useEffect(() => {
    const phantom = getPhantom();
    if (!phantom) return;

    const handleConnect = () => {
      const key = phantom.publicKey?.toString();
      if (key) {
        setConnectedKey(key);
        onConnect?.(key);
      }
    };

    const handleDisconnect = () => {
      setConnectedKey(null);
      onDisconnect?.();
    };

    const handleAccountChanged = (publicKey: any) => {
      if (publicKey) {
        setConnectedKey(publicKey.toString());
        onConnect?.(publicKey.toString());
      } else {
        setConnectedKey(null);
        onDisconnect?.();
      }
    };

    phantom.on('connect', handleConnect);
    phantom.on('disconnect', handleDisconnect);
    phantom.on('accountChanged', handleAccountChanged);

    return () => {
      phantom.off('connect', handleConnect);
      phantom.off('disconnect', handleDisconnect);
      phantom.off('accountChanged', handleAccountChanged);
    };
  }, [onConnect, onDisconnect]);

  const handleConnect = useCallback(async () => {
    setIsConnecting(true);

    try {
      const result = await connectWallet();
      
      if (result.success && result.publicKey) {
        setConnectedKey(result.publicKey);
        onConnect?.(result.publicKey);
      }
    } catch (error) {
      console.error('[DirectConnectButton] Connection error:', error);
    } finally {
      setIsConnecting(false);
    }
  }, [onConnect]);

  const handleDisconnect = useCallback(async () => {
    await disconnectWallet();
    setConnectedKey(null);
    onDisconnect?.();
  }, [onDisconnect]);

  // Already connected — don't show button (parent handles profile display)
  if (connectedKey) return null;

  // Button text based on state
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
 * Hook for direct Phantom connection state
 * Use this in components that need wallet state without the button
 */
export function useDirectWallet() {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const phantom = getPhantom();
    if (!phantom) return;

    // Check initial state
    if (phantom.isConnected && phantom.publicKey) {
      setPublicKey(phantom.publicKey.toString());
      setIsConnected(true);
    }

    const handleConnect = () => {
      const key = phantom.publicKey?.toString();
      if (key) {
        setPublicKey(key);
        setIsConnected(true);
      }
    };

    const handleDisconnect = () => {
      setPublicKey(null);
      setIsConnected(false);
    };

    phantom.on('connect', handleConnect);
    phantom.on('disconnect', handleDisconnect);

    return () => {
      phantom.off('connect', handleConnect);
      phantom.off('disconnect', handleDisconnect);
    };
  }, []);

  return {
    publicKey,
    isConnected,
    connect: connectWallet,
    disconnect: disconnectWallet
  };
}
