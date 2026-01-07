"use client";

import { useWallet } from "@/lib/wallet/WalletContext";
import { Wallet, X } from "lucide-react";
import { useEffect } from "react";

interface ConnectWalletModalProps {
    isOpen: boolean;
    onClose: () => void;
    chainType: "EVM" | "SOLANA" | null;
}

export function ConnectWalletModal({ isOpen, onClose, chainType }: ConnectWalletModalProps) {
    const { connectEvm, connectSolana, session } = useWallet();

    // Auto-close if connected
    useEffect(() => {
        if (!isOpen || !chainType) return;

        if (chainType === 'EVM' && session.evm?.connected) {
            onClose();
        }
        if (chainType === 'SOLANA' && session.solana?.connected) {
            onClose();
        }
    }, [isOpen, chainType, session, onClose]);

    if (!isOpen || !chainType) return null;

    const isEvm = chainType === 'EVM';
    const networkName = isEvm ? "EVM" : "Solana";
    const walletExamples = isEvm ? "MetaMask, Rainbow, WalletConnect" : "Phantom, Solflare, Backpack";

    const handleConnect = () => {
        if (isEvm) {
            connectEvm();
        } else {
            connectSolana();
        }
        // We don't close immediately. Wait for connection (handled by useEffect above) or user manual close.
        // Actually, for EVM, connectEvm triggers modal. For Solana, wallet adapter triggers modal.
        // The user might cancel there, so we stay open until connected or cancelled here.
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-[#0a0a0f] border border-white/10 rounded-2xl w-full max-w-sm flex flex-col shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b border-white/10">
                    <h3 className="font-bold text-lg text-white">Connect Wallet Required</h3>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 text-center">
                    <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center ${isEvm ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'
                        }`}>
                        <Wallet size={32} />
                    </div>

                    <p className="text-zinc-300 mb-2 font-medium">
                        To trade this token, connect your {networkName} wallet.
                    </p>
                    <p className="text-sm text-zinc-500 mb-6">
                        Supported: {walletExamples}
                    </p>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handleConnect}
                            className={`w-full py-3 rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98] ${isEvm
                                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'
                                    : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/20'
                                }`}
                        >
                            Connect {networkName} Wallet
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full py-3 rounded-xl font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
