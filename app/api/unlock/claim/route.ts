import {
    Connection,
    PublicKey,
    Transaction,
} from '@solana/web3.js';
import { createCloseAccountInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Self-contained connection logic
const API_KEY = process.env.HELIUS_API_KEY || process.env.NEXT_PUBLIC_HELIUS_API_KEY;
const RPC_URL = API_KEY
    ? `https://mainnet.helius-rpc.com/?api-key=${API_KEY}`
    : 'https://api.mainnet-beta.solana.com';

const connection = new Connection(RPC_URL, 'confirmed');

export async function POST(req: Request) {
    try {
        const { address, accounts } = await req.json();

        if (!address || !accounts?.length) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }

        const owner = new PublicKey(address);
        const tx = new Transaction();

        // Batch limit safety (stay under transaction size limits)
        // 20 accounts is a safe conservative limit for a single TX
        const batch = accounts.slice(0, 20);

        for (const acc of batch) {
            tx.add(
                createCloseAccountInstruction(
                    new PublicKey(acc), // account to close
                    owner,              // destination for rent SOL
                    owner,              // authority
                    [],
                    TOKEN_PROGRAM_ID
                )
            );
        }

        tx.feePayer = owner;
        const { blockhash } = await connection.getLatestBlockhash();
        tx.recentBlockhash = blockhash;

        // Serialize partially (unsigned)
        const serialized = tx.serialize({ requireAllSignatures: false }).toString('base64');

        return NextResponse.json({
            transaction: serialized,
            count: batch.length
        });
    } catch (err: any) {
        console.error('[Unlock Claim] Error:', err);
        return NextResponse.json({ error: 'Failed to build transaction' }, { status: 500 });
    }
}
