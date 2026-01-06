import { NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { serverConnection } from '@/lib/server/solana';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const address = searchParams.get('address');

        if (!address) {
            return NextResponse.json({ error: 'Missing address' }, { status: 400 });
        }

        // Validate address format
        let pubkey: PublicKey;
        try {
            pubkey = new PublicKey(address);
        } catch {
            return NextResponse.json({ error: 'Invalid address' }, { status: 400 });
        }

        const lamports = await serverConnection.getBalance(pubkey);

        return NextResponse.json({
            address,
            lamports,
            sol: lamports / 1e9,
        });
    } catch (error) {
        console.error('[API /wallet/balance] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch balance' },
            { status: 500 }
        );
    }
}
