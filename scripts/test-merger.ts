
import { getDexMatchedTokens } from '../lib/market-observer/JupiterDexMerger';

async function main() {
    console.log("🚀 Starting Volume Merger Test...");
    const start = Date.now();

    try {
        console.log("Fetching tokens...");
        const tokens = await getDexMatchedTokens();

        console.log(`✅ Success! Found ${tokens.length} confirmed trading pairs.`);
        console.log(`⏱️ Time taken: ${(Date.now() - start) / 1000}s`);

        if (tokens.length > 0) {
            console.log("\nTop 5 Tokens by Volume:");
            const sorted = tokens.sort((a, b) => (b.volume5m || 0) - (a.volume5m || 0));

            sorted.slice(0, 5).forEach((t, i) => {
                console.log(`${i + 1}. ${t.symbol} (${t.mint})`);
                console.log(`   Volume (5m): $${t.volume5m?.toLocaleString()}`);
                console.log(`   Liquidity:   $${t.liquidityUSD?.toLocaleString()}`);
                console.log(`   Pair:        ${t.pairAddress}`);
                console.log('---');
            });
        } else {
            console.log("⚠️ No confirmed tokens found. Check API or VolumeObserver logic.");
        }

    } catch (e) {
        console.error("❌ Test Failed:", e);
    }
}

main();
