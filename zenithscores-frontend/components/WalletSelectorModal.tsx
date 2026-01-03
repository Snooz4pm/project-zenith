'use client';

import { useState } from 'react';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { X } from 'lucide-react';

interface WalletSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
}

/**
 * Wallet Selector Modal
 * 
 * Let user choose between Solana or EVM wallets
 * Opens appropriate modal based on selection
 * 
 * TWO wallet systems, ONE UI
 */
export default function WalletSelectorModal({ isOpen, onClose }: WalletSelectorModalProps) {
    const { open: openEVMModal } = useWeb3Modal();
    const { setVisible: openSolanaModal } = useWalletModal();

    if (!isOpen) return null;

    const handleSelectSolana = () => {
        openSolanaModal(true);
        onClose();
    };

    const handleSelectEVM = () => {
        openEVMModal();
        onClose();
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#0d0d12] border border-white/10 rounded-2xl shadow-2xl z-[101]">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-white/10">
                    <h2 className="text-xl font-bold text-white">Connect Wallet</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-zinc-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-3">
                    {/* Solana Wallets */}
                    <button
                        onClick={handleSelectSolana}
                        className="w-full p-4 bg-[#14F195]/10 hover:bg-[#14F195]/20 border border-[#14F195]/20 hover:border-[#14F195]/40 rounded-xl transition-all group text-left"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-bold text-white mb-1">Solana Wallets</div>
                                <div className="text-xs text-zinc-400">Phantom • Solflare • Backpack</div>
                            </div>
                            <div className="text-3xl">◎</div>
                        </div>
                        <div className="mt-3 text-xs text-[#14F195]/80">
                            For trading Solana tokens
                        </div>
                    </button>

                    {/* EVM Wallets */}
                    <button
                        onClick={handleSelectEVM}
                        className="w-full p-4 bg-[#627EEA]/10 hover:bg-[#627EEA]/20 border border-[#627EEA]/20 hover:border-[#627EEA]/40 rounded-xl transition-all group text-left"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-bold text-white mb-1">EVM Wallets</div>
                                <div className="text-xs text-zinc-400">MetaMask • WalletConnect • Coinbase</div>
                            </div>
                            <div className="text-3xl">Ξ</div>
                        </div>
                        <div className="mt-3 text-xs text-[#627EEA]/80">
                            For Ethereum • BNB Chain • Base • Arbitrum
                        </div>
                    </button>
                </div>

                {/* Footer */}
                <div className="px-6 pb-6">
                    <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                        <p className="text-xs text-zinc-400 text-center">
                            <strong className="text-blue-400">Tip:</strong> Choose based on  which tokens you want to trade
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
