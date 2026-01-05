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
import { buildZenithTokens, ZenithToken, getLivePrice } from '@/lib/tokenTrustEngine';

// Mock function for now
async function getQuote(params: any) {
    return null;
}

// Mock function for now
async function swap(body: any) {
    return { swapTransaction: '' };
}

export default function SwapCard() {
    const { connected, publicKey } = useWallet();
    const { setVisible } = useWalletModal();

    const [fromAmount, setFromAmount] = useState("");
    const [toAmount, setToAmount] = useState("");
    const [quote, setQuote] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [swapState, setSwapState] = useState<'idle' | 'loading' | 'success' | 'error' | 'connect'>('idle');

    // Default to SOL -> USDC
    const [fromToken, setFromToken] = useState({ symbol: 'SOL', address: SOL_MINT, decimals: 9 });
    const [toToken, setToToken] = useState({ symbol: 'USDC', address: USDC_MINT, decimals: 6 });

    const [popularTokens, setPopularTokens] = useState<ZenithToken[]>([]);

    // Initialize Engine
    useEffect(() => {
        const init = async () => {
            const allTokens = await buildZenithTokens();
            // Filter for specific heavy hitters for the chips row
            const chips = allTokens.filter(t =>
                ['SOL', 'USDC', 'JUP', 'RAY', 'BONK', 'WIF'].includes(t.symbol)
            );
            // Sort to keep consistent order if needed, or trust liquidity sort
            setPopularTokens(chips.length > 0 ? chips : []);
        };
        init();
    }, []);

    // Fetch Quote (Runs regardless of wallet connection)
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;

    useEffect(() => {
        if (!searchParams) return;
        const toMint = searchParams.get('to');
        if (toMint) {
            // We need to fetch metadata if we only have mint. 
            // For now, if we clicked from Signals, we likely want to resolve it.
            // Ideally SwapContext handles this "resolve by mint".
            // Quick fix: If context has "setByMint", use it. 
            // Or just leave it blank and let user search? No, "Auto-fill".
            // I will assume the Context/Input component can verify it, 
            // or I fetch it here quickly from the Engine cache?
            // Easier: Client side fetch single jup token?
            // Actually, let's just let the user standard selector handle it?
            // NO, the requirement is "Auto fill".
            // I will implement a quick fetch in useEffect 
            buildZenithTokens().then(list => {
                const found = list.find(t => t.mint === toMint);
                if (found) {
                    setToToken({ symbol: found.symbol, address: found.mint, decimals: 6 }); // decimals guess
                }
            });
        }
    }, []);

    // Fetch Quote (Real-time prices via Jupiter API Free)
    useEffect(() => {
        const fetchQuote = async () => {
            if (!fromAmount || parseFloat(fromAmount) <= 0) {
                setQuote(null);
                return;
            }

            try {
                // Fetch live prices for input/output tokens
                const prices = await getLivePrice([fromToken.address, toToken.address]);
                const inputPrice = prices[fromToken.address];
                const outputPrice = prices[toToken.address];

                if (inputPrice && outputPrice) {
                    const totalValue = parseFloat(fromAmount) * inputPrice;
                    const estimatedOutput = totalValue / outputPrice;

                    setToAmount(estimatedOutput.toFixed(6));
                    setQuote({
                        price: inputPrice / outputPrice,
                        inputMint: fromToken.symbol,
                        outputMint: toToken.symbol
                    });
                }
            } catch (err) {
                console.error("Failed to fetch price quote", err);
            }
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

    const handleChipClick = (token: ZenithToken) => {
        if (token.symbol === 'SOL') {
            setFromToken({ symbol: token.symbol, address: token.mint, decimals: 9 });
        } else {
            setToToken({ symbol: token.symbol, address: token.mint, decimals: 6 });
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto space-y-4 p-6 bg-[#0B0E15] border-white/5 shadow-2xl backdrop-blur-xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-white tracking-tight">Swap</h2>
                <div className="flex items-center gap-2">
                    <button className="text-zinc-500 hover:text-white transition-colors">
                        <Settings className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Popular Tokens Chips */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mask-fade">
                {popularTokens.map((t) => (
                    <TokenChip
                        key={t.mint}
                        symbol={t.symbol}
                        onClick={() => handleChipClick(t)}
                        className={toToken.symbol === t.symbol ? "bg-white/10 text-white border-white/20" : ""}
                    />
                ))}
                {popularTokens.length === 0 && (
                    // Fallback chips if fetch fails/loading
                    ['SOL', 'USDC', 'JUP'].map(s => (
                        <TokenChip key={s} symbol={s} onClick={() => { }} className="opacity-50" />
                    ))
                )}
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
