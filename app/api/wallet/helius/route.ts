import { NextResponse } from "next/server";

const HELIUS_URL = `https://rpc.helius.xyz/?api-key=${process.env.HELIUS_API_KEY}`;

export async function POST(req: Request) {
    try {
        const { wallet } = await req.json();

        if (!wallet) {
            return NextResponse.json({ error: "Missing wallet" }, { status: 400 });
        }

        const body = {
            jsonrpc: "2.0",
            id: "wallet-assets",
            method: "getAssetsByOwner",
            params: {
                ownerAddress: wallet,
                page: 1,
                limit: 1000,
                displayOptions: {
                    showFungible: true,
                    showNativeBalance: true
                }
            }
        };

        const res = await fetch(HELIUS_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            throw new Error("Helius request failed");
        }

        const json = await res.json();

        const normalized = normalizeHelius(json.result);

        return NextResponse.json(normalized);
    } catch (err) {
        console.error("Helius error:", err);
        return NextResponse.json({ error: "Failed to fetch wallet" }, { status: 500 });
    }
}

function normalizeHelius(result: any) {
    const tokens = [];

    for (const item of result.items || []) {
        if (item.interface !== "FungibleToken") continue;

        const info = item.token_info;
        if (!info || info.balance <= 0) continue;

        tokens.push({
            mint: item.id,
            symbol: info.symbol || "UNKNOWN",
            name: item.content?.metadata?.name || item.id,
            logo: item.content?.files?.[0]?.uri || null,
            decimals: info.decimals,
            amount: Number(info.balance) / 10 ** info.decimals
        });
    }

    return {
        sol: (result.nativeBalance?.lamports || 0) / 1e9,
        tokens
    };
}
