import { NextResponse } from "next/server";

const JUPITER_PROXY_URL = process.env.NEXT_PUBLIC_JUPITER_PROXY_URL || 'https://jupiter-proxy-production.up.railway.app';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { inputMint, outputMint, amount } = body;

        if (!inputMint || !outputMint || !amount) {
            return NextResponse.json({ error: "Missing params" }, { status: 400 });
        }

        // Proxy to Railway backend
        const url = `${JUPITER_PROXY_URL}/jupiter/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}`;

        const res = await fetch(url, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            cache: 'no-store'
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error(`[Railway Proxy] Error ${res.status}:`, errorText);
            return NextResponse.json({ error: "Proxy failed", details: errorText }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("[Quote Route] Crash:", error);
        return NextResponse.json({ error: "Internal crash", message: error.message }, { status: 500 });
    }
}
