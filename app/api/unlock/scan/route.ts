import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Self-contained connection logic
const API_KEY = process.env.HELIUS_API_KEY || process.env.NEXT_PUBLIC_HELIUS_API_KEY;
const RPC_URL = API_KEY
    ? `https://mainnet.helius-rpc.com/?api-key=${API_KEY}`
    : 'https://api.mainnet-beta.solana.com';

const connection = new Connection(RPC_URL, 'confirmed');

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const address = searchParams.get('address');
        if (!address) return NextResponse.json({ error: 'Missing address' }, { status: 400 });

        const owner = new PublicKey(address);

        // 1. Fetch token accounts
        const accounts = await connection.getParsedTokenAccountsByOwner(owner, {
            programId: TOKEN_PROGRAM_ID,
        });

        let reclaimable = [];
        let dust = [];

        for (const acc of accounts.value) {
            const info = acc.account.data.parsed.info;
            const amount = info.tokenAmount.uiAmount;
            const lamports = acc.account.lamports;

            // Empty token account → reclaim rent
            if (amount === 0 && lamports > 0) {
                reclaimable.push({
                    pubkey: acc.pubkey.toBase58(),
                    mint: info.mint,
                    rentSol: lamports / 1e9,
                });
            }

            // Dust (optional threshold - keeping strictly < 0.0001 for now)
            if (amount > 0 && amount < 0.0001) {
                dust.push({
                    pubkey: acc.pubkey.toBase58(),
                    mint: info.mint,
                    amount,
                });
            }
        }

        return NextResponse.json({
            reclaimable,
            dust,
            totalSol: reclaimable.reduce((s, r) => s + r.rentSol, 0),
        });
    } catch (err: any) {
        console.error('[Unlock Scan] Error:', err);
        return NextResponse.json({ error: 'Failed to scan wallet' }, { status: 500 });
    }
}
