export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

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

        // Helius DAS getAssetsByOwner call
        const response = await fetch(RPC_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 'my-id',
                method: 'getAssetsByOwner',
                params: {
                    ownerAddress: address,
                    page: 1,
                    limit: 1000,
                    displayOptions: {
                        showFungible: true,
                        showNativeBalance: true
                    }
                }
            })
        });

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message || 'Helius DAS error');
        }

        const assets = data.result?.items || [];

        // Map DAS assets to our existing token structure
        const tokens = assets
            .filter((asset: any) => {
                // Keep fungible tokens and verified NFTs
                const isFungible = asset.interface === 'FungibleToken' || asset.interface === 'FungibleAsset';
                const hasBalance = asset.token_info?.balance && Number(asset.token_info.balance) > 0;
                return isFungible && hasBalance;
            })
            .map((asset: any) => {
                const info = asset.token_info;
                const metadata = asset.content?.metadata;
                const balanceRaw = Number(info.balance) || 0;
                const decimals = Number(info.decimals) || 0;

                return {
                    mint: asset.id,
                    amount: balanceRaw / Math.pow(10, decimals),
                    decimals: decimals,
                    rawAmount: info.balance.toString(),
                    symbol: metadata?.symbol || info.symbol || '?',
                    name: metadata?.name || '',
                    logoURI: asset.content?.links?.image || asset.content?.files?.[0]?.uri || ''
                };
            });

        return NextResponse.json({
            address,
            tokens: tokens,
        });
    } catch (error: any) {
        console.error('[API /wallet/tokens] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch tokens', details: error.message },
            { status: 500 }
        );
    }
}
