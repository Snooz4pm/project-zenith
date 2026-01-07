'use client';

/**
 * Wallet Identity Context
 * 
 * Simple wallet-based identity without NextAuth.
 * Uses Solana wallet adapter for connection, custom API for user resolution.
 */

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import bs58 from 'bs58';

interface UserProfile {
    id: string;
    bio?: string | null;
    avatar?: string | null;
    isPublic: boolean;
}

interface User {
    id: string;
    walletAddress: string;
    username?: string | null;
    profile?: UserProfile | null;
}

interface WalletIdentityContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    authenticate: () => Promise<boolean>;
    disconnect: () => void;
    requireAuth: (action: string) => Promise<boolean>;
}

const WalletIdentityContext = createContext<WalletIdentityContextType | undefined>(undefined);

const AUTH_MESSAGE = 'Sign this message to connect your wallet to ZenithScores.\n\nThis request will not trigger a blockchain transaction or cost any gas fees.';

export function WalletIdentityProvider({ children }: { children: ReactNode }) {
    const { publicKey, signMessage, connected, disconnect: walletDisconnect } = useWallet();
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Check if wallet is already registered when connected
    useEffect(() => {
        if (connected && publicKey) {
            checkExistingUser();
        } else {
            setUser(null);
        }
    }, [connected, publicKey]);

    const checkExistingUser = async () => {
        if (!publicKey) return;

        try {
            const res = await fetch(`/api/auth/wallet?wallet=${publicKey.toBase58()}`);
            const data = await res.json();
            if (data.user) {
                setUser(data.user);
            }
        } catch (error) {
            console.error('[WalletIdentity] Failed to check existing user:', error);
        }
    };

    const authenticate = useCallback(async (): Promise<boolean> => {
        if (!publicKey || !signMessage) {
            console.warn('[WalletIdentity] Wallet not connected');
            return false;
        }

        setIsLoading(true);
        try {
            // Sign the auth message
            const messageBytes = new TextEncoder().encode(AUTH_MESSAGE);
            const signature = await signMessage(messageBytes);
            const signatureBase58 = bs58.encode(signature);

            // Authenticate with backend
            const res = await fetch('/api/auth/wallet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress: publicKey.toBase58(),
                    signature: signatureBase58,
                    message: AUTH_MESSAGE
                })
            });

            const data = await res.json();

            if (data.success && data.user) {
                setUser(data.user);
                return true;
            } else {
                console.error('[WalletIdentity] Auth failed:', data.error);
                return false;
            }
        } catch (error) {
            console.error('[WalletIdentity] Authentication error:', error);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [publicKey, signMessage]);

    const disconnect = useCallback(() => {
        setUser(null);
        walletDisconnect();
    }, [walletDisconnect]);

    /**
     * Require authentication for an action.
     * If not authenticated, prompts user to sign.
     * Returns true if authenticated, false if user cancelled.
     */
    const requireAuth = useCallback(async (action: string): Promise<boolean> => {
        if (user) return true;

        if (!connected || !publicKey) {
            // Wallet not connected - user needs to connect first
            console.log(`[WalletIdentity] Action "${action}" requires wallet connection`);
            return false;
        }

        // Wallet connected but not authenticated - request signature
        console.log(`[WalletIdentity] Action "${action}" requires authentication`);
        return authenticate();
    }, [user, connected, publicKey, authenticate]);

    return (
        <WalletIdentityContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: !!user,
                authenticate,
                disconnect,
                requireAuth
            }}
        >
            {children}
        </WalletIdentityContext.Provider>
    );
}

export function useWalletIdentity() {
    const context = useContext(WalletIdentityContext);
    if (!context) {
        throw new Error('useWalletIdentity must be used within WalletIdentityProvider');
    }
    return context;
}

/**
 * Helper hook for actions that require authentication
 */
export function useRequireAuth() {
    const { requireAuth, isAuthenticated, user } = useWalletIdentity();

    return {
        isAuthenticated,
        user,
        /**
         * Wrap an action to require authentication
         */
        withAuth: async <T,>(action: string, callback: () => Promise<T>): Promise<T | null> => {
            const authed = await requireAuth(action);
            if (!authed) return null;
            return callback();
        }
    };
}
