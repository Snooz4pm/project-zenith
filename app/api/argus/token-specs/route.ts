export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { VolumeObserver } from '@/lib/market-observer/VolumeObserver';
import { analyzeTokenIntegrity } from '@/lib/argus/integrityEngine';
import { analyzeBehavior } from '@/lib/argus/behaviorEngine';

const HELIUS_KEY = process.env.HELIUS_API_KEY;
const HELIUS_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_KEY}`;

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const mint = searchParams.get('mint');

        if (!mint) {
            return NextResponse.json({ error: 'Missing mint' }, { status: 400 });
        }

        // 1. Fetch metadata and supply from Helius DAS
        const body = {
            jsonrpc: "2.0",
            id: "token-specs",
            method: "getAsset",
            params: {
                id: mint,
                displayOptions: { showFungible: true }
            }
        };

        const [heliusRes, dexRes] = await Promise.all([
            fetch(HELIUS_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            }),
            fetch(`https://api.dexscreener.com/latest/dex/tokens/${mint}`)
        ]);

        if (!heliusRes.ok) throw new Error("Helius fetch failed");

        const heliusData = await heliusRes.json();
        const asset = heliusData.result;

        if (!asset) {
            return NextResponse.json({ error: 'Token not found on-chain' }, { status: 404 });
        }

        const info = asset.token_info;
        const decimals = info?.decimals || 6;
        const supply = Number(info?.supply || 0) / Math.pow(10, decimals);

        // 2. Fetch Price from DexScreener
        let price = 0;
        if (dexRes.ok) {
            const dexData = await dexRes.json();
            const pair = (dexData.pairs || []).sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0];
            price = parseFloat(pair?.priceUsd || '0');
        }

        // 3. PHASE 4 v2: Fetch Holder Concentration
        let holders: { amount: number }[] = [];
        try {
            const conn = new Connection(process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com');
            const largeAccounts = await conn.getTokenLargestAccounts(new PublicKey(mint));
            holders = (largeAccounts.value || []).map(h => ({
                amount: parseFloat(h.amount) / Math.pow(10, decimals)
            }));
        } catch (e) {
            console.warn(`[Integrity] Holder fetch failed for ${mint}:`, e);
        }

        // 4. PHASE 4: Integrity Engine Scan
        const integrity = analyzeTokenIntegrity({
            mintAuthority: info?.mint_authority || null,
            freezeAuthority: info?.freeze_authority || null,
            supply,
            decimals
        }, holders);

        // 5. PHASE 4 v3: Behavioral Engine (Human Signature)
        // Heuristic: Use first authority as deployer if available
        const deployerAddress = asset.authorities?.[0]?.authority || asset.creators?.[0]?.address || 'Unknown';

        let behavior = null;
        if (deployerAddress !== 'Unknown') {
            // In v1, we use a 'Shadow Trace' (mocked history for latency protection)
            // Real tracing would fetch Signatures for deployerAddress
            behavior = analyzeBehavior(deployerAddress, [], {}); // Empty history for quick scan
        }

        return NextResponse.json({
            mint,
            symbol: info?.symbol || 'UNKNOWN',
            name: asset.content?.metadata?.name || mint,
            decimals,
            supply,
            price,
            logoURI: asset.content?.links?.image || asset.content?.files?.[0]?.uri || '',
            integrity,
            behavior
        });

    } catch (err: any) {
        console.error('[API Argus TokenSpecs] Error:', err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
