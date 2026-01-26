import { NextResponse } from "next/server";
import { getTokenUniverse } from "@/lib/tokenUniverse";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.toLowerCase();

  if (!q || q.length < 2) {
    return NextResponse.json({
      tokens: [],
      count: 0,
      reason: "query-too-short",
    });
  }

  const universe = await getTokenUniverse();

  const results = universe
    .filter(t =>
      t.symbol?.toLowerCase().includes(q) ||
      t.name?.toLowerCase().includes(q) ||
      t.address?.toLowerCase().includes(q)
    )
    .slice(0, 100);

  return NextResponse.json({
    tokens: results,
    count: results.length,
  });
}
