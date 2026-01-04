import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Fallback tokens if Raydium API is down
const FALLBACK_TOKENS = [
  { id: "sol-1", chainType: "SOLANA", chainId: "SOLANA", address: "So11111111111111111111111111111111111111112", symbol: "SOL", name: "Solana", priceUsd: 100, liquidityUsd: 1000000, volume24h: 500000, dex: "System", networkName: "Solana" },
  { id: "sol-2", chainType: "SOLANA", chainId: "SOLANA", address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", symbol: "USDC", name: "USD Coin", priceUsd: 1, liquidityUsd: 5000000, volume24h: 2000000, dex: "Raydium", networkName: "Solana" },
  { id: "sol-3", chainType: "SOLANA", chainId: "SOLANA", address: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", symbol: "USDT", name: "Tether USD", priceUsd: 1, liquidityUsd: 4000000, volume24h: 1500000, dex: "Raydium", networkName: "Solana" },
]

export async function GET(req: Request) {
  try {
    const res = await fetch(
      "https://api.raydium.io/v2/sdk/liquidity/mainnet.json",
      { cache: "no-store" }
    )

    if (!res.ok) {
      console.error("[api/tokens] Raydium HTTP error", res.status)
      return NextResponse.json(FALLBACK_TOKENS, { status: 200 })
    }

    const json = await res.json()

    if (!json?.official) {
      console.error("[api/tokens] invalid Raydium payload")
      return NextResponse.json(FALLBACK_TOKENS, { status: 200 })
    }

    const tokens = Object.values(json.official)
      .map((p: any) => ({
        id: `solana-${p.baseMint}`,
        chainType: "SOLANA",
        chainId: "SOLANA",
        networkName: "Solana",
        address: p.baseMint,
        symbol: p.baseSymbol ?? "UNKNOWN",
        name: p.baseName ?? p.baseSymbol,
        liquidityUsd: p.liquidity ?? 0,
        volume24h: p.volume24h ?? 0,
        priceUsd: p.price ?? null,
        priceChange24h: 0,
        dex: "Raydium",
      }))
      .slice(0, 100)

    return NextResponse.json(tokens, { status: 200 })
  } catch (err) {
    console.error("[api/tokens] FATAL ERROR", err)
    return NextResponse.json(FALLBACK_TOKENS, { status: 200 })
  }
}
