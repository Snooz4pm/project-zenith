import { NextResponse } from "next/server"

export const runtime = "nodejs"          // Force Node runtime
export const dynamic = "force-dynamic"   // Force dynamic rendering

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const limit = Number(url.searchParams.get("limit") ?? 50)

    console.log("[api/tokens] fetching Raydium pools")

    const res = await fetch(
      "https://api.raydium.io/v2/sdk/liquidity/mainnet.json",
      {
        cache: "no-store",
        headers: {
          "accept": "application/json",
        },
      }
    )

    if (!res.ok) {
      console.error("[api/tokens] Raydium HTTP error", res.status)
      return NextResponse.json([], { status: 200 })
    }

    const json = await res.json()

    if (!json || !json.official) {
      console.error("[api/tokens] invalid Raydium payload")
      return NextResponse.json([], { status: 200 })
    }

    const tokens = Object.values(json.official)
      .map((pool: any) => ({
        chainType: "SOLANA",
        chainId: "SOLANA",
        address: pool.baseMint,
        symbol: pool.baseSymbol ?? "UNKNOWN",
        name: pool.baseName ?? pool.baseSymbol ?? "Unknown",
        priceUsd: pool.price ?? null,
        liquidityUsd: pool.liquidity ?? 0,
        volume24h: pool.volume24h ?? 0,
        dex: "Raydium",
      }))
      .slice(0, limit)

    return NextResponse.json(tokens, { status: 200 })
  } catch (err) {
    console.error("[api/tokens] FATAL ERROR", err)
    return NextResponse.json([], { status: 200 })
  }
}
