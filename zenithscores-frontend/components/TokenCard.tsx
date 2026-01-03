'use client';

import { useState } from 'react';
import { GlobalToken, CHAIN_METADATA } from '@/lib/discovery/normalize';
import { useWallet } from '@/lib/wallet/WalletContext';
import WalletSelectorModal from './WalletSelectorModal';

interface TokenCardProps {
    token: GlobalToken;
    onSelect: (token: GlobalToken) => void;
}

/**
 * TokenCard Component
 *
 * One-click swap orchestration with intelligent VM routing.
 *
 * PRODUCTION RULES (Scenario 3 Fix):
 * ════════════════════════════════════════════════════════
 * ✅ VM is determined by CONNECTION METHOD, not wallet brand
 * ✅ WalletConnect = EVM ONLY (Phantom via WC = EVM mode)
 * ✅ Solana adapter = SOLANA ONLY
 * ❌ NEVER auto-switch VM silently
 * ❌ NEVER attempt Solana swaps via WalletConnect
 *
 * Orchestration Logic:
 * ────────────────────
 * 1. Not connected → Open wallet selector (with preferred VM)
 * 2. VM mismatch → Prompt correct wallet type (Solana vs EVM)
 * 3. EVM + wrong chain → Auto-switch network
 * 4. All aligned → Open swap drawer
 *
 * Example Flows:
 * ──────────────
 * • Phantom (Solana adapter) + Solana token → ✅ Swap
 * • Phantom (WalletConnect) + ETH token → ✅ Swap
 * • Phantom (WalletConnect) + Solana token → ⚠️ Prompt "Connect Solana Wallet"
 * • MetaMask + Base token (wrong network) → 🔄 Auto-switch to Base
 *
 * This ensures honest UX and prevents broken swaps.
 */
export default function TokenCard({ token, onSelect }: TokenCardProps) {
    const { session, switchEvmNetwork } = useWallet();
    const [showWalletSelector, setShowWalletSelector] = useState(false);
    const [preferredVM, setPreferredVM] = useState<'EVM' | 'SOLANA' | null>(null);
    const [noRoute, setNoRoute] = useState(false);

    /**
     * ROUTE VERIFICATION (ZENITH HONEST UX)
     */
    const checkRouteExists = async (): Promise<boolean> => {
        try {
            if (token.chainType === 'SOLANA') {
                const nativeMint = 'So11111111111111111111111111111111111111112';
                // Use our proxy API
                const res = await fetch(`/api/arena/solana/quote?inputMint=${nativeMint}&outputMint=${token.address}&amount=1000000`);
                const data = await res.json();
                return !!data.outAmount; // Jupiter returns outAmount if route exists
            } else {
                // EVM 0x Price check (lighter than quote)
                const sellToken = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
                const url = `https://api.0x.org/swap/v1/price?sellToken=${sellToken}&buyToken=${token.address}&sellAmount=10000000000000000&chainId=${token.chainId}`;

                const res = await fetch(url, {
                    headers: { '0x-api-key': process.env.NEXT_PUBLIC_0X_API_KEY || '' }
                });
                return res.ok;
            }
        } catch (err) {
            console.error('[RouteCheck] Error:', err);
            return false;
        }
    };

    /**
     * ONE-CLICK SWAP ORCHESTRATION (MULTI-SESSION)
     */
    const handleSwapClick = async () => {
        // Reset route state
        setNoRoute(false);

        // For Solana tokens
        if (token.chainType === 'SOLANA') {
            if (!session.solana) {
                setPreferredVM('SOLANA');
                setShowWalletSelector(true);
                return;
            }

            setIsSwitching(true); // Reuse loading state
            const exists = await checkRouteExists();
            setIsSwitching(false);

            if (!exists) {
                setNoRoute(true);
                return;
            }

            onSelect(token);
            return;
        }

        // For EVM tokens
        if (token.chainType === 'EVM') {
            if (!session.evm) {
                setPreferredVM('EVM');
                setShowWalletSelector(true);
                return;
            }

            // EVM connected but wrong network → Auto-switch
            if (session.evm.chainId !== parseInt(token.chainId)) {
                setIsSwitching(true);
                try {
                    await switchEvmNetwork(parseInt(token.chainId));
                    // Check route after switch
                    const exists = await checkRouteExists();
                    if (!exists) {
                        setNoRoute(true);
                        return;
                    }
                    onSelect(token);
                } catch (err) {
                    console.error('[TokenCard] Network switch failed:', err);
                } finally {
                    setIsSwitching(false);
                }
                return;
            }

            // Correct network → Check route
            setIsSwitching(true);
            const exists = await checkRouteExists();
            setIsSwitching(false);

            if (!exists) {
                setNoRoute(true);
                return;
            }

            onSelect(token);
            return;
        }
    };

    // Determine button state (MULTI-SESSION AWARE)
    let buttonText = isSwitching ? 'Verifying...' : `Swap ${token.symbol}`;
    let buttonStyle = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500';
    let isDisabled = isSwitching;

    if (noRoute) {
        buttonText = 'No Route Available';
        buttonStyle = 'bg-red-500/10 border-red-500/20 text-red-500';
    } else if (token.chainType === 'SOLANA') {
        if (!session.solana) {
            buttonText = 'Connect Solana Wallet';
            buttonStyle = 'bg-purple-500/10 border-purple-500/20 text-purple-500';
        }
    } else if (token.chainType === 'EVM') {
        if (!session.evm) {
            buttonText = 'Connect EVM Wallet';
            buttonStyle = 'bg-blue-500/10 border-blue-500/20 text-blue-500';
        } else if (session.evm.chainId !== parseInt(token.chainId)) {
            buttonText = isSwitching ? 'Switching...' : 'Switch Network';
            buttonStyle = 'bg-blue-500/10 border-blue-500/20 text-blue-500';
            isDisabled = isSwitching;
        }
    }

    return (
        <>
            <button
                onClick={handleSwapClick}
                disabled={isDisabled}
                className="w-full p-4 bg-[#111116] hover:bg-[#15151a] border border-white/10 rounded-xl transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {/* Header: Logo + Name + Chain */}
                <div className="flex items-start gap-3 mb-3">
                    {/* Token Logo */}
                    {token.logo ? (
                        <img
                            src={token.logo}
                            alt={token.symbol}
                            className="w-12 h-12 rounded-full bg-white/5"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center">
                            <span className="text-lg font-bold">{token.symbol[0]}</span>
                        </div>
                    )}

                    {/* Token Info */}
                    <div className="flex-1 text-left">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-white">{token.symbol}</h3>

                            {/* Chain Badge */}
                            <span
                                className="px-2 py-0.5 rounded text-[10px] font-medium"
                                style={{
                                    backgroundColor: `${chainMeta.color}15`,
                                    color: chainMeta.color,
                                    border: `1px solid ${chainMeta.color}40`,
                                }}
                            >
                                {chainMeta.logo} {token.networkName}
                            </span>
                        </div>

                        <p className="text-xs text-zinc-500 truncate">{token.name}</p>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                        <div className="text-sm font-bold text-white">
                            ${token.priceUsd.toFixed(token.priceUsd < 0.01 ? 6 : 4)}
                        </div>
                        <div className={`text-xs font-medium ${priceChangeColor}`}>
                            {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(2)}%
                        </div>
                    </div>
                </div>

                {/* Metrics Row */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="text-center">
                        <div className="text-[10px] text-zinc-500 mb-0.5">Liquidity</div>
                        <div className="text-xs font-medium text-white">
                            ${(token.liquidityUsd / 1000).toFixed(0)}K
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-[10px] text-zinc-500 mb-0.5">Volume 24h</div>
                        <div className="text-xs font-medium text-white">
                            ${(token.volume24h / 1000).toFixed(0)}K
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-[10px] text-zinc-500 mb-0.5">DEX</div>
                        <div className="text-xs font-medium text-zinc-400">{token.dex}</div>
                    </div>
                </div>

                {/* Smart Action Button */}
                <div className={`px-3 py-2 border rounded-lg text-xs font-medium text-center group-hover:opacity-80 transition-opacity ${buttonStyle}`}>
                    {buttonText}
                </div>
            </button>

            {/* Wallet Selector (opens when VM mismatch or not connected) */}
            <WalletSelectorModal
                isOpen={showWalletSelector}
                onClose={() => setShowWalletSelector(false)}
                preferredVM={preferredVM}
            />
        </>
    );
}
