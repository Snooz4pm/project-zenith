import { Connection, PublicKey } from "@solana/web3.js";
import { NextResponse } from "next/server";

const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC || `https://mainnet.helius-rpc.com/?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY}`;
const connection = new Connection(RPC_URL, "confirmed");

const TOKEN_PROGRAM_ID = new PublicKey(
    "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const wallet = searchParams.get("wallet");

        if (!wallet) {
            return NextResponse.json({ error: "Missing wallet" }, { status: 400 });
        }

        const pubkey = new PublicKey(wallet);

        // SOL Balance
        const lamports = await connection.getBalance(pubkey);

        // Token Accounts
        const accounts = await connection.getParsedTokenAccountsByOwner(pubkey, {
            programId: TOKEN_PROGRAM_ID,
        });

        const tokens = accounts.value.map(acc => {
            const info = acc.account.data.parsed.info;
            return {
                mint: info.mint as string,
                amount: Number(info.tokenAmount.uiAmount),
                decimals: info.tokenAmount.decimals as number,
            };
        });

        return NextResponse.json({
            sol: lamports / 1e9,
            tokens,
        });
    } catch (err) {
        console.error("Wallet API error:", err);
        return NextResponse.json({ error: "Failed to fetch wallet" }, { status: 500 });
    }
}
