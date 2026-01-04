import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Fallback tokens if APIs are down
const SOLANA_FALLBACK = [
    { id: "sol-1", chainType: "SOLANA", chainId: "solana", networkName: "Solana", address: "So11111111111111111111111111111111111111112", symbol: "SOL", name: "Solana", priceUsd: 100, priceChange24h: 0, liquidityUsd: 1000000, volume24h: 500000, dex: "System", logo: null, decimals: 9 },
    { id: "sol-2", chainType: "SOLANA", chainId: "solana", networkName: "Solana", address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", symbol: "USDC", name: "USD Coin", priceUsd: 1, priceChange24h: 0, liquidityUsd: 5000000, volume24h: 2000000, dex: "Raydium", logo: null, decimals: 6 },
];

const EVM_FALLBACK = [
    { id: "eth-1", chainType: "EVM", chainId: "1", networkName: "Ethereum", address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", symbol: "WETH", name: "Wrapped Ether", priceUsd: 2500, priceChange24h: 0, liquidityUsd: 10000000, volume24h: 5000000, dex: "Uniswap", logo: null, decimals: 18 },
    { id: "eth-2", chainType: "EVM", chainId: "1", networkName: "Ethereum", address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", symbol: "USDC", name: "USD Coin", priceUsd: 1, priceChange24h: 0, liquidityUsd: 8000000, volume24h: 3000000, dex: "Uniswap", logo: null, decimals: 6 },
];

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const vm = url.searchParams.get("vm")?.toUpperCase();
        const limit = Number(url.searchParams.get("limit") ?? 50);

        console.log(`[api/arena/tokens] VM=${vm}, limit=${limit}`);

        // VM-FIRST: Return tokens based on active VM
        if (vm === "SOLANA") {
            return await fetchSolanaTokens(limit);
        } else if (vm === "EVM") {
            return await fetchEvmTokens(limit);
        } else {
            // No VM specified - return empty (Arena should show "Select wallet")
            return NextResponse.json([], { status: 200 });
        }
    } catch (err) {
        console.error("[api/arena/tokens] FATAL:", err);
        return NextResponse.json([], { status: 200 });
    }
}

async function fetchSolanaTokens(limit: number) {
    try {
        const res = await fetch(
            "https://api.raydium.io/v2/sdk/liquidity/mainnet.json",
            { cache: "no-store" }
        );

        if (!res.ok) {
            console.error("[Solana] Raydium HTTP error:", res.status);
            return NextResponse.json(SOLANA_FALLBACK, { status: 200 });
        }

        const json = await res.json();

        if (!json?.official) {
            console.error("[Solana] Invalid Raydium payload");
            return NextResponse.json(SOLANA_FALLBACK, { status: 200 });
        }

        const tokens = Object.values(json.official)
            .map((p: any) => ({
                id: `solana-${p.baseMint}`,
                chainType: "SOLANA",
                chainId: "solana",
                networkName: "Solana",
                address: p.baseMint,
                symbol: p.baseSymbol ?? "UNKNOWN",
                name: p.baseName ?? p.baseSymbol ?? "Unknown",
                priceUsd: p.price ?? 0,
                priceChange24h: 0,
                liquidityUsd: p.liquidity ?? 0,
                volume24h: p.volume24h ?? 0,
                dex: "Raydium",
                logo: null,
                decimals: p.baseDecimals ?? 9,
            }))
            .filter((t: any) => t.liquidityUsd > 10000) // Filter low liq
            .slice(0, limit);

        return NextResponse.json(tokens, { status: 200 });
    } catch (err) {
        console.error("[Solana] Fetch error:", err);
        return NextResponse.json(SOLANA_FALLBACK, { status: 200 });
    }
}

async function fetchEvmTokens(limit: number) {
    try {
        // Use DexScreener for EVM discovery
        const res = await fetch(
            "https://api.dexscreener.com/latest/dex/tokens/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
            { cache: "no-store" }
        );

        if (!res.ok) {
            console.error("[EVM] DexScreener HTTP error:", res.status);
            return NextResponse.json(EVM_FALLBACK, { status: 200 });
        }

        const json = await res.json();

        if (!json?.pairs) {
            console.error("[EVM] Invalid DexScreener payload");
            return NextResponse.json(EVM_FALLBACK, { status: 200 });
        }

        // Filter to supported chains
        const supportedChains = ["ethereum", "base", "bsc", "arbitrum"];

        const tokens = json.pairs
            .filter((p: any) => supportedChains.includes(p.chainId))
            .map((p: any) => ({
                id: `${p.chainId}-${p.baseToken.address}`,
                chainType: "EVM",
                chainId: p.chainId === "ethereum" ? "1" : p.chainId === "base" ? "8453" : p.chainId === "bsc" ? "56" : "42161",
                networkName: p.chainId.charAt(0).toUpperCase() + p.chainId.slice(1),
                address: p.baseToken.address,
                symbol: p.baseToken.symbol,
                name: p.baseToken.name,
                priceUsd: parseFloat(p.priceUsd) || 0,
                priceChange24h: p.priceChange?.h24 || 0,
                liquidityUsd: p.liquidity?.usd || 0,
                volume24h: p.volume?.h24 || 0,
                dex: p.dexId,
                logo: p.info?.imageUrl || null,
                decimals: 18,
            }))
            .slice(0, limit);

        return NextResponse.json(tokens, { status: 200 });
    } catch (err) {
        console.error("[EVM] Fetch error:", err);
        return NextResponse.json(EVM_FALLBACK, { status: 200 });
    }
}
