'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useSession } from 'next-auth/react';
import { parseUnits } from 'viem';
import { TrendingUp, TrendingDown, Wallet, Shield, Zap, RefreshCw } from 'lucide-react';
import OrderPanel from '@/components/arena/OrderPanel';
import PositionsTable from '@/components/arena/PositionsTable';
import TokenSelector from '@/components/arena/TokenSelector';
import PriceChart from '@/components/arena/PriceChart';
import { ArenaToken, ARENA_TOKENS, PositionSide, PositionWithPnL, ArenaPosition } from '@/lib/arena/types';
import { enrichPositionWithPnL } from '@/lib/arena/pnl';
import { TokenPrice } from '@/lib/arena/prices';

// ERC20 ABI for token approvals
const ERC20_ABI = [
    {
        name: 'approve',
        type: 'function',
        inputs: [
            { name: 'spender', type: 'address' },
            { name: 'amount', type: 'uint256' },
        ],
        outputs: [{ type: 'bool' }],
    },
] as const;

// 0x Exchange Proxy address (Ethereum mainnet)
const ZEROX_EXCHANGE_PROXY = '0xDef1C0ded9bec7F1a1670819833240f027b25EfF';

// USDC address
const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

export default function ArenaPage() {
    const { address, isConnected } = useAccount();
    const { data: session } = useSession();
    const { writeContract, data: txHash } = useWriteContract();
    const { isLoading: isTxPending, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({ hash: txHash });

    const [selectedToken, setSelectedToken] = useState<ArenaToken | null>(ARENA_TOKENS[0]);
    const [positions, setPositions] = useState<PositionWithPnL[]>([]);
    const [isExecuting, setIsExecuting] = useState(false);
    const [isClosing, setIsClosing] = useState<string | null>(null);
    const [prices, setPrices] = useState<Record<string, number>>({});
    const [priceData, setPriceData] = useState<Record<string, TokenPrice>>({});
    const [priceHistory, setPriceHistory] = useState<number[]>([]);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const [isLoadingPrices, setIsLoadingPrices] = useState(true);

    // Fetch real prices from API
    const fetchPrices = useCallback(async () => {
        try {
            const res = await fetch('/api/arena/prices');
            const data = await res.json();

            if (data.prices) {
                const newPrices: Record<string, number> = {};
                Object.entries(data.prices as Record<string, TokenPrice>).forEach(([symbol, tokenPrice]) => {
                    newPrices[symbol] = tokenPrice.price;
                });
                setPriceData(data.prices);
                setPrices(newPrices);
                setLastUpdate(new Date());
            }
        } catch (error) {
            console.error('Failed to fetch prices:', error);
        } finally {
            setIsLoadingPrices(false);
        }
    }, []);

    // Initial price fetch and polling
    useEffect(() => {
        fetchPrices();
        const interval = setInterval(fetchPrices, 30000); // Refresh every 30s (CoinGecko rate limit friendly)
        return () => clearInterval(interval);
    }, [fetchPrices]);

    // Track price history for selected token
    useEffect(() => {
        if (selectedToken && prices[selectedToken.symbol]) {
            setPriceHistory(prev => [...prev.slice(-99), prices[selectedToken.symbol]]);
        }
    }, [prices, selectedToken]);

    // Reset price history when token changes
    useEffect(() => {
        setPriceHistory([]);
    }, [selectedToken?.symbol]);

    // Fetch positions
    const fetchPositions = useCallback(async () => {
        if (!address) return;

        try {
            const res = await fetch(`/api/arena/positions?wallet=${address}&status=open`);
            const data = await res.json();

            if (data.positions) {
                const enriched = data.positions.map((p: ArenaPosition) =>
                    enrichPositionWithPnL(p, prices[p.token] || 0)
                );
                setPositions(enriched);
            }
        } catch (error) {
            console.error('Failed to fetch positions:', error);
        }
    }, [address, prices]);

    useEffect(() => {
        fetchPositions();
        const interval = setInterval(fetchPositions, 15000);
        return () => clearInterval(interval);
    }, [fetchPositions]);

    // Update positions PnL when prices change
    useEffect(() => {
        setPositions(prev =>
            prev.map(p => enrichPositionWithPnL(p, prices[p.token] || 0))
        );
    }, [prices]);

    // Execute trade with 0x (MVP: record position, production: execute swap)
    const handleExecuteTrade = async (side: PositionSide, sizeUSD: number) => {
        if (!address || !selectedToken) return;

        setIsExecuting(true);
        try {
            const currentPrice = prices[selectedToken.symbol];
            if (!currentPrice) throw new Error('Price not available');

            const sizeTokens = sizeUSD / currentPrice;

            // For MVP: Skip actual swap, just record position
            // Production flow would be:
            // 1. Get 0x quote via /api/arena/quote
            // 2. Approve USDC spending if needed
            // 3. Execute swap via writeContract
            // 4. Record position after tx confirmed

            // Record position in database
            const res = await fetch('/api/arena/open-position', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: selectedToken.symbol,
                    tokenAddress: selectedToken.address,
                    side,
                    sizeUSD,
                    walletAddress: address,
                    chainId: selectedToken.chainId,
                    entryPrice: currentPrice,
                    sizeTokens,
                    userId: session?.user?.id,
                }),
            });

            if (res.ok) {
                await fetchPositions();
            } else {
                throw new Error('Failed to record position');
            }
        } catch (error) {
            console.error('Trade execution failed:', error);
        } finally {
            setIsExecuting(false);
        }
    };

    const handleClosePosition = async (positionId: string, currentPrice: number) => {
        setIsClosing(positionId);
        try {
            const res = await fetch('/api/arena/close-position', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    positionId,
                    exitPrice: currentPrice,
                }),
            });

            if (res.ok) {
                await fetchPositions();
            }
        } catch (error) {
            console.error('Failed to close position:', error);
        } finally {
            setIsClosing(null);
        }
    };

    const currentPrice = selectedToken ? prices[selectedToken.symbol] || 0 : 0;
    const currentPriceData = selectedToken ? priceData[selectedToken.symbol] : null;

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white">
            {/* Header */}
            <div className="border-b border-white/5 bg-[#0d0d12]">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                <Zap className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold">Trading Arena</h1>
                                <p className="text-xs text-zinc-500">Non-custodial execution</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Last Update */}
                            <button
                                onClick={fetchPrices}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                            >
                                <RefreshCw size={14} className={`text-zinc-500 ${isLoadingPrices ? 'animate-spin' : ''}`} />
                                <span className="text-xs text-zinc-400">
                                    {lastUpdate ? `Updated ${new Date(lastUpdate).toLocaleTimeString()}` : 'Loading...'}
                                </span>
                            </button>

                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5">
                                <Shield size={14} className="text-emerald-500" />
                                <span className="text-xs text-zinc-400">Non-Custodial</span>
                            </div>
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${isConnected ? 'bg-emerald-500/10' : 'bg-white/5'}`}>
                                <Wallet size={14} className={isConnected ? 'text-emerald-500' : 'text-zinc-500'} />
                                <span className="text-xs">
                                    {isConnected ? `${address?.slice(0, 6)}...${address?.slice(-4)}` : 'Not Connected'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-6">
                {/* Token Selector */}
                <div className="mb-6">
                    <TokenSelector
                        selectedToken={selectedToken}
                        onSelectToken={setSelectedToken}
                        prices={prices}
                    />
                </div>

                {/* Trading Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Chart + Token info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Token Header */}
                        <div className="bg-[#111116] border border-white/10 rounded-xl p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                                        <span className="text-lg font-bold">{selectedToken?.symbol.charAt(0)}</span>
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold">{selectedToken?.symbol}</h2>
                                        <p className="text-sm text-zinc-500">{selectedToken?.name}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-bold">
                                        {isLoadingPrices ? (
                                            <span className="text-zinc-500">Loading...</span>
                                        ) : (
                                            `$${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                        )}
                                    </div>
                                    {currentPriceData && (
                                        <div className={`text-sm flex items-center gap-1 justify-end ${currentPriceData.change24h >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                            {currentPriceData.change24h >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                            {currentPriceData.change24h >= 0 ? '+' : ''}{currentPriceData.change24h.toFixed(2)}% (24h)
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Price Chart */}
                        <PriceChart
                            symbol={selectedToken?.symbol || ''}
                            currentPrice={currentPrice}
                            priceHistory={priceHistory}
                        />

                        {/* Positions Table */}
                        <PositionsTable
                            positions={positions}
                            onClosePosition={handleClosePosition}
                            isClosing={isClosing}
                        />
                    </div>

                    {/* Right: Order Panel */}
                    <div>
                        <OrderPanel
                            selectedToken={selectedToken}
                            currentPrice={currentPrice}
                            walletConnected={isConnected}
                            onExecuteTrade={handleExecuteTrade}
                            isExecuting={isExecuting}
                        />

                        {/* Live Data Indicator */}
                        <div className="mt-4 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-sm text-emerald-500 font-medium">Live Prices</span>
                            </div>
                            <p className="text-xs text-zinc-500">
                                Prices from CoinGecko. Updates every 30s.
                            </p>
                        </div>

                        {/* MVP Notice */}
                        <div className="mt-4 p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
                            <p className="text-xs text-yellow-500/80">
                                ⚠️ <strong>MVP Mode:</strong> Positions are tracked. 0x swap execution ready for production. Leverage is visual only.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
