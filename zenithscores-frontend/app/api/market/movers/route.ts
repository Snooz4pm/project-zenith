import { NextResponse } from 'next/server';
import { getStockQuote } from '@/lib/finnhub';

export const dynamic = 'force-dynamic';

// Top stocks to track for market movers
const TOP_SYMBOLS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA'];
const STOCK_NAMES: Record<string, string> = {
    'AAPL': 'Apple Inc.',
    'MSFT': 'Microsoft',
    'GOOGL': 'Alphabet',
    'AMZN': 'Amazon',
    'NVDA': 'NVIDIA',
    'META': 'Meta',
    'TSLA': 'Tesla',
};

export async function GET() {
    try {
        const movers = await Promise.all(
            TOP_SYMBOLS.map(async (symbol) => {
                try {
                    const quote = await getStockQuote(symbol);
                    if (!quote || quote.c === 0) return null;

                    return {
                        symbol,
                        name: STOCK_NAMES[symbol] || symbol,
                        price: quote.c,
                        change: quote.d || 0,
                        changePercent: quote.dp || 0,
                    };
                } catch (e) {
                    return null;
                }
            })
        );

        const validMovers = movers.filter(Boolean);

        return NextResponse.json({ movers: validMovers });
    } catch (error) {
        console.error('Market movers error:', error);
        return NextResponse.json({ movers: [] });
    }
}
