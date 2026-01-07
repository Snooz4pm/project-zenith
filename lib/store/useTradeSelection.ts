import { create } from 'zustand';

export type Token = {
    address: string;
    symbol: string;
    name?: string;
    logoURI?: string;
    decimals?: number;
};

type TradeState = {
    selectedToken: Token | null;
    setSelectedToken: (token: Token) => void;
};

export const useTradeSelection = create<TradeState>((set) => ({
    selectedToken: null,
    setSelectedToken: (token) => set({ selectedToken: token }),
}));
