import { Metadata } from 'next';
import MobileMarkets from '@/components/mobile/MobileMarkets';

export const metadata: Metadata = {
    title: 'Markets | ZenithScores',
    description: 'Explore cryptocurrency, stock, and forex markets',
};

// Temporary mock data - replace with real API calls
async function getMarketAssets() {
    const cryptoAssets = [
        { symbol: 'BTC', name: 'Bitcoin', price: 45230.50, change24h: 3.45, href: '/crypto/BTC' },
        { symbol: 'ETH', name: 'Ethereum', price: 2340.80, change24h: 5.12, href: '/crypto/ETH' },
        { symbol: 'SOL', name: 'Solana', price: 98.45, change24h: -2.34, href: '/crypto/SOL' },
        { symbol: 'ARB', name: 'Arbitrum', price: 1.23, change24h: 1.56, href: '/crypto/ARB' },
        { symbol: 'AVAX', name: 'Avalanche', price: 35.67, change24h: -1.23, href: '/crypto/AVAX' },
    ];

    const stockAssets = [
        { symbol: 'AAPL', name: 'Apple Inc.', price: 178.25, change24h: 1.23, href: '/stocks/AAPL' },
        { symbol: 'TSLA', name: 'Tesla Inc.', price: 245.67, change24h: -1.45, href: '/stocks/TSLA' },
        { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 495.32, change24h: 4.67, href: '/stocks/NVDA' },
        { symbol: 'MSFT', name: 'Microsoft', price: 378.91, change24h: 0.89, href: '/stocks/MSFT' },
        { symbol: 'AMZN', name: 'Amazon', price: 153.45, change24h: 2.12, href: '/stocks/AMZN' },
    ];

    const forexAssets = [
        { symbol: 'EUR/USD', name: 'Euro / US Dollar', price: 1.0923, change24h: 0.12, href: '/forex/EURUSD' },
        { symbol: 'GBP/USD', name: 'British Pound / US Dollar', price: 1.2654, change24h: -0.23, href: '/forex/GBPUSD' },
        { symbol: 'USD/JPY', name: 'US Dollar / Japanese Yen', price: 149.87, change24h: 0.45, href: '/forex/USDJPY' },
        { symbol: 'AUD/USD', name: 'Australian Dollar / US Dollar', price: 0.6543, change24h: -0.34, href: '/forex/AUDUSD' },
    ];

    return { cryptoAssets, stockAssets, forexAssets };
}

export default async function MobileMarketsPage() {
    const { cryptoAssets, stockAssets, forexAssets } = await getMarketAssets();

    return (
        <MobileMarkets
            cryptoAssets={cryptoAssets}
            stockAssets={stockAssets}
            forexAssets={forexAssets}
        />
    );
}
