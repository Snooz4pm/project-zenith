import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/arena/evm/price
 *
 * Get normalized token price from 0x
 * Uses $1 worth of sellToken as baseline
 *
 * Body:
 *   - sellToken: Token to sell (e.g., "ETH", "0xA0b...")
 *   - buyToken: Token to buy (contract address)
 *
 * Returns:
 *   - price: Normalized price (already decimal-adjusted by 0x)
 */
export async function POST(req: Request) {
  try {
    const { sellToken, buyToken } = await req.json();

    if (!sellToken || !buyToken) {
      return NextResponse.json({ price: null });
    }

    // $1 worth of ETH as baseline (1e18 wei = 1 ETH)
    const sellAmount = "1000000000000000000"; // 1 ETH

    const url = new URL("https://api.0x.org/swap/v1/price");
    url.searchParams.set("sellToken", sellToken);
    url.searchParams.set("buyToken", buyToken);
    url.searchParams.set("sellAmount", sellAmount);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (process.env.ZEROX_API_KEY) {
      headers["0x-api-key"] = process.env.ZEROX_API_KEY;
    }

    const res = await fetch(url.toString(), {
      headers,
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      console.error("[EVM Price] 0x API error:", res.status);
      return NextResponse.json({ price: null });
    }

    const data = await res.json();

    return NextResponse.json({
      price: Number(data.price) || null, // already normalized by 0x
    });
  } catch (err) {
    console.error("[EVM Price] Fatal error:", err);
    return NextResponse.json({ price: null });
  }
}
