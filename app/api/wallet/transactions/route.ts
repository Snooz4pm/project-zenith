import { NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { serverConnection } from '@/lib/server/solana';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const address = searchParams.get('address');
        const limitParam = searchParams.get('limit');
        const limit = limitParam ? parseInt(limitParam, 10) : 20;

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

        const signatures = await serverConnection.getSignaturesForAddress(pubkey, { limit });

        const transactions = signatures.map(sig => ({
            signature: sig.signature,
            timestamp: (sig.blockTime || 0) * 1000,
            status: sig.err ? 'failed' : 'success',
            fee: 0.000005,
        }));

        return NextResponse.json({
            address,
            transactions,
        });
    } catch (error) {
        console.error('[API /wallet/transactions] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch transactions' },
            { status: 500 }
        );
    }
}
