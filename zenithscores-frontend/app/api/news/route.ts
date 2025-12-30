import { NextRequest, NextResponse } from 'next/server';

// Simple news API that returns latest headlines
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '10', 10);

        // Return mock news data for now
        // TODO: Integrate with real news API (e.g., NewsAPI, Alpha Vantage News)
        const news = [
            {
                id: '1',
                title: 'Bitcoin Surges Past Key Resistance Level',
                summary: 'BTC breaks through major resistance as institutional interest grows.',
                category: 'crypto',
                source: 'CryptoNews',
                publishedAt: new Date().toISOString(),
                url: '#'
            },
            {
                id: '2',
                title: 'Fed Signals Potential Rate Pause',
                summary: 'Federal Reserve hints at holding rates steady in upcoming meeting.',
                category: 'macro',
                source: 'MarketWatch',
                publishedAt: new Date(Date.now() - 3600000).toISOString(),
                url: '#'
            },
            {
                id: '3',
                title: 'Tech Earnings Beat Expectations',
                summary: 'Major tech companies report strong Q4 results.',
                category: 'stocks',
                source: 'Bloomberg',
                publishedAt: new Date(Date.now() - 7200000).toISOString(),
                url: '#'
            },
            {
                id: '4',
                title: 'EUR/USD Stabilizes After Volatility',
                summary: 'Euro finds support as European economic data improves.',
                category: 'forex',
                source: 'ForexLive',
                publishedAt: new Date(Date.now() - 10800000).toISOString(),
                url: '#'
            },
            {
                id: '5',
                title: 'DeFi TVL Reaches New Highs',
                summary: 'Total value locked in DeFi protocols hits record levels.',
                category: 'crypto',
                source: 'DeFi Pulse',
                publishedAt: new Date(Date.now() - 14400000).toISOString(),
                url: '#'
            }
        ].slice(0, limit);

        return NextResponse.json({ news });
    } catch (error) {
        console.error('[API] Failed to fetch news:', error);
        return NextResponse.json({ news: [] });
    }
}
