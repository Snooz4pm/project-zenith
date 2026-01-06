import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { ZenithToken } from '@/lib/zenith';

export type WalletBalance = {
    mint: string;
    amount: number;
    decimals: number;
};

export type WalletToken = {
    address: string;
    symbol: string;
    name?: string;
    decimals: number;
    logoURI?: string;
    uiBalance: number;
    balanceBase: bigint; // Base units (lamports for SOL, atomic for SPL)
};

// PREFERRED MAJORS (for auto-select priority)
const PREFERRED_MINTS = [
    'So11111111111111111111111111111111111111112', // SOL
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
    'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'  // USDT
];

// Cache wallet balances to avoid spam (aggressive for free tier)
let cachedBalances: WalletBalance[] = [];
let cacheTimestamp = 0;
const CACHE_TTL = 30000; // 30 seconds minimum between fetches (free tier friendly)
let isRateLimited = false;
let rateLimitResetTime = 0;

// Public RPC fallback when rate limited
const PUBLIC_RPC = 'https://api.mainnet-beta.solana.com';

export async function fetchWalletBalances(connection: Connection, publicKey: PublicKey): Promise<WalletBalance[]> {
    // Return cached data if fresh
    const pubkeyStr = publicKey.toBase58();
    if (cachedBalances.length > 0 && Date.now() - cacheTimestamp < CACHE_TTL) {
        console.log('[Balance] Using cached balances');
        return cachedBalances;
    }

    // If rate limited on primary RPC, try public fallback
    if (isRateLimited && Date.now() < rateLimitResetTime) {
        console.log('[Balance] Rate limited, trying public RPC fallback');
        try {
            const { Connection } = await import('@solana/web3.js');
            const publicConn = new Connection(PUBLIC_RPC, 'confirmed');
            const solBalance = await publicConn.getBalance(publicKey);
            // Just return SOL balance from public RPC (faster, less load)
            return [{
                mint: 'So11111111111111111111111111111111111111112',
                amount: solBalance / 1e9,
                decimals: 9
            }, ...cachedBalances.filter(b => b.mint !== 'So11111111111111111111111111111111111111112')];
        } catch {
            return cachedBalances;
        }
    }

    try {
        // 1. Fetch SOL Balance
        const solBalance = await connection.getBalance(publicKey);
        const balances: WalletBalance[] = [{
            mint: 'So11111111111111111111111111111111111111112', // SOL Mint
            amount: solBalance / 1e9,
            decimals: 9
        }];

        // 2. Fetch SPL Token Balances (Parsed is faster/cleaner)
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
            publicKey,
            { programId: TOKEN_PROGRAM_ID }
        );

        tokenAccounts.value.forEach(acc => {
            const info = acc.account.data.parsed.info;
            const amount = Number(info.tokenAmount.uiAmount || 0);

            if (amount > 0) { // Filter zero balance accounts here to save memory
                balances.push({
                    mint: info.mint,
                    amount: amount,
                    decimals: info.tokenAmount.decimals
                });
            }
        });

        // Update cache
        cachedBalances = balances;
        cacheTimestamp = Date.now();

        return balances;

    } catch (err: any) {
        // Handle rate limit errors
        if (err?.message?.includes('429') || err?.message?.includes('Too many')) {
            console.warn('[Balance] Rate limited by RPC, backing off 30s');
            isRateLimited = true;
            rateLimitResetTime = Date.now() + 30000;
        } else {
            console.error("Failed to fetch wallet balances", err);
        }
        // Return cached balances on error
        return cachedBalances;
    }
}

/**
 * Enriches raw wallet balances with token metadata from the universe
 * Returns only tokens that exist in both wallet AND token list
 */
export function enrichWalletBalances(
    balances: WalletBalance[],
    tokenUniverse: ZenithToken[]
): WalletToken[] {
    const enriched: WalletToken[] = [];

    for (const balance of balances) {
        // Find matching token metadata
        const metadata = tokenUniverse.find(t => t.mint === balance.mint);

        if (metadata) {
            enriched.push({
                address: balance.mint,
                symbol: metadata.symbol,
                name: metadata.name || metadata.symbol,
                decimals: balance.decimals,
                logoURI: metadata.logoURI,
                uiBalance: balance.amount,
                balanceBase: BigInt(Math.floor(balance.amount * Math.pow(10, balance.decimals)))
            });
        }
    }

    // Sort by balance (highest first)
    return enriched.sort((a, b) => b.uiBalance - a.uiBalance);
}

// SMART SELECT LOGIC
export function detectBestFromToken(tokensWithBalance: any[]) {
    // 1. Filter viable candidates (Not dust)
    const candidates = tokensWithBalance.filter(t =>
        t.balance > 0 &&
        (t.usdValue > 1 || t.symbol === 'SOL') // Allow SOL even if low, but prefer >$1 USD value generally
    );

    if (candidates.length === 0) return null;

    // 2. Prefer Majors if owned and significant
    const preferred = candidates
        .filter(t => PREFERRED_MINTS.includes(t.address))
        .sort((a, b) => b.usdValue - a.usdValue);

    if (preferred.length > 0) return preferred[0];

    // 3. Fallback: Highest USD Value
    return candidates.sort((a, b) => b.usdValue - a.usdValue)[0];
}
