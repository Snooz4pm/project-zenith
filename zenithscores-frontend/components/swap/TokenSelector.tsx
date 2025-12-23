'use client';

import { useState, useEffect } from 'react';
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
            {/* Trigger Button - Compact with max width */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors max-w-[120px]"
            >
                {selectedToken.logoURI && (
                    <img
                        src={selectedToken.logoURI}
                        alt={selectedToken.symbol}
                        className="w-5 h-5 rounded-full flex-shrink-0"
                    />
                )}
                <span className="font-bold text-white text-sm truncate">{selectedToken.symbol}</span>
                <ChevronDown size={14} className="text-gray-400 flex-shrink-0" />
            </button>

            {/* Dropdown Modal */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 bg-black/60 z-40"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Modal - Fixed positioning */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            className="fixed left-1/2 -translate-x-1/2 top-24 w-[90vw] max-w-md md:absolute md:left-auto md:right-0 md:translate-x-0 md:top-full md:mt-2 md:w-96 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden"
                        >
                            {/* Header */}
                            <div className="p-4 border-b border-gray-800">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-bold text-white">Select Token</h3>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-1 hover:bg-gray-800 rounded-lg transition-colors"
                                    >
                                        <X size={16} className="text-gray-400" />
                                    </button>
                                </div>

                                {/* Search */}
                                <div className="relative">
                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search by name or address..."
                                        className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {/* Token List */}
                            <div className="max-h-80 overflow-y-auto">
                                {filteredTokens.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500 text-sm">
                                        No tokens found
                                    </div>
                                ) : (
                                    filteredTokens.map((token) => (
                                        <button
                                            key={token.address}
                                            onClick={() => handleSelect(token)}
                                            className="w-full flex items-center gap-3 p-3 hover:bg-gray-800 transition-colors text-left"
                                        >
                                            {token.logoURI ? (
                                                <img
                                                    src={token.logoURI}
                                                    alt={token.symbol}
                                                    className="w-8 h-8 rounded-full"
                                                />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                                    {token.symbol.slice(0, 2)}
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <div className="text-white font-bold text-sm">{token.symbol}</div>
                                                <div className="text-gray-500 text-xs">{token.name}</div>
                                            </div>
                                            {selectedToken.address === token.address && (
                                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                                            )}
                                        </button>
                                    ))
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
