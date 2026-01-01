// Crypto Finds shared types

export interface CryptoFindsPair {
    pairAddress: string;
    chainId: string;
    dexId: string;
    baseSymbol: string;
    baseName: string;
    quoteSymbol: string;
    priceUsd: number;
    priceChange24h: number;
    priceChange1h: number;
    volume24h: number;
    volume1h: number;
    liquidity: number;
    txns24h: number;
    buys24h: number;
    sells24h: number;
    fdv: number;
    pairCreatedAt: number;
    url: string;
}

export interface PairDetails {
    pairAddress: string;
    chainId: string;
    dexId: string;
    baseToken: { address: string; name: string; symbol: string };
    quoteToken: { address: string; symbol: string };
    priceUsd: number;
    priceNative: number;
    priceChange: { m5?: number; h1?: number; h6?: number; h24?: number };
    volume: { m5?: number; h1?: number; h6?: number; h24?: number };
    txns: {
        m5?: { buys: number; sells: number };
        h1?: { buys: number; sells: number };
        h6?: { buys: number; sells: number };
        h24?: { buys: number; sells: number };
    };
    liquidity: { usd?: number; base?: number; quote?: number };
    fdv: number;
    pairCreatedAt: number;
    url: string;
}
