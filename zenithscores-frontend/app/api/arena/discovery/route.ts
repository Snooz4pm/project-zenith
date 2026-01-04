import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get('page') ?? 1);
    const limit = Number(searchParams.get('limit') ?? 100);

    console.log('[Discovery API] Fetching tokens for production...');

    // 1. Fetch Solana pools (Raydium)
    const raydiumRes = await fetch(
      'https://api.raydium.io/v2/sdk/liquidity/mainnet.json',
      { cache: 'no-store' }
    );

    let solanaTokens: any[] = [];

    if (raydiumRes.ok) {
      const raydiumJson = await raydiumRes.json();
      solanaTokens = Object.values(raydiumJson.official ?? {})
        .filter((p: any) => (p.liquidity ?? 0) >= 10_000)
        .map((p: any) => ({
          chain: 'solana',
          chainType: 'SOLANA',
          chainId: 'solana',
          networkName: 'Solana',
          address: p.baseMint,
          symbol: p.baseSymbol,
          name: p.baseSymbol, // Raydium JSON doesn't provide full name
          decimals: p.baseDecimals,
          liquidityUsd: Number(p.liquidity),
          volume24hUsd: Number(p.volume24h ?? 0),
          source: 'RAYDIUM'
        }));
    } else {
      console.error(`[Discovery API] Raydium failed: ${raydiumRes.status}`);
    }

    // 2. Fetch EVM tokens (DexScreener)
    const chains = ['ethereum', 'bsc', 'base', 'arbitrum'];
    const evmResults = await Promise.all(
      chains.map(chain =>
        fetch(`https://api.dexscreener.com/latest/dex/pairs/${chain}`)
          .then(r => r.json())
          .catch(err => {
            console.error(`[Discovery API] ${chain} DexScreener failed:`, err);
            return null;
          })
      )
    );

    const evmTokens = evmResults.flatMap((res, i) =>
      res?.pairs
        ?.filter((p: any) => (p.liquidity?.usd ?? 0) >= 10_000 && (p.volume?.h24 ?? 0) >= 1_000)
        .map((p: any) => {
          const chain = chains[i];
          const networkName = chain === 'ethereum' ? 'Ethereum' :
            chain === 'bsc' ? 'BNB Chain' :
              chain === 'base' ? 'Base' :
                chain === 'arbitrum' ? 'Arbitrum' : chain;

          return {
            chain,
            chainType: 'EVM',
            chainId: p.chainId === 'ethereum' ? '1' :
              p.chainId === 'bsc' ? '56' :
                p.chainId === 'base' ? '8453' :
                  p.chainId === 'arbitrum' ? '42161' : p.chainId,
            networkName,
            address: p.baseToken.address,
            symbol: p.baseToken.symbol,
            name: p.baseToken.name,
            logoURI: p.baseToken.logoURI || p.info?.imageUrl,
            priceUsd: Number(p.priceUsd),
            liquidityUsd: Number(p.liquidity.usd),
            volume24hUsd: Number(p.volume.h24 ?? 0),
            source: 'DEXSCREENER'
          };
        }) ?? []
    );

    const tokens = [...solanaTokens, ...evmTokens];

    // Sort by liquidity descending
    tokens.sort((a, b) => b.liquidityUsd - a.liquidityUsd);

    const start = (page - 1) * limit;
    const paged = tokens.slice(start, start + limit);

    console.log(`[Discovery API] Returning ${paged.length} items (Total: ${tokens.length})`);

    return NextResponse.json({
      page,
      limit,
      total: tokens.length,
      pages: Math.ceil(tokens.length / limit),
      items: paged, // Frontend expects 'items' (check ArenaGrid.tsx) or we adapt
    });
  } catch (err) {
    console.error('[DISCOVERY ERROR]', err);
    return NextResponse.json(
      { error: 'Discovery failed', items: [], page: 1, total: 0 },
      { status: 500 }
    );
  }
}
