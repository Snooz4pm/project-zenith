'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { TerminalView } from '@/components/terminal';

// Crypto name lookup
const CRYPTO_NAMES: Record<string, string> = {
    'BTC': 'Bitcoin',
    'ETH': 'Ethereum',
    'SOL': 'Solana',
    'XRP': 'XRP',
    'ADA': 'Cardano',
    'DOGE': 'Dogecoin',
    'DOT': 'Polkadot',
    'LINK': 'Chainlink',
    'AVAX': 'Avalanche',
    'MATIC': 'Polygon',
    'UNI': 'Uniswap',
    'ATOM': 'Cosmos',
    'LTC': 'Litecoin',
    'BCH': 'Bitcoin Cash',
    'NEAR': 'NEAR Protocol',
    'APT': 'Aptos',
    'ARB': 'Arbitrum',
    'OP': 'Optimism',
    'PEPE': 'Pepe',
    'SHIB': 'Shiba Inu',
};

export default function CryptoDetailPage() {
    const params = useParams();
    const symbol = (params.symbol as string)?.toUpperCase() || '';
    const name = CRYPTO_NAMES[symbol] || symbol;

    if (!symbol) {
        return (
            <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center">
                <div className="text-gray-400">Loading...</div>
            </div>
        );
    }

    return (
        <TerminalView
            symbol={symbol}
            name={name}
            assetType="crypto"
            backLink="/crypto"
            backLabel="Crypto"
        />
    );
}
