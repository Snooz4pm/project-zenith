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
 * One-click swap orchestration:
 * - Auto-switches EVM networks
 * - Prompts correct wallet for VM mismatch
 * - Opens swap drawer when ready
 */
export default function TokenCard({ token, onSelect }: TokenCardProps) {
    const { wallet, switchNetwork } = useWallet();
    const [showWalletSelector, setShowWalletSelector] = useState(false);
    const [preferredVM, setPreferredVM] = useState<'EVM' | 'SOLANA' | null>(null);
    const [isSwitching, setIsSwitching] = useState(false);

    const chainMeta = CHAIN_METADATA[token.chainId];
    const priceChangeColor = token.priceChange24h >= 0 ? 'text-emerald-500' : 'text-red-500';

    /**
     * ONE-CLICK SWAP ORCHESTRATION
     */
    const handleSwapClick = async () => {
        // Case 1: Wallet not connected
        if (!wallet.isConnected) {
            setPreferredVM(token.chainType);
            setShowWalletSelector(true);
            return;
        }

        // Case 2: VM mismatch (Solana ↔ EVM)
        if (token.chainType !== wallet.vm) {
            setPreferredVM(token.chainType);
            setShowWalletSelector(true);
            return;
        }

        // Case 3: EVM + Wrong network → Auto-switch
        if (
            wallet.vm === 'EVM' &&
            token.chainType === 'EVM' &&
            wallet.chainId !== parseInt(token.chainId)
        ) {
            setIsSwitching(true);
            try {
                await switchNetwork(parseInt(token.chainId));
                // After switch, open swap drawer
                onSelect(token);
            } catch (err) {
                console.error('[TokenCard] Network switch failed:', err);
            } finally {
                setIsSwitching(false);
            }
            return;
        }

        // Case 4: All good → Open swap drawer
        onSelect(token);
    };

    // Determine button state
    let buttonText = `Swap ${token.symbol}`;
    let buttonStyle = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500';
    let isDisabled = false;

    if (!wallet.isConnected) {
        buttonText = 'Connect Wallet';
        buttonStyle = 'bg-blue-500/10 border-blue-500/20 text-blue-500';
    } else if (token.chainType !== wallet.vm) {
        buttonText = token.chainType === 'SOLANA' ? 'Connect Solana Wallet' : 'Connect EVM Wallet';
        buttonStyle = 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500';
    } else if (
        wallet.vm === 'EVM' &&
        token.chainType === 'EVM' &&
        wallet.chainId !== parseInt(token.chainId)
    ) {
        buttonText = isSwitching ? 'Switching...' : 'Switch Network';
        buttonStyle = 'bg-blue-500/10 border-blue-500/20 text-blue-500';
        isDisabled = isSwitching;
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
