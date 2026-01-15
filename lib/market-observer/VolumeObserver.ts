// lib/market-observer/VolumeObserver.ts

export type VolumeRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface VolumeAssessment {
    mint: string;
    symbol: string;

    volume24hUsd: number;
    volume1hUsd: number;
    volume5mUsd: number;
    liquidityUsd: number;

    volumeChange1hPct: number;
    riskLevel: VolumeRiskLevel;
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
                // Find best pair for this mint
                const tokenPairs = pairs.filter((p: any) => p.baseToken.address === mint);
                if (tokenPairs.length === 0) return null;

                // Sort by liquidity
                tokenPairs.sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));
                const bestPair = tokenPairs[0];

                return this.assess(bestPair);
            });

        } catch (error) {
            console.error('VolumeObserver: analyzeBatch failed', error);
            // Return nulls for failed batch to keep alignment? Or empty?
            // Returning empty might break alignment if caller expects ordered results.
            // Returning array of nulls matching length.
            return new Array(mints.length).fill(null);
        }
    }

    assess(pair: {
        baseToken: { address: string; symbol: string };
        volume?: { h24?: number; h1?: number; m5?: number };
        liquidity?: { usd?: number };
        priceChange?: { h1?: number };
        priceUsd?: string;
    }): VolumeAssessment {
        const volume24h = pair.volume?.h24 ?? 0;
        const volume1h = pair.volume?.h1 ?? 0;
        const volume5m = pair.volume?.m5 ?? 0;
        const liquidityUsd = pair.liquidity?.usd ?? 0;

        const avgHourly = volume24h / 24;
        const volumeChange1hPct =
            avgHourly > 0 ? ((volume1h - avgHourly) / avgHourly) * 100 : 0;

        let riskLevel: VolumeRiskLevel = 'LOW';
        let reason = 'Normal volume behavior';

        const escalate = (level: VolumeRiskLevel, msg: string) => {
            const order: VolumeRiskLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
            if (order.indexOf(level) > order.indexOf(riskLevel)) {
                riskLevel = level;
                reason = msg;
            }
        };

        // 🔴 Rule 1 — Minimum viable volume
        if (volume24h < 10_000) {
            escalate(
                'HIGH',
                '24h volume below $10k — thin market / manipulation risk'
            );
        }

        // 🔴 Rule 2 — Volume collapse
        if (avgHourly > 0 && volume1h < avgHourly * 0.3) {
            escalate(
                'HIGH',
                '1h volume collapsed >70% — distribution / exit phase'
            );
        }

        // 🚨 Rule 3 — Sudden spike + low liquidity (rug signature)
        if (volume5m > avgHourly * 3 && liquidityUsd < 50_000) {
            escalate(
                'CRITICAL',
                'Explosive short-term volume + low liquidity — pump & dump signature'
            );
        }

        // 🟡 Rule 4 — Stagnation
        if (
            Math.abs(volumeChange1hPct) < 10 &&
            liquidityUsd > 20_000 &&
            Math.abs(pair.priceChange?.h1 ?? 0) < 1
        ) {
            escalate(
                'MEDIUM',
                'Volume stagnant and price flat — dead capital'
            );
        }

        // 🟢 Rule 5 — Healthy expansion
        if (volumeChange1hPct > 50 && liquidityUsd > 50_000) {
            escalate(
                'LOW',
                'Healthy volume expansion — real participation'
            );
        }

        return {
            mint: pair.baseToken.address,
            symbol: pair.baseToken.symbol,

            volume24hUsd: volume24h,
            volume1hUsd: volume1h,
            volume5mUsd: volume5m,
            liquidityUsd,

            volumeChange1hPct,
            riskLevel,
            reason,
            priceUsd: parseFloat(pair.priceUsd || '0')
        };
    }
}
