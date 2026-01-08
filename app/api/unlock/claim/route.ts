import {
    Connection,
    PublicKey,
    TransactionMessage,
    VersionedTransaction,
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
        const MAX_ACCOUNTS_PER_TX = 20;

        // Chunk accounts
        const chunks: string[][] = [];
        for (let i = 0; i < accounts.length; i += MAX_ACCOUNTS_PER_TX) {
            chunks.push(accounts.slice(i, i + MAX_ACCOUNTS_PER_TX));
        }

        const { blockhash } = await connection.getLatestBlockhash();
        const batches: string[] = [];

        for (const chunk of chunks) {
            const instructions = chunk.map(acc =>
                createCloseAccountInstruction(
                    new PublicKey(acc),
                    owner,
                    owner,
                    [],
                    TOKEN_PROGRAM_ID
                )
            );

            const messageV0 = new TransactionMessage({
                payerKey: owner,
                recentBlockhash: blockhash,
                instructions,
            }).compileToV0Message();

            const tx = new VersionedTransaction(messageV0);
            batches.push(Buffer.from(tx.serialize()).toString('base64'));
        }

        return NextResponse.json({
            batches,
            totalProcessed: accounts.length
        });
    } catch (err: any) {
        console.error('[Unlock Claim] Error:', err);
        return NextResponse.json({ error: 'Failed to build transactions' }, { status: 500 });
    }
}
