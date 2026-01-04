import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    console.log('[Discovery API] Fetching ALL tokens - NO FILTERS');

    let allTokens: any[] = [];

    // 1. Raydium (Solana)
    try {
      const raydiumRes = await fetch('https://api.raydium.io/v2/sdk/liquidity/mainnet.json', {
        cache: 'no-store',
        signal: AbortSignal.timeout(10000)
      });

      if (raydiumRes.ok) {
        const raydiumJson = await raydiumRes.json();
        const raydiumTokens = Object.values(raydiumJson.official ?? {})
          .map((p: any) => ({
            chain: 'solana',
            chainType: 'SOLANA',
            chainId: 'solana',
            networkName: 'Solana',
            address: p.baseMint,
            symbol: p.baseSymbol || 'UNKNOWN',
            name: p.baseName || p.baseSymbol || 'Unknown',
            decimals: p.baseDecimals,
            liquidityUsd: Number(p.liquidity ?? 0),
            volume24hUsd: Number(p.volume24h ?? 0),
            priceUsd: Number(p.price ?? 0),
            source: 'RAYDIUM'
          }));

        allTokens.push(...raydiumTokens);
        console.log(`[Discovery] Raydium: ${raydiumTokens.length} tokens`);
      }
    } catch (err) {
      console.error('[Discovery] Raydium failed:', err);
    }

    // 2. Orca (Solana)
    try {
      const orcaRes = await fetch('https://api.mainnet.orca.so/v1/whirlpool/list', {
        cache: 'no-store',
        signal: AbortSignal.timeout(10000)
      });

      if (orcaRes.ok) {
        const orcaJson = await orcaRes.json();
        const orcaTokens = (orcaJson.whirlpools || [])
          .map((p: any) => ({
            chain: 'solana',
            chainType: 'SOLANA',
            chainId: 'solana',
            networkName: 'Solana',
            address: p.tokenA?.mint || p.address,
            symbol: p.tokenA?.symbol || 'UNKNOWN',
            name: p.tokenA?.name || p.tokenA?.symbol || 'Unknown',
            decimals: p.tokenA?.decimals || 9,
            liquidityUsd: Number(p.tvl ?? 0),
            volume24hUsd: Number(p.volume?.day ?? 0),
            priceUsd: Number(p.tokenA?.price ?? 0),
            source: 'ORCA'
          }));

        allTokens.push(...orcaTokens);
        console.log(`[Discovery] Orca: ${orcaTokens.length} tokens`);
      }
    } catch (err) {
      console.error('[Discovery] Orca failed:', err);
    }

    // 3. DexScreener (EVM chains)
    const evmChains = ['ethereum', 'bsc', 'base', 'arbitrum', 'polygon', 'avalanche'];
    for (const chain of evmChains) {
      try {
        const dexRes = await fetch(`https://api.dexscreener.com/latest/dex/pairs/${chain}`, {
          signal: AbortSignal.timeout(10000)
        });

        if (dexRes.ok) {
          const dexJson = await dexRes.json();
          const dexTokens = (dexJson.pairs || [])
            .map((p: any) => ({
              chain,
              chainType: 'EVM',
              chainId: chain === 'ethereum' ? '1' :
                       chain === 'bsc' ? '56' :
                       chain === 'base' ? '8453' :
                       chain === 'arbitrum' ? '42161' :
                       chain === 'polygon' ? '137' :
                       chain === 'avalanche' ? '43114' : chain,
              networkName: chain === 'ethereum' ? 'Ethereum' :
                          chain === 'bsc' ? 'BNB Chain' :
                          chain === 'base' ? 'Base' :
                          chain === 'arbitrum' ? 'Arbitrum' :
                          chain === 'polygon' ? 'Polygon' :
                          chain === 'avalanche' ? 'Avalanche' : chain,
              address: p.baseToken?.address,
              symbol: p.baseToken?.symbol || 'UNKNOWN',
              name: p.baseToken?.name || p.baseToken?.symbol || 'Unknown',
              logoURI: p.baseToken?.logoURI || p.info?.imageUrl,
              priceUsd: Number(p.priceUsd ?? 0),
              liquidityUsd: Number(p.liquidity?.usd ?? 0),
              volume24hUsd: Number(p.volume?.h24 ?? 0),
              source: 'DEXSCREENER'
            }));

          allTokens.push(...dexTokens);
          console.log(`[Discovery] DexScreener ${chain}: ${dexTokens.length} tokens`);
        }
      } catch (err) {
        console.error(`[Discovery] DexScreener ${chain} failed:`, err);
      }
    }

    // Sort by liquidity (highest first)
    allTokens.sort((a, b) => b.liquidityUsd - a.liquidityUsd);

    console.log(`[Discovery API] TOTAL: ${allTokens.length} tokens`);

    return NextResponse.json({
      success: true,
      tokens: allTokens,
      count: allTokens.length,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('[DISCOVERY FATAL]', err);
    return NextResponse.json({
      success: false,
      tokens: [],
      count: 0,
      error: String(err)
    });
  }
}
