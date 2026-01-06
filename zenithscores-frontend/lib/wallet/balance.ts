import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

export type WalletBalance = {
    mint: string;
    amount: number;
    decimals: number;
};

// PREFERRED MAJORS (for auto-select priority)
const PREFERRED_MINTS = [
    'So11111111111111111111111111111111111111112', // SOL
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
    'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'  // USDT
];

export async function fetchWalletBalances(connection: Connection, publicKey: PublicKey): Promise<WalletBalance[]> {
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

        return balances;

    } catch (err) {
        console.error("Failed to fetch wallet balances", err);
        return [];
    }
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
