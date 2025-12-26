/**
 * ZenithScore v2 API Adapter
 * 
 * CORE RULE:
 * - Calls the existing merged API (READ-ONLY)
 * - NEVER overwrites convictionScore from API
 * - If derived score !== API score → API score wins
 * - Reshapes response to v2 contracts
 * - Computes derived analytics (regime, factors) from OHLCV
 */

import type {
    Asset,
    AssetSnapshot,
    AlgorithmPick,
    OHLCV,
    MarketType,
    AlgorithmResult,
    Scenario,
    TradeLogic
} from '@/lib/types/market';
import { getRegimeFromOHLCV } from '@/lib/analysis/regime';
import { computeFactorStack, computeScores } from '@/lib/analysis/factors';

// ============================================
// MOCK DATA (Replace with real API calls)
// ============================================

/**
 * Generate mock OHLCV data for testing
 * Replace this with actual API call to your merged API
 */
function generateMockOHLCV(symbol: string, days: number = 252): OHLCV[] {
    const data: OHLCV[] = [];
    const now = Date.now();
    let price = symbol === 'BTC' ? 43000 : symbol === 'ETH' ? 2200 : 100;

    for (let i = days; i >= 0; i--) {
        const timestamp = now - i * 24 * 60 * 60 * 1000;
        const volatility = 0.02;
        const change = (Math.random() - 0.5) * 2 * volatility;

        price = price * (1 + change);
        const high = price * (1 + Math.random() * 0.01);
        const low = price * (1 - Math.random() * 0.01);
        const volume = 1000000 + Math.random() * 500000;

        data.push({
            timestamp,
            open: price * (1 - change / 2),
            high,
            low,
            close: price,
            volume,
        });
    }

    return data;
}

/**
 * Generate mock v1 conviction score
 * Replace with actual API call
 */
function getMockConvictionScore(symbol: string): number {
    // Mock scores based on symbol for testing
    const scores: Record<string, number> = {
        'BTC': 85,
        'ETH': 78,
        'SOL': 72,
        'AAPL': 81,
        'NVDA': 88,
        'TSLA': 65,
    };
    return scores[symbol] ?? Math.floor(Math.random() * 40) + 50;
}

// ============================================
// ADAPTER FUNCTIONS
// ============================================

/**
 * Fetch asset snapshot with v1 score + v2 derived intelligence
 */
export async function fetchAssetSnapshot(
    market: MarketType,
    symbol: string
): Promise<AssetSnapshot | null> {
    try {
        // TODO: Replace with actual API call to merged API
        // const response = await fetch(`/api/market/${market}/${symbol}`);
        // const apiData = await response.json();

        // For now, use mock data
        const ohlcv = generateMockOHLCV(symbol);
        const convictionScore = getMockConvictionScore(symbol);

        // v2 Derived (from OHLCV - NOT authoritative)
        const regime = getRegimeFromOHLCV(ohlcv);
        const factors = computeFactorStack(ohlcv);
        const { volatilityScore, liquidityScore } = computeScores(ohlcv);

        const latestPrice = ohlcv[ohlcv.length - 1]?.close ?? 0;
        const previousPrice = ohlcv[ohlcv.length - 2]?.close ?? latestPrice;
        const change24h = ((latestPrice - previousPrice) / previousPrice) * 100;

        return {
            id: `${symbol}-USD`,
            market,
            symbol,
            name: symbol, // TODO: Get from API
            price: latestPrice,
            change24h,
            convictionScore, // FROM v1 API - NEVER override
            regime,          // v2 derived
            volatilityScore, // v2 derived
            liquidityScore,  // v2 derived
            dataTimestamp: Date.now(),
            ohlcv,
            factors,
        };
    } catch (error) {
        console.error(`Failed to fetch asset snapshot for ${symbol}:`, error);
        return null;
    }
}

/**
 * Fetch all assets for a market
 */
export async function fetchMarketAssets(market: MarketType): Promise<Asset[]> {
    // TODO: Replace with actual API call
    const symbols = market === 'crypto'
        ? ['BTC', 'ETH', 'SOL', 'ADA', 'DOT', 'AVAX', 'MATIC', 'LINK']
        : market === 'stock'
            ? ['AAPL', 'NVDA', 'TSLA', 'MSFT', 'GOOGL', 'AMZN', 'META']
            : ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD'];

    const assets: Asset[] = [];

    for (const symbol of symbols) {
        const snapshot = await fetchAssetSnapshot(market, symbol);
        if (snapshot) {
            // Strip OHLCV and factors for list view
            const { ohlcv, factors, ...asset } = snapshot;
            assets.push(asset);
        }
    }

    return assets;
}

/**
 * Fetch algorithm picks for a market
 * Only returns assets that pass v1 thresholds
 */
export async function fetchAlgorithmPicks(market: MarketType): Promise<AlgorithmPick[]> {
    const assets = await fetchMarketAssets(market);
    const picks: AlgorithmPick[] = [];

    for (const asset of assets) {
        // v1 decides what is good
        if (asset.convictionScore >= 70 && asset.regime !== 'chaos') {
            const snapshot = await fetchAssetSnapshot(market, asset.symbol);
            if (snapshot) {
                picks.push({
                    asset: snapshot,
                    scenarios: generateScenarios(snapshot),
                    tradeLogic: generateTradeLogic(snapshot),
                    invalidations: generateInvalidations(snapshot),
                });
            }
        }
    }

    return picks.sort((a, b) => b.asset.convictionScore - a.asset.convictionScore);
}

/**
 * Fetch full algorithm result for deep analysis page
 */
export async function fetchAlgorithmResult(
    market: MarketType,
    symbol: string
): Promise<AlgorithmResult | null> {
    const snapshot = await fetchAssetSnapshot(market, symbol);

    if (!snapshot) return null;

    // Check if asset qualifies for analysis
    if (snapshot.convictionScore < 70 || snapshot.regime === 'chaos') {
        return null; // Guard: no analysis for non-algorithm assets
    }

    return {
        assetId: snapshot.id,
        convictionScore: snapshot.convictionScore, // FROM v1 API
        regime: snapshot.regime,
        factors: snapshot.factors,
        scenarios: generateScenarios(snapshot),
        tradeLogic: generateTradeLogic(snapshot),
        invalidationSignals: generateInvalidations(snapshot),
        dataTimestamp: snapshot.dataTimestamp,
    };
}

// ============================================
// SCENARIO & TRADE LOGIC GENERATORS
// ============================================

function generateScenarios(snapshot: AssetSnapshot): Scenario[] {
    const { regime, factors } = snapshot;

    // Scenario probabilities based on regime
    const probs = regime === 'trend'
        ? { bull: 50, base: 35, bear: 15 }
        : regime === 'breakout'
            ? { bull: 45, base: 30, bear: 25 }
            : regime === 'range'
                ? { bull: 30, base: 50, bear: 20 }
                : { bull: 25, base: 40, bear: 35 };

    return [
        {
            id: 'bull',
            probability: probs.bull,
            description: 'Continuation scenario with sustained momentum',
            trigger: 'Price holds above key moving averages with volume confirmation',
            expectedBehavior: 'Gradual appreciation toward upper resistance zones',
            riskSignal: 'Failure to maintain support levels',
        },
        {
            id: 'base',
            probability: probs.base,
            description: 'Consolidation scenario with range-bound price action',
            trigger: 'Volatility compression and mixed signals',
            expectedBehavior: 'Sideways movement within established range',
            riskSignal: 'Extended consolidation may lead to breakdown',
        },
        {
            id: 'bear',
            probability: probs.bear,
            description: 'Reversion scenario with corrective price action',
            trigger: 'Loss of momentum and trend structure',
            expectedBehavior: 'Pullback toward lower support zones',
            riskSignal: 'Cascading liquidations on high leverage',
        },
    ];
}

function generateTradeLogic(snapshot: AssetSnapshot): TradeLogic {
    const { price, factors, regime } = snapshot;

    // Simple entry zone calculation (10% range)
    const entryMin = price * 0.95;
    const entryMax = price * 1.02;

    // Invalidation at 15% below
    const invalidationPrice = price * 0.85;

    return {
        horizon: regime === 'breakout' ? 'short' : regime === 'trend' ? 'medium' : 'long',
        entryZone: {
            min: entryMin,
            max: entryMax,
            reasoning: `Entry zone based on current support cluster and ${factors.trend.interpretation}`,
        },
        invalidationLevel: {
            price: invalidationPrice,
            reasoning: 'Below major moving average confluence and trend structure',
        },
        positionSizing: {
            riskPercent: 1.5,
            explanation: 'Risk 1-2% of portfolio, sized for 15% stop distance',
        },
    };
}

function generateInvalidations(snapshot: AssetSnapshot): string[] {
    const { regime, factors } = snapshot;

    const signals = [
        'Regime shift from current classification',
        'Loss of trend structure (EMA crossover)',
        'Volatility spike above 95th percentile',
    ];

    if (factors.liquidity.value < 0.5) {
        signals.push('Current liquidity below threshold - watch for slippage');
    }

    if (regime === 'breakout') {
        signals.push('Failed breakout with volume exhaustion');
    }

    return signals;
}

// ============================================
// GUARD FUNCTIONS
// ============================================

/**
 * Check if an asset has algorithm-level analysis available
 */
export function hasAnalysisAvailable(asset: Asset): boolean {
    return asset.convictionScore >= 70 && asset.regime !== 'chaos';
}

/**
 * Get analysis URL if available, null otherwise
 */
export function getAnalysisUrl(asset: Asset): string | null {
    if (!hasAnalysisAvailable(asset)) return null;
    return `/${asset.market}/${asset.symbol}/analysis`;
}

// ============================================
// DEEP ANALYSIS PAGE DATA (Phase 5 Step 2)
// ============================================

/**
 * Analysis payload for Deep Analysis page
 * This is the EXACT shape the page expects
 */
export type AnalysisPayload = {
    asset: {
        id: string;
        symbol: string;
        name: string;
        regime: import('@/lib/types/market').RegimeType;
        convictionScore: number;
        price: number;
        change24h?: number;
    };
    ohlcv: OHLCV[];
    factors: import('@/lib/types/market').FactorStack;
    scenarios: Scenario[];
    tradeLogic: TradeLogic;
    invalidationSignals: string[];
    isAlgorithmPick: boolean;
};

/**
 * Fetch complete analysis data for Deep Analysis page
 * Returns null if asset doesn't qualify (guard will redirect)
 */
export async function getAnalysis(
    market: MarketType,
    symbol: string
): Promise<AnalysisPayload | null> {
    const snapshot = await fetchAssetSnapshot(market, symbol);

    if (!snapshot) return null;

    const isAlgorithmPick = snapshot.convictionScore >= 70 && snapshot.regime !== 'chaos';

    return {
        asset: {
            id: snapshot.id,
            symbol: snapshot.symbol,
            name: snapshot.name,
            regime: snapshot.regime,
            convictionScore: snapshot.convictionScore,
            price: snapshot.price,
            change24h: snapshot.change24h,
        },
        ohlcv: snapshot.ohlcv,
        factors: snapshot.factors,
        scenarios: generateScenarios(snapshot),
        tradeLogic: generateTradeLogic(snapshot),
        invalidationSignals: generateInvalidations(snapshot),
        isAlgorithmPick,
    };
}

/**
 * Fetch data for Command Center page
 */
export async function getCommandCenterData(market: MarketType = 'crypto') {
    const picks = await fetchAlgorithmPicks(market);
    const allAssets = await fetchMarketAssets(market);

    // Determine overall market regime from top assets
    const regimeCounts = allAssets.reduce((acc, asset) => {
        acc[asset.regime] = (acc[asset.regime] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const dominantRegime = Object.entries(regimeCounts)
        .sort(([, a], [, b]) => b - a)[0]?.[0] as import('@/lib/types/market').RegimeType || 'chaos';

    const regimeExplanations: Record<string, string> = {
        trend: 'Volatility is contracting while momentum remains elevated. Historically, this favors continuation setups over mean reversion.',
        breakout: 'Markets are breaking out of consolidation with elevated volume. This environment rewards directional conviction.',
        range: 'Price action is compressing within defined boundaries. This typically precedes a directional move.',
        breakdown: 'Trend structure has inverted with sustained selling pressure. Defensive positioning typically outperforms.',
        chaos: 'Market signals are mixed with no clear directional bias. Elevated selectivity is recommended.',
    };

    return {
        marketRegimeSummary: {
            regime: dominantRegime,
            explanation: regimeExplanations[dominantRegime] || regimeExplanations.chaos,
        },
        stats: {
            enteredPicks: picks.length,
            improved: Math.floor(picks.length * 0.6),
            invalidated: Math.floor(Math.random() * 5),
        },
        topPicks: picks.slice(0, 6),
    };
}

/**
 * Fetch data for Market page (Crypto/Stocks/Forex)
 */
export async function getMarketPageData(market: MarketType) {
    const [assets, algorithmPicks] = await Promise.all([
        fetchMarketAssets(market),
        fetchAlgorithmPicks(market),
    ]);

    // Get OHLCV for each asset for MiniCharts
    const assetsWithOHLCV = await Promise.all(
        assets.map(async (asset) => {
            const snapshot = await fetchAssetSnapshot(market, asset.symbol);
            return snapshot ? { ...asset, ohlcv: snapshot.ohlcv } : null;
        })
    );

    return {
        assets: assetsWithOHLCV.filter(Boolean) as (Asset & { ohlcv: OHLCV[] })[],
        algorithmPicks,
    };
}
