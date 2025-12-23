'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { truncateAddress, getChainInfo } from '@/lib/web3-config';
import { Wallet, ChevronDown, LogOut, Copy, ExternalLink } from 'lucide-react';
import { useState } from 'react';

export function ConnectWalletButton({ variant = 'default' }: { variant?: 'default' | 'compact' }) {
    const { address, isConnected, chain } = useAccount();
    const { open } = useWeb3Modal();
    const { disconnect } = useDisconnect();
    const [showMenu, setShowMenu] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (address) {
            navigator.clipboard.writeText(address);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const chainInfo = chain ? getChainInfo(chain.id) : null;

    if (!isConnected) {
        return (
            <button
                onClick={() => open()}
                className={`
          flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all
          ${variant === 'compact'
                        ? 'bg-blue-600 hover:bg-blue-700 text-white text-sm'
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg'
                    }
        `}
            >
                <Wallet size={18} />
                Connect Wallet
            </button>
        );
    }

    return (
        <div className="relative">
            <button
                onClick={() => setShowMenu(!showMenu)}
                className={`
          flex items-center gap-3 px-4 py-2 rounded-xl font-medium transition-all
          border border-gray-700 hover:border-gray-600 bg-gray-800 hover:bg-gray-750
          ${variant === 'compact' ? 'text-sm' : ''}
        `}
            >
                <div className="flex items-center gap-2">
                    {chainInfo && <span className="text-lg">{chainInfo.icon}</span>}
                    <span className="font-mono">{truncateAddress(address || '')}</span>
                </div>
                <ChevronDown size={16} className={`transition-transform ${showMenu ? 'rotate-180' : ''}`} />
            </button>

            {showMenu && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowMenu(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-64 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                        <div className="p-4 border-b border-gray-800">
                            <div className="text-xs text-gray-400 mb-1">Connected Wallet</div>
                            <div className="font-mono text-sm text-white break-all">{address}</div>
                        </div>

                        <div className="p-2">
                            <button
                                onClick={handleCopy}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-800 text-left text-sm transition-colors"
                            >
                                {copied ? (
                                    <>
                                        <ExternalLink size={16} className="text-green-500" />
                                        <span className="text-green-500">Copied!</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy size={16} />
                                        <span>Copy Address</span>
                                    </>
                                )}
                            </button>

                            {chainInfo && (
                                <a
                                    href={`${chainInfo.explorer}/address/${address}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-800 text-left text-sm transition-colors"
                                >
                                    <ExternalLink size={16} />
                                    <span>View on Explorer</span>
                                </a>
                            )}

                            <button
                                onClick={() => {
                                    disconnect();
                                    setShowMenu(false);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-900/20 text-red-400 text-left text-sm transition-colors"
                            >
                                <LogOut size={16} />
                                <span>Disconnect</span>
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default ConnectWalletButton;
