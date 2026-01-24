export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { VolumeObserver } from '@/lib/market-observer/VolumeObserver';
import { analyzeTokenIntegrity } from '@/lib/argus/integrityEngine';
import { analyzeBehavior } from '@/lib/argus/behaviorEngine';
import { analyzeTiming } from '@/lib/argus/timingEngine';

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

        if (!heliusRes.ok) throw new Error("Helius DAS fetch failed");

        const heliusData = await heliusRes.json();
        const asset = heliusData.result;

        if (!asset) {
            return NextResponse.json({ error: 'Token not found on-chain' }, { status: 404 });
        }

        const info = asset.token_info;
        const decimals = info?.decimals || 6;
        let supply = Number(info?.supply || 0) / Math.pow(10, decimals);

        // 2. Fetch Price & 24h Stats from DexScreener
        let price = 0;
        let volume24h = 0;
        let priceChange24h = 0;

        if (dexRes.ok) {
            const dexData = await dexRes.json();
            const pair = (dexData.pairs || []).sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0];
            price = parseFloat(pair?.priceUsd || '0');
            volume24h = parseFloat(pair?.volume?.h24 || '0');
            priceChange24h = parseFloat(pair?.priceChange?.h24 || '0');
        }

        // 3. PHASE 4 v2: Fetch Holder Concentration (Hardened RPC)
        let holders: { amount: number }[] = [];
        let onChainSupply = supply;

        try {
            const conn = new Connection(HELIUS_URL);
            const pubkey = new PublicKey(mint);

            const [largeAccounts, accountInfo] = await Promise.all([
                conn.getTokenLargestAccounts(pubkey),
                conn.getParsedAccountInfo(pubkey)
            ]);

            const mintData = (accountInfo.value?.data as any)?.parsed?.info;
            if (mintData?.supply) {
                const rawSupply = parseFloat(mintData.supply);
                onChainSupply = rawSupply / Math.pow(10, decimals);
            }

            holders = (largeAccounts.value || []).map(h => ({
                amount: h.uiAmount || (parseFloat(h.amount) / Math.pow(10, decimals))
            }));

        } catch (e) {
            console.warn(`[Integrity] RPC Hard-Check failed for ${mint}:`, e);
        }

        // 4. PHASE 4: Integrity Engine Scan
        const integrity = analyzeTokenIntegrity({
            mintAuthority: info?.mint_authority || null,
            freezeAuthority: info?.freeze_authority || null,
            supply: onChainSupply,
            decimals
        }, holders);

        // 5. PHASE 4 v3: Behavioral Engine (Human Signature)
        const deployerAddress = asset.authorities?.[0]?.authority || asset.creators?.[0]?.address || 'Unknown';

        let behavior = null;
        if (deployerAddress !== 'Unknown') {
            behavior = analyzeBehavior(deployerAddress, [], {});
        }

        // 6. PHASE 4 v4: Timing Engine (Momentum & Velocity)
        const timing = analyzeTiming(
            { current: price, change24h: priceChange24h },
            { current: volume24h, change24h: 0 } // volume-change-24h heuristic: assume high if volume exists
        );

        return NextResponse.json({
            mint,
            symbol: info?.symbol || 'UNKNOWN',
            name: asset.content?.metadata?.name || mint,
            decimals,
            supply: onChainSupply,
            price,
            logoURI: asset.content?.links?.image || asset.content?.files?.[0]?.uri || '',
            integrity,
            behavior,
            timing
        });

    } catch (err: any) {
        console.error('[API Argus TokenSpecs] Error:', err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
