'use client';

import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';
import { useWallet } from '@/lib/wallet/WalletContext';
import type { WalletName } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { X } from 'lucide-react';

const phantomAdapter = new PhantomWalletAdapter();
const solflareAdapter = new SolflareWalletAdapter();

interface WalletSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    preferredVM?: 'EVM' | 'SOLANA' | null;
}

/**
 * Wallet Selector Modal
 * 
 * Properly connects wallets using their respective adapters
 * - EVM: Opens Web3Modal
 * - Solana: Calls select() + connect() directly
 */
export default function WalletSelectorModal({ isOpen, onClose, preferredVM }: WalletSelectorModalProps) {
    const { open: openEVMModal } = useWeb3Modal();
    const { select: selectSolanaWallet, connect: connectSolanaWallet } = useSolanaWallet();
    const { setPreferredVM } = useWallet();

    /**
     * Connect Solana Wallet
     * CRITICAL: Must call select() + connect() directly in click handler
     * Browser blocks wallet popups if called from useEffect or delayed
     */
    const handleConnectSolana = async (walletName: string) => {
        try {
            console.log('[WalletSelector] Connecting Solana wallet:', walletName);

            // Select the wallet adapter
            selectSolanaWallet(walletName as WalletName);

            // Connect (this opens the wallet extension)
            await connectSolanaWallet();

            // Clear intent
            setPreferredVM(null);
            onClose();
        } catch (error) {
            console.error('[WalletSelector] Solana connect error:', error);
            // Don't close modal on error so user can retry
        }
    };

    const handleSelectEVM = () => {
        openEVMModal();
        setPreferredVM(null);
        onClose();
    };

    // Auto-select if preferred VM is set
    if (isOpen && preferredVM) {
        if (preferredVM === 'SOLANA') {
            // Auto-connect Phantom for Solana VM mismatch
            handleConnectSolana('Phantom');
            return null;
        } else if (preferredVM === 'EVM') {
            handleSelectEVM();
            return null;
        }
    }

    if (!isOpen) return null;

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
                    <div className="space-y-2">
                        <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Solana Wallets</div>

                        {/* Phantom */}
                        <button
                            onClick={() => handleConnectSolana('Phantom')}
                            className="w-full p-3 bg-[#14F195]/10 hover:bg-[#14F195]/20 border border-[#14F195]/20 hover:border-[#14F195]/40 rounded-lg transition-all text-left"
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-white">Phantom</span>
                                <img src={phantomAdapter.icon} alt="Phantom" className="w-6 h-6" />
                            </div>
                        </button>

                        {/* Solflare */}
                        <button
                            onClick={() => handleConnectSolana('Solflare')}
                            className="w-full p-3 bg-[#14F195]/10 hover:bg-[#14F195]/20 border border-[#14F195]/20 hover:border-[#14F195]/40 rounded-lg transition-all text-left"
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-white">Solflare</span>
                                <img src={solflareAdapter.icon} alt="Solflare" className="w-6 h-6" />
                            </div>
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10"></div>
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-[#0d0d12] px-3 text-xs text-zinc-500">OR</span>
                        </div>
                    </div>

                    {/* EVM Wallets */}
                    <div className="space-y-2">
                        <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">EVM Wallets</div>

                        <button
                            onClick={handleSelectEVM}
                            className="w-full p-3 bg-[#627EEA]/10 hover:bg-[#627EEA]/20 border border-[#627EEA]/20 hover:border-[#627EEA]/40 rounded-lg transition-all text-left"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-medium text-white">EVM Wallets</div>
                                    <div className="text-xs text-zinc-400">MetaMask • WalletConnect • Coinbase</div>
                                </div>
                                <span className="text-2xl">Ξ</span>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 pb-6">
                    <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                        <p className="text-xs text-zinc-400 text-center">
                            <strong className="text-blue-400">Tip:</strong> Choose based on which tokens you want to trade
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
