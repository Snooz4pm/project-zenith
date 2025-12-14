// lib/api-clients.js - API clients for token data (server-side only)

import { logger } from './utils.js';

// Dexscreener API client
export async function fetchTrendingTokens() {
    const url = 'https://api.dexscreener.com/latest/dex/search?q=uniswap%20eth';

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Dexscreener API error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.pairs || data.pairs.length === 0) {
            logger.warn('dexscreener_no_pairs');
            return [];
        }

        // Filter and transform
        const MIN_LIQUIDITY = 150000;
        const MIN_VOLUME = 250000;

        const tokens = data.pairs
            .filter(pair =>
                pair.baseToken &&
                pair.baseToken.address &&
                pair.liquidity?.usd > MIN_LIQUIDITY &&
                pair.volume?.h24 > MIN_VOLUME
            )
            .slice(0, 20) // Top 20 only
            .map(pair => ({
                address: pair.baseToken.address,
                symbol: pair.baseToken.symbol || 'UNKNOWN',
                name: pair.baseToken.name || 'Unknown Token',
                chain: pair.chainId || 'ethereum',
                liquidity: pair.liquidity.usd,
                volume24h: pair.volume.h24,
                priceUsd: pair.priceUsd,
                priceChange24h: pair.priceChange?.h24 || 0,
            }));

        logger.info('dexscreener_success', { count: tokens.length });
        return tokens;

    } catch (error) {
        logger.error('dexscreener_error', { error: error.message });
        return [];
    }
}

// GoPlus Security API client
export async function getSecurityScore(chain, address) {
    const url = `https://api.gopluslabs.io/api/v1/token_security/${chain}?contract_addresses=${address}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`GoPlus API error: ${response.status}`);
        }

        const data = await response.json();
        const tokenData = data.result?.[address.toLowerCase()];

        if (!tokenData) {
            return 5; // Default medium score
        }

        // Calculate security score (0-10)
        let score = 10;

        if (tokenData.is_honeypot === '1') score -= 10;
        if (tokenData.is_open_source === '0') score -= 2;
        if (parseInt(tokenData.buy_tax) > 10) score -= 2;
        if (parseInt(tokenData.sell_tax) > 10) score -= 2;
        if (tokenData.is_proxy === '1') score -= 1;
        if (tokenData.can_take_back_ownership === '1') score -= 2;

        return Math.max(0, score);

    } catch (error) {
        logger.error('goplus_error', { error: error.message });
        return 5; // Default on error
    }
}
