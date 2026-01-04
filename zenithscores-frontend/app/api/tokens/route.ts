import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/tokens
 *
 * BULLETPROOF TOKEN DISCOVERY
 * ═══════════════════════════
 * - Never throws
 * - Always returns JSON
 * - Empty array on failure
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit") ?? 50);

    console.log("[api/tokens] Fetching from Raydium...");

    // 1️⃣ Try Raydium first (most reliable for Solana)
    const raydiumRes = await fetch(
      "https://api.raydium.io/v2/sdk/liquidity/mainnet.json",
      { cache: "no-store" }
    );

    if (!raydiumRes.ok) {
      throw new Error(`Raydium API failed with status ${raydiumRes.status}`);
    }

    const raydiumData = await raydiumRes.json();

    const tokens = parseRaydiumPools(raydiumData).slice(0, limit);

    console.log(`[api/tokens] Returning ${tokens.length} tokens`);

    return NextResponse.json(tokens);
  } catch (err) {
    console.error("[api/tokens] fatal:", err);

    // ❗ NEVER CRASH — return empty array with 200
    return NextResponse.json([], { status: 200 });
  }
}

/**
 * Parse Raydium pools into GlobalToken format
 * Defensive: handles missing fields gracefully
 */
function parseRaydiumPools(data: any) {
  if (!data?.official) {
    console.warn("[api/tokens] No official pools in Raydium data");
    return [];
  }

  const pools = Object.values(data.official);

  return pools.map((pool: any) => ({
    id: `solana-${pool.baseMint}`,
    chainType: "SOLANA",
    chainId: "solana",
    networkName: "Solana",
    address: pool.baseMint ?? "",
    symbol: pool.baseSymbol ?? "???",
    name: pool.baseName ?? pool.baseSymbol ?? "Unknown",
    logo: null,
    decimals: pool.baseDecimals ?? 9,
    priceUsd: pool.price ?? 0,
    priceChange24h: 0,
    liquidityUsd: pool.liquidity ?? 0,
    volume24h: pool.volume24h ?? 0,
    dex: "Raydium",
  }));
}
