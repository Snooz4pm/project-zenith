import { PublicKey } from '@solana/web3.js';
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

// Cache wallet balances to avoid spam (aggressive for Helius free tier)
let cachedBalances: WalletBalance[] = [];
let cacheTimestamp = 0;
const CACHE_TTL = 30000; // 30 seconds minimum between fetches
let cachedWallet: string | null = null;

export async function fetchWalletBalances(publicKey: PublicKey): Promise<WalletBalance[]> {
    const pubkeyStr = publicKey.toBase58();
    const balances: WalletBalance[] = [];

    try {
        // Fetch SOL balance from server-side API
        const balanceRes = await fetch(`/api/wallet/balance?address=${pubkeyStr}`);
        if (balanceRes.ok) {
            const balanceData = await balanceRes.json();
            balances.push({
                mint: 'So11111111111111111111111111111111111111112',
                amount: balanceData.sol || 0,
                decimals: 9
            });
        }

        // Fetch SPL token balances from server-side API
        const tokensRes = await fetch(`/api/wallet/tokens?address=${pubkeyStr}`);
        if (tokensRes.ok) {
            const tokensData = await tokensRes.json();
            tokensData.tokens?.forEach((token: any) => {
                if (token.amount && token.amount > 0) {
                    balances.push({
                        mint: token.mint,
                        amount: token.amount,
                        decimals: token.decimals
                    });
                }
            });
        }

        return balances;
    } catch (err: any) {
        console.error('[Balance] Fetch error:', err);
        return [];
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
