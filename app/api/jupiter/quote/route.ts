import { NextResponse } from "next/server";

const JUPITER_PROXY_URL = process.env.NEXT_PUBLIC_JUPITER_PROXY_URL || 'https://jupiter-proxy-production.up.railway.app';

export async function POST(req: Request) {
    try {
        const { inputMint, outputMint, amount } = await req.json();

        // Proxy to Railway backend
        const res = await fetch(`${JUPITER_PROXY_URL}/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}`, {
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
