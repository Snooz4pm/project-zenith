'use client';

import { useState } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Token {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    logoURI?: string;
}

interface TokenSelectorProps {
    selectedToken: Token;
    onSelectToken: (token: Token) => void;
    tokenList: Token[];
    label: string;
}

export function TokenSelector({ selectedToken, onSelectToken, tokenList, label }: TokenSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredTokens = tokenList.filter(token =>
        token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.address.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelect = (token: Token) => {
        onSelectToken(token);
        setIsOpen(false);
        setSearchQuery('');
    };

    return (
        <div className="relative">
            {/* Token Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-[#1a1d2e] hover:bg-[#252838] rounded-xl transition-colors"
            >
                {selectedToken.logoURI ? (
                    <img
                        src={selectedToken.logoURI}
                        alt={selectedToken.symbol}
                        className="w-6 h-6 rounded-full"
                    />
                ) : (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                        {selectedToken.symbol.slice(0, 2)}
                    </div>
                )}
                <span className="font-bold text-white text-base">{selectedToken.symbol}</span>
                <ChevronDown size={16} className="text-gray-400" />
            </button>

            {/* Search Modal Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/80 z-[100]"
                        />

                        {/* In-Widget Search Panel */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[440px] bg-[#1a1d2e] border border-gray-800/50 rounded-2xl shadow-2xl z-[101] overflow-hidden"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-gray-800/50">
                                <h3 className="text-base font-bold text-white">Select Token</h3>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1.5 hover:bg-gray-800/50 rounded-lg transition-colors"
                                >
                                    <X size={18} className="text-gray-400" />
                                </button>
                            </div>

                            {/* Search Input */}
                            <div className="p-4 border-b border-gray-800/50">
                                <div className="relative">
                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search name or paste address"
                                        className="w-full pl-10 pr-4 py-3 bg-[#252838] border border-gray-700/50 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {/* Token List */}
                            <div className="max-h-[400px] overflow-y-auto">
                                {filteredTokens.length === 0 ? (
                                    <div className="p-12 text-center text-gray-500 text-sm">
                                        No tokens found
                                    </div>
                                ) : (
                                    <div className="p-2">
                                        {filteredTokens.map((token) => (
                                            <button
                                                key={token.address}
                                                onClick={() => handleSelect(token)}
                                                className={`w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[#252838] transition-colors ${selectedToken.address === token.address ? 'bg-[#252838]' : ''
                                                    }`}
                                            >
                                                {token.logoURI ? (
                                                    <img
                                                        src={token.logoURI}
                                                        alt={token.symbol}
                                                        className="w-9 h-9 rounded-full"
                                                    />
                                                ) : (
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                                                        {token.symbol.slice(0, 2)}
                                                    </div>
                                                )}
                                                <div className="flex-1 text-left">
                                                    <div className="text-white font-bold text-sm">{token.symbol}</div>
                                                    <div className="text-gray-500 text-xs truncate">{token.name}</div>
                                                </div>
                                                {selectedToken.address === token.address && (
                                                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

export default TokenSelector;
