import { NextResponse } from "next/server";
import { upsertPosition, getPositions } from "@/lib/engine/positionStore";

export async function GET() {
    return NextResponse.json(getPositions());
}

export async function POST(req: Request) {
    try {
        const { type, ...data } = await req.json();

        // Map action types to phases
        const phaseMap: Record<string, string> = {
            "SEED": "SEE",
            "SCALE": "SCA",
            "HARVEST": "HAR",
            "RECYCLE": "REC"
        };

        upsertPosition({
            id: data.targetMint,
            phase: phaseMap[type] || "SEE",
            createdAt: Date.now(),
            ...data
        } as any);

        return NextResponse.json({ ok: true });
    } catch (error: any) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
}
