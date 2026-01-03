'use client';

import { GlobalToken, CHAIN_METADATA } from '@/lib/discovery/normalize';
import { useWallet } from '@/lib/wallet/WalletContext';

interface TokenCardProps {
    token: GlobalToken;
    onSelect: (token: GlobalToken) => void;
}

/**
 * TokenCard Component
 * 
 * Displays individual token with chain badge
 * Shows if token is swappable based on wallet VM
 * 
 * Rules:
 * - Token from Solana → requires Solana wallet
 * - Token from EVM → requires EVM wallet (any network)
 */
export default function TokenCard({ token, onSelect }: TokenCardProps) {
    const { wallet } = useWallet();

    // Can swap if wallet VM matches token VM
    const canSwap = wallet.vm === token.chainType;

    // For EVM tokens, check if on correct network
    const needsNetworkSwitch = token.chainType === 'EVM' &&
        wallet.vm === 'EVM' &&
        wallet.chainId !== parseInt(token.chainId);

    const chainMeta = CHAIN_METADATA[token.chainId];
    const priceChangeColor = token.priceChange24h >= 0 ? 'text-emerald-500' : 'text-red-500';

    return (
        <button
            onClick={() => onSelect(token)}
            className="w-full p-4 bg-[#111116] hover:bg-[#15151a] border border-white/10 rounded-xl transition-all group"
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

            {/* Action Button */}
            {!canSwap ? (
                <div className="px-3 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-xs text-yellow-500 text-center">
                    {token.chainType === 'SOLANA' ? 'Connect Solana wallet' : 'Connect EVM wallet'}
                </div>
            ) : needsNetworkSwitch ? (
                <div className="px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-500 text-center">
                    Switch to {token.networkName}
                </div>
            ) : (
                <div className="px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-500 font-medium text-center group-hover:bg-emerald-500/20 transition-colors">
                    Swap {token.symbol}
                </div>
            )}
        </button>
    );
}
