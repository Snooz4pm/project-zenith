export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';

// Self-contained connection logic to avoid import issues
const API_KEY = process.env.HELIUS_API_KEY || process.env.NEXT_PUBLIC_HELIUS_API_KEY;
const RPC_URL = API_KEY
    ? `https://mainnet.helius-rpc.com/?api-key=${API_KEY}`
    : 'https://api.mainnet-beta.solana.com';

const connection = new Connection(RPC_URL, 'confirmed');

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const address = searchParams.get('address');

        if (!address) {
            return NextResponse.json({ error: 'Missing address' }, { status: 400 });
        }

        let pubkey: PublicKey;
        try {
            pubkey = new PublicKey(address);
        } catch {
            return NextResponse.json({ error: 'Invalid address format' }, { status: 400 });
        }

        console.log('[API Balance] Fetching for:', address);
        const lamports = await connection.getBalance(pubkey);

        return NextResponse.json({
            lamports,
            sol: lamports / 1e9,
        });
    } catch (err: any) {
        console.error('[BALANCE API ERROR]', err.message);
        return NextResponse.json({ error: 'Failed to fetch balance', details: err.message }, { status: 500 });
    }
}
