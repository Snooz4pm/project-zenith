'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { TerminalView } from '@/components/terminal';
import { getStockQuote } from '@/lib/finnhub';

// Stock name lookup (simplified)
const STOCK_NAMES: Record<string, string> = {
    'AAPL': 'Apple Inc.',
    'MSFT': 'Microsoft Corporation',
    'GOOGL': 'Alphabet Inc.',
    'AMZN': 'Amazon.com Inc.',
    'NVDA': 'NVIDIA Corporation',
    'META': 'Meta Platforms Inc.',
    'TSLA': 'Tesla Inc.',
    'BRK.B': 'Berkshire Hathaway',
    'JPM': 'JPMorgan Chase & Co.',
    'V': 'Visa Inc.',
    'UNH': 'UnitedHealth Group',
    'JNJ': 'Johnson & Johnson',
    'WMT': 'Walmart Inc.',
    'MA': 'Mastercard Inc.',
    'PG': 'Procter & Gamble',
    'HD': 'Home Depot Inc.',
    'CVX': 'Chevron Corporation',
    'MRK': 'Merck & Co.',
    'ABBV': 'AbbVie Inc.',
    'KO': 'The Coca-Cola Company',
    'PEP': 'PepsiCo Inc.',
    'COST': 'Costco Wholesale',
    'TMO': 'Thermo Fisher Scientific',
    'AVGO': 'Broadcom Inc.',
    'MCD': 'McDonalds Corporation',
    'CSCO': 'Cisco Systems Inc.',
    'ACN': 'Accenture plc',
    'ABT': 'Abbott Laboratories',
    'DHR': 'Danaher Corporation',
    'NEE': 'NextEra Energy',
};

export default function StockDetailPage() {
    const params = useParams();
    const symbol = (params.symbol as string)?.toUpperCase() || '';
    const [name, setName] = useState(STOCK_NAMES[symbol] || symbol);

    // Try to fetch company name if not in lookup
    useEffect(() => {
        if (!STOCK_NAMES[symbol] && symbol) {
            // Could fetch from Finnhub profile API here
            setName(symbol);
        }
    }, [symbol]);

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
            assetType="stock"
            backLink="/stocks"
            backLabel="Stocks"
        />
    );
}
