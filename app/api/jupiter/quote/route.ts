import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { inputMint, outputMint, amount } = body;

        if (!inputMint || !outputMint || !amount) {
            return NextResponse.json(
                { error: "Missing params" },
                { status: 400 }
            );
        }

        const url = new URL("https://quote-api.jup.ag/v6/quote");
        url.searchParams.set("inputMint", inputMint);
        url.searchParams.set("outputMint", outputMint);
        url.searchParams.set("amount", String(amount));
        url.searchParams.set("slippageBps", "50");

        const res = await fetch(url.toString(), {
            headers: { Accept: "application/json" },
            cache: "no-store",
        });

        const text = await res.text();

        if (!res.ok) {
            console.error("Jupiter error:", res.status, text);
            return NextResponse.json(
                { error: "Jupiter failed", details: text },
                { status: 502 }
            );
        }

        const json = JSON.parse(text);
        return NextResponse.json(json);

    } catch (err: any) {
        console.error("Quote route crashed:", err);
        return NextResponse.json(
            { error: "Internal error", message: err.message },
            { status: 500 }
        );
    }
}
