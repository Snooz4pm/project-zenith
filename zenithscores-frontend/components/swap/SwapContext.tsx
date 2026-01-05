'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { SOL_MINT, USDC_MINT } from '@/lib/solana/addresses';
import { ZenithToken } from '@/lib/tokenTrustEngine';

// Default Tokens
const DEFAULT_FROM = { symbol: 'SOL', address: SOL_MINT, decimals: 9 };
const DEFAULT_TO = { symbol: 'USDC', address: USDC_MINT, decimals: 6 };

interface SelectedToken {
    symbol: string;
    address: string; // mint
    decimals?: number;
}

interface SwapContextType {
    fromToken: SelectedToken;
    toToken: SelectedToken;
    setFromToken: (token: SelectedToken) => void;
    setToToken: (token: SelectedToken) => void;
    // Helpers to set from ZenithToken directly
    setFromZenith: (token: ZenithToken) => void;
    setToZenith: (token: ZenithToken) => void;
}

const SwapContext = createContext<SwapContextType | undefined>(undefined);

export function SwapProvider({ children }: { children: ReactNode }) {
    const [fromToken, setFromToken] = useState<SelectedToken>(DEFAULT_FROM);
    const [toToken, setToToken] = useState<SelectedToken>(DEFAULT_TO);

    const setFromZenith = (token: ZenithToken) => {
        setFromToken({
            symbol: token.symbol,
            address: token.mint,
            // We assume decimals might be needed later, for now optional or default
            decimals: 6
        });
    };

    const setToZenith = (token: ZenithToken) => {
        setToToken({
            symbol: token.symbol,
            address: token.mint,
            decimals: 6
        });
    };

    return (
        <SwapContext.Provider value={{
            fromToken,
            toToken,
            setFromToken,
            setToToken,
            setFromZenith,
            setToZenith
        }}>
            {children}
        </SwapContext.Provider>
    );
}

export function useSwap() {
    const context = useContext(SwapContext);
    if (context === undefined) {
        throw new Error('useSwap must be used within a SwapProvider');
    }
    return context;
}
