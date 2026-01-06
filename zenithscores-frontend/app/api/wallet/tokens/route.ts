import { NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { serverConnection } from '@/lib/server/solana';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const address = searchParams.get('address');

        if (!address) {
            return NextResponse.json({ tokens: [] });
        }

        // Validate address format
        let pubkey: PublicKey;
        try {
            pubkey = new PublicKey(address);
        } catch {
            return NextResponse.json({ error: 'Invalid address' }, { status: 400 });
        }

        const accounts = await serverConnection.getParsedTokenAccountsByOwner(
            pubkey,
            { programId: TOKEN_PROGRAM_ID }
        );

        const tokens = accounts.value.map((account) => {
            const parsed = account.account.data.parsed.info;
            return {
                mint: parsed.mint,
                amount: parsed.tokenAmount.uiAmount,
                decimals: parsed.tokenAmount.decimals,
                rawAmount: parsed.tokenAmount.amount,
            };
        });

        // Filter out zero balance tokens
        const nonZeroTokens = tokens.filter((t) => t.amount && t.amount > 0);

        return NextResponse.json({
            address,
            tokens: nonZeroTokens,
        });
    } catch (error) {
        console.error('[API /wallet/tokens] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch tokens' },
            { status: 500 }
        );
    }
}
