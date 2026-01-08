import { NextResponse } from 'next/server';
import { PublicKey, SystemProgram, TransactionMessage, VersionedTransaction, Connection } from '@solana/web3.js';

export const dynamic = 'force-dynamic';

// 💰 Platform fee configuration (2% for dust swaps)
const DEV_WALLET = new PublicKey('GRd3X2emDp2nmSXt1GrM9KA8EDeqW4ifgP3muwoTmzqb');
const DUST_SWAP_FEE_PERCENT = 2;

// SOL mint address for Jupiter swaps
const SOL_MINT = 'So11111111111111111111111111111111111111112';

// RPC connection
const API_KEY = process.env.HELIUS_API_KEY || process.env.NEXT_PUBLIC_HELIUS_API_KEY;
const RPC_URL = API_KEY
    ? `https://mainnet.helius-rpc.com/?api-key=${API_KEY}`
    : 'https://api.mainnet-beta.solana.com';
const connection = new Connection(RPC_URL, 'confirmed');

export async function POST(req: Request) {
    try {
        const { address, tokens } = await req.json();

        if (!address || !tokens?.length) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }

        const owner = new PublicKey(address);
        console.log(`[Dust Swap] Processing ${tokens.length} dust tokens for ${address}`);

        // Calculate total input amount in lamports for all tokens
        let totalEstimatedOutputSol = 0;

        // Get quotes for all tokens to calculate total output
        for (const token of tokens) {
            try {
                const amount = Math.floor(token.amount * Math.pow(10, token.decimals || 9));
                const quoteUrl = `https://quote-api.jup.ag/v6/quote?inputMint=${token.mint}&outputMint=${SOL_MINT}&amount=${amount}&slippageBps=100`;

                const quoteResponse = await fetch(quoteUrl);
                if (quoteResponse.ok) {
                    const quoteData = await quoteResponse.json();
                    totalEstimatedOutputSol += parseInt(quoteData.outAmount || '0') / 1e9;
                }
            } catch (err) {
                console.warn(`[Dust Swap] Failed to get quote for ${token.mint}:`, err);
            }
        }

        if (totalEstimatedOutputSol === 0) {
            return NextResponse.json({
                error: 'No swap routes found. Tokens may have insufficient liquidity or be untradeable.'
            }, { status: 400 });
        }

        // For MVP: Swap the first dust token only
        // In production, you'd batch multiple swaps into one transaction
        const firstToken = tokens[0];
        const amount = Math.floor(firstToken.amount * Math.pow(10, firstToken.decimals || 9));

        // Get Jupiter quote
        const quoteUrl = `https://quote-api.jup.ag/v6/quote?inputMint=${firstToken.mint}&outputMint=${SOL_MINT}&amount=${amount}&slippageBps=100`;
        const quoteResponse = await fetch(quoteUrl);

        if (!quoteResponse.ok) {
            return NextResponse.json({
                error: 'Failed to get swap quote from Jupiter'
            }, { status: 400 });
        }

        const quoteData = await quoteResponse.json();
        const estimatedOutputLamports = parseInt(quoteData.outAmount);

        // Get swap transaction from Jupiter
        const swapResponse = await fetch('https://quote-api.jup.ag/v6/swap', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                quoteResponse: quoteData,
                userPublicKey: address,
                wrapAndUnwrapSol: true,
                dynamicComputeUnitLimit: true,
                prioritizationFeeLamports: 'auto',
            }),
        });

        if (!swapResponse.ok) {
            return NextResponse.json({
                error: 'Failed to build swap transaction'
            }, { status: 400 });
        }

        const swapData = await swapResponse.json();

        // Deserialize Jupiter's transaction and add platform fee
        const swapTxBytes = Buffer.from(swapData.swapTransaction, 'base64');
        const swapTx = VersionedTransaction.deserialize(swapTxBytes);

        // Calculate 2% platform fee
        const feeLamports = Math.floor(estimatedOutputLamports * (DUST_SWAP_FEE_PERCENT / 100));

        // Get fresh blockhash
        const { blockhash } = await connection.getLatestBlockhash();

        // Decompile the message to access instructions
        const message = TransactionMessage.decompile(swapTx.message);

        // Add platform fee transfer instruction
        if (feeLamports > 5000) { // Only add fee if > 0.000005 SOL
            message.instructions.push(
                SystemProgram.transfer({
                    fromPubkey: owner,
                    toPubkey: DEV_WALLET,
                    lamports: feeLamports,
                })
            );
        }

        // Recompile with new blockhash and instructions
        const newMessage = new TransactionMessage({
            payerKey: owner,
            recentBlockhash: blockhash,
            instructions: message.instructions,
        }).compileToV0Message(message.addressTableLookups);

        const finalTx = new VersionedTransaction(newMessage);

        console.log(`[Dust Swap] Built transaction: ${estimatedOutputLamports / 1e9} SOL output, ${feeLamports / 1e9} SOL fee (2%)`);

        return NextResponse.json({
            swapTransaction: Buffer.from(finalTx.serialize()).toString('base64'),
            estimatedOutput: estimatedOutputLamports / 1e9,
            platformFee: feeLamports / 1e9,
            netReceived: (estimatedOutputLamports - feeLamports) / 1e9,
            tokensProcessed: 1, // MVP: only processing first token
            totalTokens: tokens.length,
        });

    } catch (err: any) {
        console.error('[Dust Swap] Error:', err);
        return NextResponse.json({
            error: err.message || 'Failed to build swap transaction'
        }, { status: 500 });
    }
}

