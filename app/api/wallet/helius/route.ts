import { NextResponse } from "next/server";

const HELIUS_RPC = `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`;

let lastCall = 0;

export async function POST(req: Request) {
    try {
        // 🚦 Server Rate Guard (Soft Protection)
        const now = Date.now();
        if (now - lastCall < 500) { // Reduced from 5000ms to 500ms
            return NextResponse.json(
                { error: "Rate limited" },
                { status: 429 }
            );
        }
        lastCall = now;

        const { wallet } = await req.json();

        if (!wallet) {
            return NextResponse.json({ error: "Missing wallet" }, { status: 400 });
        }

        const payload = {
            jsonrpc: "2.0",
            id: "das",
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

        const res = await fetch(HELIUS_RPC, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const json = await res.json();

        if (!json?.result?.items) {
            console.error("Helius bad response:", json);
            return NextResponse.json({ error: "Invalid Helius response" }, { status: 500 });
        }

        // Return the items and native balance for client normalization
        return NextResponse.json({
            items: json.result.items,
            nativeBalance: json.result.nativeBalance
        });

    } catch (err: any) {
        console.error("Helius route crash:", err);
        return NextResponse.json({ error: "Helius crash" }, { status: 500 });
    }
}
