// lib/api-clients.js - Enhanced API clients for comprehensive market analysis

import { logger } from './utils.js';

// ============================================================================
// DEXSCREENER - Multi-chain token scanning
// ============================================================================

/**
 * Fetch tokens across multiple chains
 * @param {number} limit - Number of tokens to fetch per chain
 * @returns {Array} Combined tokens from all chains
 */
export async function fetchMarketTokens(limit = 200) {
    const chains = ['ethereum', 'bsc', 'polygon'];
    const allTokens = [];

    for (const chain of chains) {
        try {
            const url = `https://api.dexscreener.com/latest/dex/search?q=${chain}`;
            const response = await fetch(url);

            if (!response.ok) continue;

            const data = await response.json();
            if (!data.pairs) continue;

            const tokens = data.pairs
                .filter(pair =>
                    pair.baseToken &&
                    pair.baseToken.address &&
                    pair.liquidity?.usd > 50000 && // Lower threshold for more tokens
                    pair.volume?.h24 > 10000
                )
                .slice(0, limit)
                .map(pair => transformToken(pair, chain));

            allTokens.push(...tokens);

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 200));

        } catch (error) {
            logger.error('chain_fetch_error', { chain, error: error.message });
        }
    }

    logger.info('market_scan_complete', { total: allTokens.length });
    return allTokens;
}

/**
 * Transform DexScreener data to our format
 */
function transformToken(pair, chain) {
    const now = Date.now();
    const createdAt = pair.pairCreatedAt || now;
    const ageInDays = (now - createdAt) / (1000 * 60 * 60 * 24);

    return {
        address: pair.baseToken.address,
        symbol: pair.baseToken.symbol || 'UNKNOWN',
        name: pair.baseToken.name || 'Unknown Token',
        chain: chain,

        // Price data
        priceUsd: parseFloat(pair.priceUsd) || 0,
        priceChange24h: pair.priceChange?.h24 || 0,
        priceChange7d: pair.priceChange?.h168 || 0,

        // Volume data
        volume24h: pair.volume?.h24 || 0,
        volume7d: pair.volume?.h168 || 0,

        // Liquidity
        liquidity: pair.liquidity?.usd || 0,

        // Market data
        marketCap: pair.fdv || 0,

        // Age
        ageInDays: Math.floor(ageInDays),
        isNewLaunch: ageInDays < 7,

        // DEX info
        dexId: pair.dexId,
        pairAddress: pair.pairAddress,
    };
}

// ============================================================================
// GOPLUS - Enhanced security analysis
// ============================================================================

export async function getDetailedSecurity(chain, address) {
    const url = `https://api.gopluslabs.io/api/v1/token_security/${chain}?contract_addresses=${address}`;

    try {
        const response = await fetch(url);
        if (!response.ok) return null;

        const data = await response.json();
        const tokenData = data.result?.[address.toLowerCase()];

        if (!tokenData) return null;

        // Calculate comprehensive security score
        let score = 10;
        const risks = [];

        if (tokenData.is_honeypot === '1') {
            score = 0;
            risks.push('HONEYPOT');
        }
        if (tokenData.is_open_source === '0') {
            score -= 2;
            risks.push('Not open source');
        }
        if (parseInt(tokenData.buy_tax) > 10) {
            score -= 2;
            risks.push(`High buy tax: ${tokenData.buy_tax}%`);
        }
        if (parseInt(tokenData.sell_tax) > 10) {
            score -= 2;
            risks.push(`High sell tax: ${tokenData.sell_tax}%`);
        }
        if (tokenData.is_proxy === '1') {
            score -= 1;
            risks.push('Proxy contract');
        }
        if (tokenData.can_take_back_ownership === '1') {
            score -= 2;
            risks.push('Can take back ownership');
        }
        if (tokenData.cannot_sell_all === '1') {
            score -= 3;
            risks.push('Cannot sell all');
        }

        return {
            score: Math.max(0, score),
            risks,
            isHoneypot: tokenData.is_honeypot === '1',
            isOpenSource: tokenData.is_open_source === '1',
            buyTax: parseInt(tokenData.buy_tax) || 0,
            sellTax: parseInt(tokenData.sell_tax) || 0,
            holderCount: parseInt(tokenData.holder_count) || 0,
        };

    } catch (error) {
        logger.error('security_analysis_error', { error: error.message });
        return null;
    }
}
