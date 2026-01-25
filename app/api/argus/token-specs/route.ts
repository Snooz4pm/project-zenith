export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { VolumeObserver } from '@/lib/market-observer/VolumeObserver';
import { analyzeTokenIntegrity } from '@/lib/argus/integrityEngine';
import { analyzeBehavior } from '@/lib/argus/behaviorEngine';
import { analyzeTiming } from '@/lib/argus/timingEngine';
import { calculateReality } from '@/lib/argus/realityEngine';
import { getPrimaryRisk } from '@/lib/argus/riskScanner';

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
        let volume5m = 0;
        let priceChange24h = 0;
        let liquidityUSD = 0;

        if (dexRes.ok) {
            const dexData = await dexRes.json();
            const pair = (dexData.pairs || []).sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0];
            price = parseFloat(pair?.priceUsd || '0');
            volume24h = parseFloat(pair?.volume?.h24 || '0');
            volume5m = parseFloat(pair?.volume?.m5 || '0');
            priceChange24h = parseFloat(pair?.priceChange?.h24 || '0');
            liquidityUSD = parseFloat(pair?.liquidity?.usd || '0');
        }

        // 3. PHASE 4 v2: Fetch Holder Concentration (Simplified uiAmount approach)
        let holdersUi: { uiAmount: number }[] = [];
        let topHolders: { address: string; amount: number; pct: number }[] = [];
        let onChainSupply = supply; // UI units for display

        try {
            const conn = new Connection(HELIUS_URL);
            const pubkey = new PublicKey(mint);

            const [largestAccounts, accountInfo] = await Promise.all([
                conn.getTokenLargestAccounts(pubkey),
                conn.getParsedAccountInfo(pubkey)
            ]);

            const mintData = (accountInfo.value?.data as any)?.parsed?.info;
            if (mintData?.supply) {
                const rawSupply = parseFloat(mintData.supply);
                onChainSupply = rawSupply / Math.pow(10, decimals);
            }

            // Use uiAmount directly (already normalized by RPC)
            holdersUi = (largestAccounts.value || [])
                .filter(h => h.uiAmount != null)
                .map(h => ({ uiAmount: h.uiAmount! }));

            topHolders = (largestAccounts.value || []).slice(0, 10).map(h => ({
                address: h.address.toString(),
                amount: h.uiAmount || 0,
                pct: (h.uiAmount || 0) / onChainSupply * 100
            }));

        } catch (e) {
            console.warn(`[Integrity] RPC Hard-Check failed for ${mint}:`, e);
        }

        // 4. PHASE 4: Integrity Engine Scan (pass UI amounts)
        const integrity = analyzeTokenIntegrity({
            mintAuthority: info?.mint_authority || null,
            freezeAuthority: info?.freeze_authority || null,
            supplyUi: onChainSupply, // Pass human-readable supply
            decimals
        }, holdersUi);

        // 5. PHASE 4 v3: Behavioral Engine (Human Signature)
        const deployerAddress = asset.authorities?.[0]?.authority || asset.creators?.[0]?.address || 'Unknown';

        let behavior = null;
        if (deployerAddress !== 'Unknown') {
            behavior = analyzeBehavior(deployerAddress, [], {});
        }

        // 6. PHASE 4 v4: Timing Engine (Momentum & Velocity)
        // Heuristic: Compare current 5m rate (projected) to 24h avg
        const projected24h = volume5m * 288;
        const impliedVolChange = volume24h > 0 ? ((projected24h - volume24h) / volume24h) * 100 : 0;

        const timing = analyzeTiming(
            { current: price, change24h: priceChange24h },
            { current: volume24h, change24h: impliedVolChange }
        );

        // 7. Reality Engine Baseline
        const reality = calculateReality(price, onChainSupply, price * 10);

        // 8. PRIMARY RISK HIGHLIGHT (Full Protocol Integration)
        const primaryRisk = getPrimaryRisk(integrity, behavior, timing, reality);

        return NextResponse.json({
            mint,
            symbol: info?.symbol || 'UNKNOWN',
            name: asset.content?.metadata?.name || mint,
            decimals,
            supply: onChainSupply,
            price,
            volume24h,
            volume5m,
            liquidity: liquidityUSD,
            logoURI: asset.content?.links?.image || asset.content?.files?.[0]?.uri || '',
            integrity,
            behavior,
            timing,
            primaryRisk,
            holders: topHolders
        });

    } catch (err: any) {
        console.error('[API Argus TokenSpecs] Error:', err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
