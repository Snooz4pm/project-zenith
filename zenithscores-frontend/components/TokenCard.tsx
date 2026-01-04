'use client';

import { useState } from 'react';
import { DiscoveredToken } from '@/lib/discovery/types';
import { useWallet } from '@/lib/wallet/WalletContext';
import WalletSelectorModal from './WalletSelectorModal';

const CHAIN_METADATA: Record<string, { name: string; logo: string; color: string; vm: 'SOLANA' | 'EVM' }> = {
    'solana': { name: 'Solana', logo: 'https://assets.trustwalletapp.com/blockchains/solana/info/logo.png', color: '#14F195', vm: 'SOLANA' },
    '1': { name: 'Ethereum', logo: 'https://assets.trustwalletapp.com/blockchains/ethereum/info/logo.png', color: '#627EEA', vm: 'EVM' },
    '8453': { name: 'Base', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png', color: '#0052FF', vm: 'EVM' },
    '42161': { name: 'Arbitrum', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png', color: '#2D374B', vm: 'EVM' },
    '56': { name: 'BSC', logo: 'https://assets.trustwalletapp.com/blockchains/binance/info/logo.png', color: '#F3BA2F', vm: 'EVM' },
};

interface TokenCardProps {
    token: DiscoveredToken;
    onSelect: (token: DiscoveredToken) => void;
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
    const { session, switchEvmNetwork, preferredVM, setPreferredVM } = useWallet();
    const [showWalletSelector, setShowWalletSelector] = useState(false);
    const [isCheckingRoute, setIsCheckingRoute] = useState(false);
    const [routeExists, setRouteExists] = useState<boolean | null>(null);

    // Safe chain metadata with fallback for unknown chains
    // Safe chain metadata with fallback
    const chainIdStr = token.chainId.toString();
    const chainMeta = CHAIN_METADATA[chainIdStr] || {
        name: token.chainType === 'SOLANA' ? 'Solana' : 'Unknown Chain',
        logo: token.chainType === 'SOLANA' ? 'https://assets.trustwalletapp.com/blockchains/solana/info/logo.png' : 'https://assets.trustwalletapp.com/blockchains/ethereum/info/logo.png',
        color: token.chainType === 'SOLANA' ? '#14F195' : '#627EEA',
        vm: token.chainType,
    };

    // Derive state (EXACT state machine)
    type TokenCardState = 'DISCONNECTED' | 'WRONG_CHAIN' | 'CHECKING_ROUTE' | 'NO_ROUTE' | 'READY';

    let state: TokenCardState = 'READY';
    if (!session.solana && !session.evm) {
        state = 'DISCONNECTED';
        let state: TokenCardState = 'READY';
        if (!session.solana && !session.evm) {
            state = 'DISCONNECTED';
        } else if (token.chainType === 'SOLANA' && !session.solana) {
            state = 'WRONG_CHAIN';
        } else if (token.chainType === 'EVM' && !session.evm) {
            state = 'WRONG_CHAIN';
        } else if (isCheckingRoute) {
            state = 'CHECKING_ROUTE';
        } else if (routeExists === false) {
            state = 'NO_ROUTE';
        }

        /**
         * ROUTE VERIFICATION (ZENITH HONEST UX)
         */
        const verifyRoute = async (): Promise<boolean> => {
            try {
                if (token.chainType === 'SOLANA') {
                    const nativeMint = 'So11111111111111111111111111111111111111112';
                    const res = await fetch(`/api/arena/solana/quote?inputMint=${nativeMint}&outputMint=${token.address}&amount=1000000`);
                    const data = await res.json();
                    return !!data.outAmount;
                } else {
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
            // 1. Handle Disconnected
            if (state === 'DISCONNECTED') {
                setPreferredVM(token.chainType as 'SOLANA' | 'EVM');
                setShowWalletSelector(true);
                return;
            }

            // 2. Handle VM Mismatch (Wrong Chain)
            if (state === 'WRONG_CHAIN') {
                setPreferredVM(token.chainType as 'SOLANA' | 'EVM');
                setShowWalletSelector(true);
                return;
            }

            // 3. Handle EVM Network Switch
            if (token.chainType === 'EVM' && session.evm && session.evm.chainId !== parseInt(token.chainId)) {
                setIsCheckingRoute(true);
                try {
                    await switchEvmNetwork(parseInt(token.chainId));
                    // After switch, verify route
                    const exists = await verifyRoute();
                    setRouteExists(exists);
                    if (exists) onSelect(token);
                } catch (err) {
                    console.error('[TokenCard] Network switch failed:', err);
                } finally {
                    setIsCheckingRoute(false);
                }
                return;
            }

            // 4. Verify Route (if not already verified or previously failed)
            if (routeExists === null || routeExists === false) {
                setIsCheckingRoute(true);
                const exists = await verifyRoute();
                setRouteExists(exists);
                setIsCheckingRoute(false);

                if (exists) {
                    onSelect(token);
                }
                return;
            }

            // 5. Ready -> Open drawer
            // 5. Ready -> Open drawer
            onSelect(token);
        };

        // Determine button appearance
        let buttonText = `Swap ${token.symbol}`;
        let buttonStyle = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500';
        let isDisabled = false;

        switch (state) {
            case 'DISCONNECTED':
                buttonText = 'Connect Wallet';
                buttonStyle = 'bg-white/5 border-white/10 text-white';
                break;
            case 'WRONG_CHAIN':
                buttonText = `Connect ${token.chainType === 'SOLANA' ? 'Solana' : 'EVM'}`;
                buttonStyle = 'bg-purple-500/10 border-purple-500/20 text-purple-500';
                break;
            case 'CHECKING_ROUTE':
                buttonText = 'Verifying...';
                buttonStyle = 'bg-blue-500/10 border-blue-500/20 text-blue-500';
                isDisabled = true;
                break;
            case 'NO_ROUTE':
                buttonText = 'No Route Yet';
                buttonStyle = 'bg-red-500/10 border-red-500/20 text-red-500';
                isDisabled = false;
                break;
            case 'READY':
                if (token.chainType === 'EVM' && session.evm && session.evm.chainId !== parseInt(token.chainId)) {
                    buttonText = 'Switch Network';
                    buttonStyle = 'bg-blue-500/10 border-blue-500/20 text-blue-500';
                }
                break;
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
                        {token.logoURI ? (
                            <img
                                src={token.logoURI}
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
                                    className="px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1"
                                    style={{
                                        backgroundColor: `${chainMeta.color}15`,
                                        color: chainMeta.color,
                                        border: `1px solid ${chainMeta.color}40`,
                                    }}
                                >
                                    {chainMeta.logo.startsWith('http') ? (
                                        <img
                                            src={chainMeta.logo}
                                            alt={chainMeta.name}
                                            className="w-3 h-3 rounded-full"
                                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                        />
                                    ) : (
                                        <span>{chainMeta.logo}</span>
                                    )}
                                    {chainMeta.name}
                                </span>
                            </div>

                            <p className="text-xs text-zinc-500 truncate">{token.name}</p>
                        </div>

                        {/* Simple Price/Status View */}
                        <div className="text-right">
                            {token.source === 'DEXSCREENER' ? (
                                <div className="text-xs font-medium text-emerald-500">
                                    Live
                                </div>
                            ) : (
                                <div className="text-xs font-medium text-blue-500">
                                    Tradeable
                                </div>
                            )}
                            <div className="text-[10px] text-zinc-600 mt-1">
                                {token.source}
                            </div>
                        </div>
                    </div>

                    {/* Metrics Row (Only if available) */}
                    {(token.liquidityUSD || token.volume24h) && (
                        <div className="grid grid-cols-2 gap-2 mb-3">
                            <div className="text-center">
                                <div className="text-[10px] text-zinc-500 mb-0.5">Liquidity</div>
                                <div className="text-xs font-medium text-white">
                                    {token.liquidityUSD ? `$${(token.liquidityUSD / 1000).toFixed(0)}K` : '-'}
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-[10px] text-zinc-500 mb-0.5">Volume 24h</div>
                                <div className="text-xs font-medium text-white">
                                    {token.volume24h ? `$${(token.volume24h / 1000).toFixed(0)}K` : '-'}
                                </div>
                            </div>
                        </div>
                    )}

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
