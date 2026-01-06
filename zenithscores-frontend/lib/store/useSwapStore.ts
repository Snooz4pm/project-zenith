import { create } from 'zustand';
import { SOL_MINT, USDC_MINT } from '@/lib/solana/addresses';

export interface SelectedToken {
    symbol: string;
    address: string;
    decimals?: number;
    logoURI?: string;
}

export type SwapIntent = {
    toToken: SelectedToken;
    source: 'card' | 'manual';
};

interface SwapState {
    fromToken: SelectedToken;
    toToken: SelectedToken;
    intent: SwapIntent | null;

    setFromToken: (token: SelectedToken) => void;
    setToToken: (token: SelectedToken) => void;
    setIntent: (intent: SwapIntent | null) => void;
}

// Default to SOL -> USDC
const DEFAULT_FROM = { symbol: 'SOL', address: SOL_MINT, decimals: 9 };
const DEFAULT_TO = { symbol: 'USDC', address: USDC_MINT, decimals: 6 };

export const useSwapStore = create<SwapState>((set) => ({
    fromToken: DEFAULT_FROM,
    toToken: DEFAULT_TO,
    intent: null,

    setFromToken: (token) => set({ fromToken: token }),
    setToToken: (token) => set({ toToken: token }),
    setIntent: (intent) => set({ intent }),
}));
