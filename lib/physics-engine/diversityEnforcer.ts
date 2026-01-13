/**
 * Diversity Enforcer - Pillar 7
 * Removes correlated tokens, enforces max 2 per cluster
 */

import { TokenPriceHistory, TokenLearningState } from './types';

const HIGH_CORRELATION_THRESHOLD = 0.8;
const MAX_PER_CLUSTER = 2;

export interface DiversityResult {
    survivingTokens: string[];
    droppedTokens: { symbol: string; reason: string }[];
    clusters: string[][];
}

export function calculateCorrelation(a: TokenPriceHistory, b: TokenPriceHistory): number {
    if (a.prices.length < 5 || b.prices.length < 5) return 0;

    const len = Math.min(a.prices.length, b.prices.length);
    const rA: number[] = [], rB: number[] = [];

    for (let i = 1; i < len; i++) {
        if (a.prices[i - 1].price > 0 && b.prices[i - 1].price > 0) {
            rA.push((a.prices[i].price - a.prices[i - 1].price) / a.prices[i - 1].price);
            rB.push((b.prices[i].price - b.prices[i - 1].price) / b.prices[i - 1].price);
        }
    }
    if (rA.length < 3) return 0;

    const mA = rA.reduce((x, y) => x + y, 0) / rA.length;
    const mB = rB.reduce((x, y) => x + y, 0) / rB.length;
    let num = 0, dA = 0, dB = 0;
    for (let i = 0; i < rA.length; i++) {
        num += (rA[i] - mA) * (rB[i] - mB);
        dA += (rA[i] - mA) ** 2;
        dB += (rB[i] - mB) ** 2;
    }
    const denom = Math.sqrt(dA * dB);
    return denom === 0 ? 0 : num / denom;
}

export function enforceDiversity(
    states: TokenLearningState[],
    histories: TokenPriceHistory[]
): DiversityResult {
    const pairs: { a: string; b: string; c: number }[] = [];
    for (let i = 0; i < histories.length; i++) {
        for (let j = i + 1; j < histories.length; j++) {
            const c = calculateCorrelation(histories[i], histories[j]);
            if (Math.abs(c) >= HIGH_CORRELATION_THRESHOLD) {
                pairs.push({ a: histories[i].symbol, b: histories[j].symbol, c });
            }
        }
    }

    // Union-find for clusters
    const parent = new Map<string, string>();
    states.forEach(s => parent.set(s.symbol, s.symbol));
    const find = (x: string): string => {
        if (parent.get(x) !== x) parent.set(x, find(parent.get(x)!));
        return parent.get(x)!;
    };
    pairs.forEach(p => {
        const ra = find(p.a), rb = find(p.b);
        if (ra !== rb) parent.set(ra, rb);
    });

    const clusterMap = new Map<string, string[]>();
    states.forEach(s => {
        const r = find(s.symbol);
        if (!clusterMap.has(r)) clusterMap.set(r, []);
        clusterMap.get(r)!.push(s.symbol);
    });

    const clusters = [...clusterMap.values()].filter(c => c.length > 1);
    const dropped: { symbol: string; reason: string }[] = [];
    const dropSet = new Set<string>();

    for (const cluster of clusters) {
        if (cluster.length <= MAX_PER_CLUSTER) continue;
        const sorted = states.filter(s => cluster.includes(s.symbol))
            .sort((a, b) => b.cumulativeScore - a.cumulativeScore);
        sorted.slice(MAX_PER_CLUSTER).forEach(t => {
            dropSet.add(t.symbol);
            dropped.push({ symbol: t.symbol, reason: `Correlated cluster, weaker score` });
        });
    }

    return {
        survivingTokens: states.map(s => s.symbol).filter(s => !dropSet.has(s)),
        droppedTokens: dropped,
        clusters
    };
}
