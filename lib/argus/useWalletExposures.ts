'use client';

import { useMemo } from 'react';
import { WalletExposure, MAX_WALLETS, MAX_TOKENS } from './correlationEngine';

export interface TokenWithHolders {
    mint: string;
    symbol: string;
    price: number;
    holders?: {
        address: string;
        amount: number;
        pct: number;
    }[];
}

/**
 * Aggregates wallet exposure data across multiple tokens
 * Finds wallets that appear in multiple token holder lists
 *
 * @param tokens - Array of tokens with their holder data
 * @returns WalletExposure array for the correlation matrix
 */
export function useWalletExposures(tokens: TokenWithHolders[]): WalletExposure[] {
    return useMemo(() => {
        if (!tokens || tokens.length === 0) return [];

        // Filter tokens that have holder data
        const tokensWithHolders = tokens
            .filter(t => t.holders && t.holders.length > 0)
            .slice(0, MAX_TOKENS);

        if (tokensWithHolders.length < 2) return [];

        // Build a map of wallet -> holdings across tokens
        const walletMap = new Map<string, WalletExposure>();

        for (const token of tokensWithHolders) {
            if (!token.holders) continue;

            for (const holder of token.holders) {
                const existing = walletMap.get(holder.address);

                const holding = {
                    token: token.mint,
                    symbol: token.symbol,
                    usdValue: holder.amount * token.price,
                    percent: holder.pct
                };

                if (existing) {
                    existing.holdings.push(holding);
                } else {
                    walletMap.set(holder.address, {
                        wallet: holder.address,
                        holdings: [holding]
                    });
                }
            }
        }

        // Filter to only wallets that appear in multiple tokens (the interesting ones)
        const multiTokenWallets = Array.from(walletMap.values())
            .filter(w => w.holdings.length > 1)
            .sort((a, b) => {
                // Sort by number of tokens held, then by total USD value
                if (b.holdings.length !== a.holdings.length) {
                    return b.holdings.length - a.holdings.length;
                }
                const totalA = a.holdings.reduce((sum, h) => sum + h.usdValue, 0);
                const totalB = b.holdings.reduce((sum, h) => sum + h.usdValue, 0);
                return totalB - totalA;
            })
            .slice(0, MAX_WALLETS);

        // If we don't have multi-token wallets, show top holders from each token
        if (multiTokenWallets.length < 2) {
            return getTopHoldersAcrossTokens(tokensWithHolders);
        }

        return multiTokenWallets;
    }, [tokens]);
}

/**
 * Fallback: Get top holders from each token when no overlap exists
 * This still shows the matrix but with single-token exposures
 */
function getTopHoldersAcrossTokens(tokens: TokenWithHolders[]): WalletExposure[] {
    const seen = new Set<string>();
    const result: WalletExposure[] = [];

    for (const token of tokens) {
        if (!token.holders) continue;

        // Take top 2 from each token
        for (const holder of token.holders.slice(0, 2)) {
            if (seen.has(holder.address)) continue;
            seen.add(holder.address);

            result.push({
                wallet: holder.address,
                holdings: [{
                    token: token.mint,
                    symbol: token.symbol,
                    usdValue: holder.amount * token.price,
                    percent: holder.pct
                }]
            });

            if (result.length >= MAX_WALLETS) break;
        }

        if (result.length >= MAX_WALLETS) break;
    }

    return result;
}

/**
 * Utility to check if there's meaningful correlation data
 */
export function hasCorrelationData(exposures: WalletExposure[]): boolean {
    if (exposures.length < 2) return false;
    return exposures.some(w => w.holdings.length > 1);
}
