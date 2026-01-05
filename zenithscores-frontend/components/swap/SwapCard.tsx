'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { TokenInput } from './TokenInput';
import { RoutePreview } from './RoutePreview';
import { SwapButton } from './SwapButton';
import { ArrowDown, Settings } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { getQuote, swap } from '@/lib/api/backend';
import { SOL_MINT, USDC_MINT } from '@/lib/solana/addresses';
import { VersionedTransaction } from '@solana/web3.js';

export default function SwapCard() {
    const { connected, publicKey, signTransaction, sendTransaction } = useWallet();
    const { setVisible } = useWalletModal();

    const [fromAmount, setFromAmount] = useState("");
    const [toAmount, setToAmount] = useState("");
    const [quote, setQuote] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [swapState, setSwapState] = useState<'idle' | 'loading' | 'success' | 'error' | 'connect'>('idle');

    // Hardcoded for skeleton phase
    const [fromToken] = useState({ symbol: 'SOL', address: SOL_MINT, decimals: 9 });
    const [toToken] = useState({ symbol: 'USDC', address: USDC_MINT, decimals: 6 });

    // Fetch Quote
    useEffect(() => {
        const fetchQuote = async () => {
            if (!fromAmount || parseFloat(fromAmount) <= 0) {
                setQuote(null);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const amountInSmallestUnit = Math.floor(parseFloat(fromAmount) * Math.pow(10, fromToken.decimals));

                const params = new URLSearchParams({
                    inputMint: fromToken.address,
                    outputMint: toToken.address,
                    amount: amountInSmallestUnit.toString(),
                    slippageBps: '50' // 0.5%
                });

                const data = await getQuote(params);
                setQuote(data);

                if (data.outAmount) {
                    const out = parseInt(data.outAmount) / Math.pow(10, toToken.decimals);
                    setToAmount(out.toFixed(6));
                }

            } catch (err) {
                setError('Failed to fetch quote');
                console.error(err);
            } finally {
                setIsLoading(false);
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

        if (!quote || !publicKey || !signTransaction) return;

        setSwapState('loading');

        try {
            // 1. Get Transaction from Backend
            const { swapTransaction } = await swap({
                quoteResponse: quote,
                userPublicKey: publicKey.toBase58(),
                wrapAndUnwrapSol: true
            });

            // 2. Sign and Send
            const transaction = VersionedTransaction.deserialize(Buffer.from(swapTransaction, 'base64'));

            const signature = await sendTransaction(transaction, {
                skipPreflight: false,
                maxRetries: 2
            } as any);

            console.log('Swap confirmed:', signature);
            setSwapState('success');

        } catch (err) {
            console.error('Swap execution failed:', err);
            setSwapState('error');
        } finally {
            setTimeout(() => setSwapState('idle'), 3000);
        }
    };

    return (
        <Card className="max-w-md mx-auto space-y-4 p-6 bg-[#0B0E15]">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-white">Swap</h2>
                <button className="text-zinc-500 hover:text-white transition-colors">
                    <Settings className="w-5 h-5" />
                </button>
            </div>

            <TokenInput
                label="From"
                amount={fromAmount}
                onChangeAmount={setFromAmount}
                tokenSymbol={fromToken.symbol}
            />

            <div className="flex justify-center -my-2 relative z-10">
                <button className="p-2 bg-[#111116] border border-white/10 rounded-full hover:bg-white/10">
                    <ArrowDown className="w-4 h-4 text-zinc-400" />
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

            <SwapButton
                onClick={handleSwap}
                state={!connected ? 'connect' : swapState === 'idle' ? 'idle' : swapState}
            />
        </Card>
    );
}
