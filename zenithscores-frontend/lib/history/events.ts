/**
 * MarketEvent - Historical Event Data Model
 * 
 * HIERARCHICAL EVENT INHERITANCE:
 * - GLOBAL: Applies to all assets (GFC, COVID, etc.)
 * - MARKET: Applies to asset class (crypto market, forex market)
 * - ASSET: Applies to specific symbol (BTC halvings, iPhone launch)
 */

export type EventScope = 'GLOBAL' | 'MARKET' | 'ASSET';
export type MarketType = 'STOCKS' | 'CRYPTO' | 'FOREX';
export type EventImportance = 1 | 2 | 3; // 1 = major, 2 = significant, 3 = notable

export interface MarketEvent {
    id: string;

    // Scope hierarchy
    scope: EventScope;
    market?: MarketType;
    symbol?: string;

    // Time window
    startDate: string; // YYYY-MM-DD
    endDate?: string;

    // Content
    title: string;
    summary: string;
    whyItMatters: string;
    whatHappenedNext: string;

    // Metadata
    importance: EventImportance;
}

/**
 * CANONICAL HISTORICAL EVENTS
 * Real events only. No hallucinations.
 */

// GLOBAL EVENTS (applies to all assets)
const GLOBAL_EVENTS: MarketEvent[] = [
    {
        id: 'global-dotcom-2000',
        scope: 'GLOBAL',
        startDate: '2000-03-10',
        endDate: '2002-10-09',
        title: 'Dot-com Bubble Burst',
        summary: 'The NASDAQ crashed 78% as internet company valuations collapsed.',
        whyItMatters: 'Defined how markets value tech companies. Introduced skepticism toward unprofitable growth.',
        whatHappenedNext: 'Tech companies refocused on profitability. Survivors like Amazon, Apple, Google dominated the next decade.',
        importance: 1
    },
    {
        id: 'global-gfc-2008',
        scope: 'GLOBAL',
        startDate: '2008-09-15',
        endDate: '2009-03-09',
        title: 'Global Financial Crisis',
        summary: 'Lehman Brothers collapsed. Credit markets froze. Global recession followed.',
        whyItMatters: 'Largest financial crisis since 1929. Changed banking regulation globally. Fed introduced QE.',
        whatHappenedNext: 'A decade of low interest rates, quantitative easing, and the longest bull market in history.',
        importance: 1
    },
    {
        id: 'global-covid-2020',
        scope: 'GLOBAL',
        startDate: '2020-02-20',
        endDate: '2020-03-23',
        title: 'COVID-19 Market Crash',
        summary: 'Fastest 30% drop in history. Global lockdowns halted economic activity.',
        whyItMatters: 'Proved markets can crash without warning. Central banks responded with unprecedented stimulus.',
        whatHappenedNext: 'Markets recovered in months. Tech stocks surged. Inflation followed in 2021-2022.',
        importance: 1
    },
    {
        id: 'global-inflation-2022',
        scope: 'GLOBAL',
        startDate: '2022-01-03',
        endDate: '2022-10-12',
        title: 'Inflation & Rate Hikes',
        summary: 'Fed raised rates at fastest pace since 1980s. 40-year high inflation.',
        whyItMatters: 'Ended the zero-rate era. Crushed growth stocks. Strong dollar hurt emerging markets.',
        whatHappenedNext: 'Tech valuations reset. Bonds had worst year ever. Cash became competitive again.',
        importance: 1
    }
];

// CRYPTO MARKET EVENTS
const CRYPTO_MARKET_EVENTS: MarketEvent[] = [
    {
        id: 'crypto-first-bubble-2013',
        scope: 'MARKET',
        market: 'CRYPTO',
        startDate: '2013-11-29',
        endDate: '2015-01-14',
        title: 'First Bitcoin Bubble',
        summary: 'BTC hit $1,100 then crashed 85%. Mt. Gox collapsed.',
        whyItMatters: 'First mainstream crypto mania. Proved crypto could attract serious capital.',
        whatHappenedNext: 'Two years of "crypto winter". Ethereum launched. Infrastructure improved.',
        importance: 1
    },
    {
        id: 'crypto-ico-bubble-2017',
        scope: 'MARKET',
        market: 'CRYPTO',
        startDate: '2017-12-17',
        endDate: '2018-12-15',
        title: 'ICO Bubble',
        summary: 'BTC hit $20,000. Thousands of ICOs raised billions. 90%+ failed.',
        whyItMatters: 'Proved crypto could sustain speculative mania. Regulators took notice.',
        whatHappenedNext: '85% crash. SEC crackdown on ICOs. DeFi and NFTs emerged from the ashes.',
        importance: 1
    },
    {
        id: 'crypto-defi-summer-2020',
        scope: 'MARKET',
        market: 'CRYPTO',
        startDate: '2020-06-15',
        endDate: '2020-09-30',
        title: 'DeFi Summer',
        summary: 'Yield farming exploded. Total Value Locked went from $1B to $10B.',
        whyItMatters: 'Proved crypto could recreate financial services. Uniswap, Aave, Compound became blue chips.',
        whatHappenedNext: 'DeFi became permanent infrastructure. Led into 2021 bull run.',
        importance: 2
    },
    {
        id: 'crypto-ftx-collapse-2022',
        scope: 'MARKET',
        market: 'CRYPTO',
        startDate: '2022-11-06',
        endDate: '2022-11-21',
        title: 'Terra/FTX Collapse',
        summary: 'UST/LUNA collapsed in May. FTX fraud revealed in November. $60B+ lost.',
        whyItMatters: 'Worst fraud in crypto history. Proved centralized entities are points of failure.',
        whatHappenedNext: 'Regulatory pressure intensified. Self-custody became priority. Market bottomed.',
        importance: 1
    }
];

// FOREX MARKET EVENTS
const FOREX_MARKET_EVENTS: MarketEvent[] = [
    {
        id: 'forex-gbp-erm-1992',
        scope: 'MARKET',
        market: 'FOREX',
        startDate: '1992-09-16',
        title: 'Black Wednesday (GBP ERM Crisis)',
        summary: 'UK forced out of ERM. Pound crashed 15%. Soros made $1B.',
        whyItMatters: 'Proved central banks can lose to markets. Made George Soros famous.',
        whatHappenedNext: 'UK never joined Euro. Bank of England gained independence.',
        importance: 1
    },
    {
        id: 'forex-chf-unpeg-2015',
        scope: 'MARKET',
        market: 'FOREX',
        startDate: '2015-01-15',
        title: 'CHF Unpeg (Swiss Franc Crisis)',
        summary: 'SNB removed EUR/CHF floor without warning. CHF surged 30% in minutes.',
        whyItMatters: 'Largest intraday move in modern forex. Brokers went bankrupt. Trust in central banks shaken.',
        whatHappenedNext: 'Negative rates became normal. Forex brokers changed margin rules.',
        importance: 1
    },
    {
        id: 'forex-usd-supercycle-2022',
        scope: 'MARKET',
        market: 'FOREX',
        startDate: '2022-03-01',
        endDate: '2022-09-28',
        title: 'USD Supercycle',
        summary: 'Dollar index hit 20-year high. EUR hit parity. Emerging markets struggled.',
        whyItMatters: 'Fed tightening while others lagged. Dollar strength broke correlations.',
        whatHappenedNext: 'EM debt crises. Japan intervened. Dollar eventually peaked.',
        importance: 2
    }
];

// ASSET-SPECIFIC EVENTS (major assets only)
const ASSET_EVENTS: MarketEvent[] = [
    // BTC
    {
        id: 'btc-halving-2012',
        scope: 'ASSET',
        market: 'CRYPTO',
        symbol: 'BTC',
        startDate: '2012-11-28',
        title: 'First Bitcoin Halving',
        summary: 'Block reward dropped from 50 to 25 BTC. Supply shock began.',
        whyItMatters: 'Established the halving narrative. Price was ~$12, went to $1,100.',
        whatHappenedNext: '9,000% rally over next year.',
        importance: 1
    },
    {
        id: 'btc-halving-2016',
        scope: 'ASSET',
        market: 'CRYPTO',
        symbol: 'BTC',
        startDate: '2016-07-09',
        title: 'Second Bitcoin Halving',
        summary: 'Block reward dropped from 25 to 12.5 BTC.',
        whyItMatters: 'Confirmed halving pattern. Price was ~$650.',
        whatHappenedNext: 'Bull run to $20,000 by December 2017.',
        importance: 1
    },
    {
        id: 'btc-halving-2020',
        scope: 'ASSET',
        market: 'CRYPTO',
        symbol: 'BTC',
        startDate: '2020-05-11',
        title: 'Third Bitcoin Halving',
        summary: 'Block reward dropped from 12.5 to 6.25 BTC.',
        whyItMatters: 'Happened during COVID. Institutional interest began.',
        whatHappenedNext: 'Rally to $69,000 by November 2021.',
        importance: 1
    },
    {
        id: 'btc-halving-2024',
        scope: 'ASSET',
        market: 'CRYPTO',
        symbol: 'BTC',
        startDate: '2024-04-20',
        title: 'Fourth Bitcoin Halving',
        summary: 'Block reward dropped from 6.25 to 3.125 BTC.',
        whyItMatters: 'First halving with ETF approval. Supply squeeze with institutional demand.',
        whatHappenedNext: 'Ongoing. Pattern suggests 12-18 month bull cycle.',
        importance: 1
    },
    // ETH
    {
        id: 'eth-merge-2022',
        scope: 'ASSET',
        market: 'CRYPTO',
        symbol: 'ETH',
        startDate: '2022-09-15',
        title: 'The Merge (Proof of Stake)',
        summary: 'Ethereum transitioned from PoW to PoS. Energy use dropped 99.95%.',
        whyItMatters: 'Largest blockchain upgrade ever. ETH became deflationary.',
        whatHappenedNext: 'No major issues. Staking yield became standard.',
        importance: 1
    },
    // AAPL
    {
        id: 'aapl-iphone-2007',
        scope: 'ASSET',
        market: 'STOCKS',
        symbol: 'AAPL',
        startDate: '2007-06-29',
        title: 'iPhone Launch',
        summary: 'First iPhone released. Changed mobile computing forever.',
        whyItMatters: 'Created the smartphone era. Made Apple the most valuable company.',
        whatHappenedNext: 'Stock went from ~$4 (split-adjusted) to $200+.',
        importance: 1
    },
    // EUR/USD
    {
        id: 'eurusd-ecb-qe-2015',
        scope: 'ASSET',
        market: 'FOREX',
        symbol: 'EURUSD',
        startDate: '2015-01-22',
        title: 'ECB Launches QE',
        summary: 'ECB announced €60B/month bond buying. Euro crashed.',
        whyItMatters: 'Central bank divergence became the trade. EUR fell from 1.15 to 1.05.',
        whatHappenedNext: 'Years of low rates. Euro weakness.',
        importance: 2
    },
    {
        id: 'eurusd-parity-2022',
        scope: 'ASSET',
        market: 'FOREX',
        symbol: 'EURUSD',
        startDate: '2022-07-14',
        title: 'EUR/USD Hits Parity',
        summary: 'Euro fell below $1.00 for first time in 20 years.',
        whyItMatters: 'Fed/ECB divergence, energy crisis, Ukraine war combined.',
        whatHappenedNext: 'Euro bottomed. Recovered to 1.10+ as Fed paused.',
        importance: 1
    }
];

/**
 * Get events for a specific asset using hierarchical inheritance
 */
export function getEventsForAsset(
    symbol: string,
    assetType: 'stock' | 'crypto' | 'forex'
): MarketEvent[] {
    const marketType: MarketType =
        assetType === 'stock' ? 'STOCKS' :
            assetType === 'crypto' ? 'CRYPTO' : 'FOREX';

    // Collect events: GLOBAL + MARKET + ASSET
    const events: MarketEvent[] = [
        ...GLOBAL_EVENTS,
        ...CRYPTO_MARKET_EVENTS.filter(e => e.market === marketType),
        ...FOREX_MARKET_EVENTS.filter(e => e.market === marketType),
        ...ASSET_EVENTS.filter(e => e.symbol === symbol.toUpperCase())
    ];

    // Sort by date
    return events.sort((a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
}

/**
 * Find event that matches a specific date
 */
export function findEventAtDate(
    events: MarketEvent[],
    date: Date | number
): MarketEvent | null {
    const targetDate = typeof date === 'number' ? new Date(date * 1000) : date;
    const targetStr = targetDate.toISOString().split('T')[0];

    for (const event of events) {
        if (event.startDate === targetStr) {
            return event;
        }
        if (event.endDate && event.startDate <= targetStr && event.endDate >= targetStr) {
            // Also trigger on end date for major events
            if (event.endDate === targetStr) {
                return event;
            }
        }
    }
    return null;
}

/**
 * Check if a timestamp falls on an event date
 */
export function isEventDate(
    timestamp: number, // Unix seconds
    events: MarketEvent[]
): MarketEvent | null {
    const date = new Date(timestamp * 1000);
    return findEventAtDate(events, date);
}

// Export all events for seeding/debugging
export const ALL_EVENTS = {
    global: GLOBAL_EVENTS,
    crypto: CRYPTO_MARKET_EVENTS,
    forex: FOREX_MARKET_EVENTS,
    asset: ASSET_EVENTS
};
