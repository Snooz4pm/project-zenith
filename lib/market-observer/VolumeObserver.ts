// lib/market-observer/VolumeObserver.ts

export type VolumeRiskLevel = 'SAFE' | 'MEDIUM' | 'MEME';

export interface VolumeAssessment {
    mint: string;
    symbol: string;

    volume24hUsd: number;
    volume1hUsd: number;
    volume5mUsd: number;
    liquidityUsd: number;

    volumeChange1hPct: number;
    riskLevel: VolumeRiskLevel;
    riskScore: number;
    reason: string;
    priceUsd: number;
}

export class VolumeObserver {
    /**
     * Analyze a batch of tokens using DexScreener
     */
    async analyzeBatch(mints: string[]): Promise<(VolumeAssessment | null)[]> {
        if (mints.length === 0) return [];

        try {
            const ids = mints.join(',');
            const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${ids}`);
            const data = await res.json();
            const pairs = data.pairs || [];

            return mints.map(mint => {
                const tokenPairs = pairs.filter((p: any) => p.baseToken.address === mint);
                if (tokenPairs.length === 0) return null;

                tokenPairs.sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));
                const bestPair = tokenPairs[0];

                return this.assess(bestPair);
            });

        } catch (error) {
            console.error('VolumeObserver: analyzeBatch failed', error);
            return new Array(mints.length).fill(null);
        }
    }

    private liquidityRisk(liqUsd: number): number {
        if (liqUsd >= 5_000_000) return 0;
        if (liqUsd >= 1_000_000) return 5;
        if (liqUsd >= 250_000) return 15;
        if (liqUsd >= 50_000) return 30;
        return 40;
    }

    private ageRisk(pairCreatedAt: number): number {
        if (!pairCreatedAt) return 30;
        const daysAlive = (Date.now() - pairCreatedAt) / (1000 * 60 * 60 * 24);
        if (daysAlive >= 180) return 0;
        if (daysAlive >= 60) return 5;
        if (daysAlive >= 14) return 15;
        if (daysAlive >= 3) return 25;
        return 30;
    }

    private volatilityRisk(volPct5m: number): number {
        const absVol = Math.abs(volPct5m);
        if (absVol <= 2) return 0;
        if (absVol <= 5) return 5;
        if (absVol <= 10) return 12;
        if (absVol <= 20) return 18;
        return 20;
    }

    private contractRisk(pair: any): number {
        // Placeholder for future RugCheck integration
        // DexScreener doesn't expose honeypot directly, but we can flag low liquidity locks if we had the data
        return 0;
    }

    private getRiskTier(score: number): VolumeRiskLevel {
        if (score <= 30) return 'SAFE';
        if (score <= 65) return 'MEDIUM';
        return 'MEME';
    }

    assess(pair: any): VolumeAssessment {
        const volume24h = pair.volume?.h24 ?? 0;
        const volume1h = pair.volume?.h1 ?? 0;
        const volume5m = pair.volume?.m5 ?? 0;
        const liquidityUsd = pair.liquidity?.usd ?? 0;
        const priceChange5m = pair.priceChange?.m5 ?? 0;

        const avgHourly = volume24h / 24;
        const volumeChange1hPct = avgHourly > 0 ? ((volume1h - avgHourly) / avgHourly) * 100 : 0;

        const score =
            this.liquidityRisk(liquidityUsd) +
            this.ageRisk(pair.pairCreatedAt) +
            this.volatilityRisk(priceChange5m) +
            this.contractRisk(pair);

        const clampedScore = Math.min(100, Math.max(0, score));
        const riskLevel = this.getRiskTier(clampedScore);

        // Determine a human-friendly reason
        let reason = 'Market conditions stable';
        if (clampedScore > 65) reason = 'High volatility / thin liquidity';
        else if (clampedScore > 30) reason = 'Moderate growth / early phase';

        return {
            mint: pair.baseToken.address,
            symbol: pair.baseToken.symbol,
            volume24hUsd: volume24h,
            volume1hUsd: volume1h,
            volume5mUsd: volume5m,
            liquidityUsd,
            volumeChange1hPct,
            riskLevel,
            riskScore: clampedScore,
            reason,
            priceUsd: parseFloat(pair.priceUsd || '0')
        };
    }
}
