'use client';

import { useAccount, useBalance, useSwitchChain } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { Wallet, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { getChainConfig, isChainSupported } from '@/lib/arena/chains';

interface WalletStatusProps {
    targetChainId?: number;
}

export default function WalletStatus({ targetChainId }: WalletStatusProps) {
    const { address, isConnected, chainId, isConnecting } = useAccount();
    const { open } = useWeb3Modal();
    const { switchChain, isPending: isSwitching } = useSwitchChain();

    // Get balance for connected chain
    const { data: balance, isLoading: isLoadingBalance } = useBalance({
        address,
        chainId,
    });

    const chain = chainId ? getChainConfig(chainId) : null;
    const isOnCorrectChain = !targetChainId || chainId === targetChainId;
    const isSupported = chainId ? isChainSupported(chainId) : false;

    // CONNECTING
    if (isConnecting) {
        return (
            <button
                disabled
                className="px-4 py-2 bg-white/10 text-zinc-400 font-bold rounded-lg flex items-center gap-2 cursor-not-allowed"
            >
                <Loader2 size={16} className="animate-spin" />
                Connecting...
            </button>
        );
    }

    // DISCONNECTED
    if (!isConnected) {
        return (
            <button
                onClick={() => open()}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg transition-colors flex items-center gap-2"
            >
                <Wallet size={16} />
                Connect Wallet
            </button>
        );
    }

    // WRONG_NETWORK (unsupported chain)
    if (!isSupported) {
        return (
            <div className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-500" />
                <span className="text-sm text-red-500 font-medium">Unsupported Network</span>
                <button
                    onClick={() => open()}
                    className="ml-2 px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-xs font-medium transition-colors"
                >
                    Switch Network
                </button>
            </div>
        );
    }

    // CONNECTED but wrong chain for selected token
    if (targetChainId && !isOnCorrectChain) {
        const targetChain = getChainConfig(targetChainId);
        return (
            <button
                onClick={() => switchChain?.({ chainId: targetChainId })}
                disabled={isSwitching}
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 disabled:bg-yellow-500/50 text-black font-bold rounded-lg transition-colors flex items-center gap-2"
            >
                {isSwitching && <Loader2 size={16} className="animate-spin" />}
                Switch to {targetChain?.name}
            </button>
        );
    }

    // READY_TO_SWAP
    return (
        <div className="flex items-center gap-3">
            {/* Balance */}
            <div className="px-3 py-2 bg-white/5 rounded-lg">
                <div className="text-[10px] text-zinc-500 mb-0.5">Balance</div>
                <div className="text-sm font-bold text-white">
                    {isLoadingBalance ? (
                        <span className="text-zinc-600">Loading...</span>
                    ) : balance ? (
                        `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}`
                    ) : (
                        '0.00'
                    )}
                </div>
            </div>

            {/* Chain */}
            <div className="px-3 py-2 bg-white/5 rounded-lg">
                <div className="text-[10px] text-zinc-500 mb-0.5">Network</div>
                <div className="text-sm font-medium text-white">{chain?.name}</div>
            </div>

            {/* Address */}
            <div className="px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-500" />
                <span className="text-sm font-mono text-emerald-500">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
            </div>
        </div>
    );
}
