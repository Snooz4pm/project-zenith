
export interface SearchResult {
    symbol: string;
    name: string;
    type: 'CRYPTO' | 'STOCK';
    score: number;
    url: string;
}

const ASSET_DATABASE: SearchResult[] = [
    // CRYPTO
    { symbol: 'BTC', name: 'Bitcoin', type: 'CRYPTO', score: 76, url: '/crypto/BTC' },
    { symbol: 'ETH', name: 'Ethereum', type: 'CRYPTO', score: 71, url: '/crypto/ETH' },
    { symbol: 'SOL', name: 'Solana', type: 'CRYPTO', score: 82, url: '/crypto/SOL' },
    { symbol: 'XRP', name: 'Ripple', type: 'CRYPTO', score: 65, url: '/crypto/XRP' },
    { symbol: 'ADA', name: 'Cardano', type: 'CRYPTO', score: 60, url: '/crypto/ADA' },
    { symbol: 'DOGE', name: 'Dogecoin', type: 'CRYPTO', score: 58, url: '/crypto/DOGE' },
    { symbol: 'DOT', name: 'Polkadot', type: 'CRYPTO', score: 64, url: '/crypto/DOT' },
    { symbol: 'LINK', name: 'Chainlink', type: 'CRYPTO', score: 78, url: '/crypto/LINK' },
    { symbol: 'AVAX', name: 'Avalanche', type: 'CRYPTO', score: 70, url: '/crypto/AVAX' },
    { symbol: 'MATIC', name: 'Polygon', type: 'CRYPTO', score: 69, url: '/crypto/MATIC' },
    { symbol: 'UNI', name: 'Uniswap', type: 'CRYPTO', score: 63, url: '/crypto/UNI' },
    { symbol: 'PEPE', name: 'Pepe', type: 'CRYPTO', score: 85, url: '/crypto/PEPE' },

    // STOCKS
    { symbol: 'AAPL', name: 'Apple Inc.', type: 'STOCK', score: 82, url: '/stocks/AAPL' },
    { symbol: 'MSFT', name: 'Microsoft Corp.', type: 'STOCK', score: 84, url: '/stocks/MSFT' },
    { symbol: 'NVDA', name: 'NVIDIA Corp.', type: 'STOCK', score: 92, url: '/stocks/NVDA' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'STOCK', score: 78, url: '/stocks/GOOGL' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'STOCK', score: 75, url: '/stocks/AMZN' },
    { symbol: 'TSLA', name: 'Tesla Inc.', type: 'STOCK', score: 64, url: '/stocks/TSLA' },
    { symbol: 'META', name: 'Meta Platforms', type: 'STOCK', score: 81, url: '/stocks/META' },
    { symbol: 'BRK.B', name: 'Berkshire Hathaway', type: 'STOCK', score: 72, url: '/stocks/BRK.B' },
    { symbol: 'TSM', name: 'Taiwan Semiconductor', type: 'STOCK', score: 88, url: '/stocks/TSM' },
    { symbol: 'V', name: 'Visa Inc.', type: 'STOCK', score: 68, url: '/stocks/V' },
    { symbol: 'JPM', name: 'JPMorgan Chase', type: 'STOCK', score: 74, url: '/stocks/JPM' },
    { symbol: 'WMT', name: 'Walmart Inc.', type: 'STOCK', score: 69, url: '/stocks/WMT' },
    { symbol: 'AMD', name: 'Advanced Micro Devices', type: 'STOCK', score: 79, url: '/stocks/AMD' },
    { symbol: 'NFLX', name: 'Netflix Inc.', type: 'STOCK', score: 76, url: '/stocks/NFLX' },
    { symbol: 'COIN', name: 'Coinbase Global', type: 'STOCK', score: 83, url: '/stocks/COIN' },
];

export async function searchAssets(query: string, mode: 'all' | 'crypto' | 'stock' | 'forex'): Promise<SearchResult[]> {
    if (!query || query.length < 1) return [];

    const normalizedQuery = query.toLowerCase();

    return ASSET_DATABASE.filter(asset => {
        // Filter by mode
        if (mode === 'crypto' && asset.type !== 'CRYPTO') return false;
        if (mode === 'stock' && asset.type !== 'STOCK') return false;

        // Filter by text match
        return (
            asset.symbol.toLowerCase().includes(normalizedQuery) ||
            asset.name.toLowerCase().includes(normalizedQuery)
        );
    });
}
