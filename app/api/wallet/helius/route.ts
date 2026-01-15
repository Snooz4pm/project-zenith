import { NextResponse } from "next/server";

const HELIUS_ENDPOINT = `https://rpc.helius.xyz/?api-key=${process.env.HELIUS_API_KEY}`;

let lastCall = 0;

export async function POST(req: Request) {
    try {
        // 🚦 Server Rate Guard (Hard Protection)
        const now = Date.now();
        if (now - lastCall < 5000) {
            return NextResponse.json(
                { error: "Rate limited" },
                { status: 429 }
            );
        }
        lastCall = now;

        const { wallet } = await req.json();

        if (!wallet) {
            return NextResponse.json(
                { error: "Missing wallet" },
                { status: 400 }
            );
        }

        const payload = {
            jsonrpc: "2.0",
            id: "helius",
            method: "getAssetsByOwner",
            params: {
                ownerAddress: wallet,
                page: 1,
                limit: 100,
            },
        };

        const heliusRes = await fetch(HELIUS_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const text = await heliusRes.text();

        if (!heliusRes.ok) {
            console.error("Helius error:", text);
            return NextResponse.json(
                { error: "Helius upstream error", raw: text },
                { status: 502 }
            );
        }

        const json = JSON.parse(text);
        return NextResponse.json(json);

    } catch (err: any) {
        console.error("Helius route crash:", err);
        return NextResponse.json(
            { error: err.message || "Internal error" },
            { status: 500 }
        );
    }
}
