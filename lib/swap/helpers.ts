/**
 * Swap Helpers
 * 
 * Token selection, slippage, max amounts.
 * Production logic matching Jupiter behavior.
 */

// ============================================================================
// CONSTANTS
// ============================================================================

export const SOL_MINT = 'So11111111111111111111111111111111111111112';
export const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
export const USDT_MINT = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB';

// SOL fee buffer (0.002 SOL for tx fees + rent)
const SOL_FEE_BUFFER = 0.002;

// Dust threshold (ignore balances below this)
const DUST_THRESHOLD = 0.001;

// ============================================================================
// TOKEN SELECTION
// ============================================================================

/**
 * Select best FROM token from wallet balances
 * 
 * Rules:
 * - Highest swappable balance
 * - Exclude dust (< 0.001)
 * - Fee-safe for SOL
 */
export function selectFromToken(balances: Record<string, number>): string | null {
  const entries = Object.entries(balances)
    .filter(([mint, amount]) => {
      // Skip internal SOL key (use mint instead)
      if (mint === 'SOL') return false;
      
      // Skip dust
      if (amount < DUST_THRESHOLD) return false;
      
      // For SOL, check if there's enough after fee buffer
      if (mint === SOL_MINT && amount <= SOL_FEE_BUFFER) return false;
      
      return true;
    })
    .map(([mint, amount]) => ({
      mint,
      // Effective swappable amount (fee-safe)
      swappable: mint === SOL_MINT ? Math.max(0, amount - SOL_FEE_BUFFER) : amount
    }))
    .filter(e => e.swappable > 0);

  if (!entries.length) return null;

  // Sort by swappable amount descending
  entries.sort((a, b) => b.swappable - a.swappable);
  
  return entries[0].mint;
}

/**
 * Select best TO token
 * 
 * Rules:
 * - Not same as FROM
 * - High liquidity (> $50k)
 * - Not frozen
 */
export function selectToToken(
  tokens: Array<{ address: string; liquidity?: number; freezeAuthority?: string | null }>,
  fromMint: string
): string | null {
  const candidate = tokens.find(t =>
    t.address !== fromMint &&
    (t.liquidity === undefined || t.liquidity > 50_000) &&
    !t.freezeAuthority
  );

  return candidate?.address || null;
}

// ============================================================================
// SLIPPAGE (AUTO, DYNAMIC)
// ============================================================================

/**
 * Auto-calculate slippage based on liquidity
 * 
 * Rules:
 * - Majors (>$5M liquidity) → 30 bps (0.3%)
 * - Mid ($500k-$5M) → 100 bps (1%)
 * - Long tail (<$500k) → 300 bps (3%)
 */
export function autoSlippageByLiquidity(liquidityUsd: number): number {
  if (liquidityUsd > 5_000_000) return 30;
  if (liquidityUsd > 500_000) return 100;
  return 300;
}

/**
 * Auto-calculate slippage based on trade amount
 * (Use when liquidity unknown)
 */
export function autoSlippageByAmount(amountUsd: number): number {
  if (amountUsd > 10_000) return 50;   // Large trade, tight slippage
  if (amountUsd > 1_000) return 100;   // Medium trade
  if (amountUsd > 100) return 150;     // Small trade
  return 300;                           // Micro trade, wide slippage
}

/**
 * Get recommended slippage for a token pair
 */
export function getRecommendedSlippage(
  inputMint: string,
  outputMint: string,
  amountUsd?: number,
  outputLiquidity?: number
): number {
  // Stablecoin pairs - very tight
  const stablecoins = [USDC_MINT, USDT_MINT, 'USDH1SM1ojwWUga67PGrgFWUHibbjqMvuMaDkRJTgkX', '7kbnvuGBxxj8AG9qp8Scn56muWGaRaFqxg1FsRp3PaFT'];
  if (stablecoins.includes(inputMint) && stablecoins.includes(outputMint)) {
    return 10; // 0.1%
  }

  // SOL pairs - tight
  if (inputMint === SOL_MINT || outputMint === SOL_MINT) {
    if (outputLiquidity && outputLiquidity > 1_000_000) return 50;
    return 100;
  }

  // Use liquidity-based if available
  if (outputLiquidity) {
    return autoSlippageByLiquidity(outputLiquidity);
  }

  // Fallback to amount-based
  if (amountUsd) {
    return autoSlippageByAmount(amountUsd);
  }

  // Default
  return 100;
}

// ============================================================================
// MAX BUTTON (FEE SAFE)
// ============================================================================

/**
 * Get max swappable amount (fee-safe)
 * 
 * Rules:
 * - SOL → leave 0.002 SOL for fees
 * - SPL → full balance
 */
export function maxAmount(mint: string, balance: number): number {
  if (mint === SOL_MINT || mint === 'SOL') {
    return Math.max(0, balance - SOL_FEE_BUFFER);
  }
  return balance;
}

/**
 * Get max swappable in base units (lamports/atomic)
 */
export function maxAmountBase(mint: string, balance: number, decimals: number): bigint {
  const maxUi = maxAmount(mint, balance);
  return BigInt(Math.floor(maxUi * Math.pow(10, decimals)));
}

// ============================================================================
// AMOUNT CONVERSION
// ============================================================================

/**
 * Convert UI amount to base units (lamports)
 */
export function uiToLamports(amount: number, decimals: number): string {
  return Math.floor(amount * Math.pow(10, decimals)).toString();
}

/**
 * Convert base units to UI amount
 */
export function lamportsToUi(lamports: string | number | bigint, decimals: number): number {
  return Number(lamports) / Math.pow(10, decimals);
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Check if swap is valid
 */
export function canSwap(params: {
  inputMint?: string;
  outputMint?: string;
  amount?: number;
  balance?: number;
}): { valid: boolean; reason?: string } {
  const { inputMint, outputMint, amount, balance } = params;

  if (!inputMint) {
    return { valid: false, reason: 'Select input token' };
  }

  if (!outputMint) {
    return { valid: false, reason: 'Select output token' };
  }

  if (inputMint === outputMint) {
    return { valid: false, reason: 'Cannot swap same token' };
  }

  if (!amount || amount <= 0) {
    return { valid: false, reason: 'Enter amount' };
  }

  if (balance !== undefined) {
    const max = maxAmount(inputMint, balance);
    if (amount > max) {
      return { valid: false, reason: 'Insufficient balance' };
    }
  }

  return { valid: true };
}

// ============================================================================
// PRIORITY FEES (ADVANCED)
// ============================================================================

/**
 * Calculate priority fee based on trade size
 * 
 * Note: Use 'auto' in production (backend handles it)
 * This is for manual override only
 */
export function calculatePriorityFee(amountUsd: number): number {
  if (amountUsd > 10_000) return 500_000;  // 0.0005 SOL for large trades
  if (amountUsd > 1_000) return 200_000;   // 0.0002 SOL for medium
  return 50_000;                            // 0.00005 SOL for small
}
