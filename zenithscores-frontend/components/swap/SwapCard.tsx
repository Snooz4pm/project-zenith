'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { TokenInput } from './TokenInput';
import { RoutePreview } from './RoutePreview';
import { SwapButton } from './SwapButton';
import { TokenChip } from './TokenChip';
import { ArrowDown, Settings, Wallet } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { SOL_MINT, USDC_MINT } from '@/lib/solana/addresses';

// Mock function for now
async function getQuote(params: any) {
    return null;
}

// Mock function for now
async function swap(body: any) {
    return { swapTransaction: '' };
}

const POPULAR_TOKENS = [
    { symbol: 'SOL', address: SOL_MINT },
    { symbol: 'USDC', address: USDC_MINT },
    { symbol: 'JUP', address: 'JUPyiwrYJFskUPiHa7hkeR8VUtk641KP9p7v+E81' }, // Dummy address for now
    { symbol: 'RAY', address: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R' },
];

export default function SwapCard() {
    const { connected, publicKey } = useWallet();
    const { setVisible } = useWalletModal();

    const [fromAmount, setFromAmount] = useState("");
    const [toAmount, setToAmount] = useState("");
    const [quote, setQuote] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [swapState, setSwapState] = useState<'idle' | 'loading' | 'success' | 'error' | 'connect'>('idle');

    // Default to SOL -> USDC (Smart Default)
    const [fromToken, setFromToken] = useState({ symbol: 'SOL', address: SOL_MINT, decimals: 9 });
    const [toToken, setToToken] = useState({ symbol: 'USDC', address: USDC_MINT, decimals: 6 });

    // Fetch Quote (Runs regardless of wallet connection)
    useEffect(() => {
        const fetchQuote = async () => {
            if (!fromAmount || parseFloat(fromAmount) <= 0) {
                setQuote(null);
                return;
            }
            // Placeholder logic for visual feedback
            const out = parseFloat(fromAmount) * 142.50; // Mock price
            setToAmount(out.toFixed(6));
            setQuote({ price: 142.50, inputMint: fromToken.symbol, outputMint: toToken.symbol });
        };

        const debounce = setTimeout(fetchQuote, 500);
        return () => clearTimeout(debounce);
    }, [fromAmount, fromToken, toToken]);

    const handleSwap = async () => {
        if (!connected) {
            setVisible(true);
            return;
        }
        console.log('Swap skeleton clicked');
        setSwapState('success');
        setTimeout(() => setSwapState('idle'), 2000);
    };

    const handleChipClick = (symbol: string) => {
        // Simple logic: if click SOL, set as input. If click others, set as output (unless input is already that)
        if (symbol === 'SOL') {
            setFromToken({ symbol: 'SOL', address: SOL_MINT, decimals: 9 });
        } else {
            setToToken({ symbol: symbol, address: '...', decimals: 6 });
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto space-y-4 p-6 bg-[#0B0E15] border-white/5 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-white">Swap</h2>
                <div className="flex items-center gap-2">
                    {!connected && (
                        <button
                            onClick={() => setVisible(true)}
                            className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                        >
                            Connect
                        </button>
                    )}
                    <button className="text-zinc-500 hover:text-white transition-colors">
                        <Settings className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Popular Tokens Chips */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mask-fade">
                {POPULAR_TOKENS.map((t) => (
                    <TokenChip
                        key={t.symbol}
                        symbol={t.symbol}
                        onClick={() => handleChipClick(t.symbol)}
                        className={toToken.symbol === t.symbol ? "bg-white/10 text-white border-white/20" : ""}
                    />
                ))}
            </div>

            <TokenInput
                label="From"
                amount={fromAmount}
                onChangeAmount={setFromAmount}
                tokenSymbol={fromToken.symbol}
            />

            <div className="flex justify-center -my-3 relative z-10">
                <button className="p-2 bg-[#0B0E15] border border-white/10 rounded-full hover:bg-white/10 transition-colors group">
                    <ArrowDown className="w-4 h-4 text-zinc-400 group-hover:text-white" />
                </button>
            </div>

            <TokenInput
                label="To"
                amount={toAmount}
                onChangeAmount={setToAmount}
                tokenSymbol={toToken.symbol}
                readOnly
            />

            <RoutePreview quote={quote} isLoading={isLoading} error={error} />

            <div className="pt-2">
                <SwapButton
                    onClick={handleSwap}
                    state={!connected ? 'connect' : swapState === 'idle' ? 'idle' : swapState}
                />
            </div>

            {!connected && (
                <p className="text-center text-xs text-zinc-500 mt-2">
                    Connect wallet to execute trade
                </p>
            )}
        </Card>
    );
}
