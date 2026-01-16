import { NextResponse } from "next/server";

const JUPITER_PROXY_URL = process.env.NEXT_PUBLIC_JUPITER_PROXY_URL || 'https://jupiter-proxy-production.up.railway.app';

export async function POST(req: Request) {
    try {
        const { inputMint, outputMint, amount } = await req.json();

        // URL for Jupiter V6 Quote API
        const JUPITER_QUOTE_URL = "https://quote-api.jup.ag/v6/quote";
        const params = new URLSearchParams({
            inputMint,
            outputMint,
            amount: String(amount),
            slippageBps: "50",
            onlyDirectRoutes: "false",
        });

        const res = await fetch(`${JUPITER_QUOTE_URL}?${params.toString()}`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
        });

        if (!res.ok) {
            const errorText = await res.text();
            return NextResponse.json({ error: errorText }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
