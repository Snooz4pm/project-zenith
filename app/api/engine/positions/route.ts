import { NextResponse } from "next/server";
import { upsertPosition } from "@/lib/engine/positionStore";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        upsertPosition({
            id: crypto.randomUUID(),
            phase: "SEE",
            createdAt: Date.now(),
            ...body
        });

        return NextResponse.json({ ok: true });
    } catch (error: any) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
}
