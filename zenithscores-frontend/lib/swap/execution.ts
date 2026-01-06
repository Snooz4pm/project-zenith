/**
 * Swap Execution Engine
 * 
 * Production-grade swap execution with:
 * - Pre-sign simulation
 * - Priority fees (auto)
 * - ATA creation (Jupiter handles it)
 * - Retry logic
 * - Proper error handling
 * 
 * ARCHITECTURE:
 * Frontend → Backend (Railway) → Jupiter → Phantom → Solana
 * 
 * You are non-custodial. You never touch private keys.
 */

import { Connection, PublicKey, VersionedTransaction, Transaction } from '@solana/web3.js';
import { getPhantom } from '@/lib/phantom';

const RPC = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
const API_URL = process.env.NEXT_PUBLIC_JUPITER_PROXY_URL || 'http://localhost:3001';

// Use commitment 'processed' for faster responses, reduce RPC load
const connection = new Connection(RPC, {
  commitment: 'confirmed',
  confirmTransactionInitialTimeout: 60000,
});

// Track rate limit state
let isRateLimited = false;
let rateLimitResetTime = 0;

// FREE TIER MODE: Skip simulation to conserve RPC calls
// Set to true if using Helius free tier or hitting rate limits
const SKIP_SIMULATION = process.env.NEXT_PUBLIC_SKIP_SIMULATION === 'true';

// ============================================================================
// TYPES
// ============================================================================

export interface QuoteResponse {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  priceImpactPct: string;
  routePlan: any[];
  contextSlot?: number;
  timeTaken?: number;
}

export interface SwapResult {
  success: boolean;
  signature?: string;
  error?: string;
  explorerUrl?: string;
}

export type SwapState = 
  | 'idle'
  | 'fetching-quote'
  | 'quote-ready'
  | 'simulating'
  | 'awaiting-signature'
  | 'sending'
  | 'confirming'
  | 'success'
  | 'error';

// ============================================================================
// SIMULATION (CRITICAL - MUST RUN BEFORE SIGNING)
// ============================================================================

/**
 * Simulate transaction before signing
 * Catches failures BEFORE user sees Phantom popup
 * 
 * NOTE: Skips simulation if rate limited OR if SKIP_SIMULATION is enabled (free tier)
 */
export async function simulateSwapTransaction(
  base64Tx: string,
  userPubkey: string,
  isVersioned: boolean = true
): Promise<{ success: boolean; error?: string; logs?: string[]; skipped?: boolean }> {
  // FREE TIER: Skip simulation entirely to conserve RPC calls
  if (SKIP_SIMULATION) {
    console.log('[Simulation] Skipping - free tier mode');
    return { success: true, skipped: true };
  }

  // Skip simulation if we're rate limited (avoid 429 blocking the swap)
  if (isRateLimited && Date.now() < rateLimitResetTime) {
    console.log('[Simulation] Skipping - rate limited');
    return { success: true, skipped: true };
  }

  try {
    if (isVersioned) {
      // Versioned transaction (Jupiter default)
      const txBuffer = Buffer.from(base64Tx, 'base64');
      const tx = VersionedTransaction.deserialize(txBuffer);

      const result = await connection.simulateTransaction(tx, {
        sigVerify: false,
        replaceRecentBlockhash: true,
      });

      if (result.value.err) {
        return {
          success: false,
          error: parseSimulationError(result.value.err),
          logs: result.value.logs || undefined
        };
      }

      return { success: true, logs: result.value.logs || undefined };
    } else {
      // Legacy transaction fallback
      const tx = Transaction.from(Buffer.from(base64Tx, 'base64'));
      tx.feePayer = new PublicKey(userPubkey);
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

      // Legacy simulation uses different signature
      const result = await connection.simulateTransaction(tx);

      if (result.value.err) {
        return {
          success: false,
          error: parseSimulationError(result.value.err),
          logs: result.value.logs || undefined
        };
      }

      return { success: true, logs: result.value.logs || undefined };
    }
  } catch (e: any) {
    // Handle rate limit errors
    if (e?.message?.includes('429') || e?.message?.includes('Too many requests')) {
      console.log('[Simulation] Rate limited, will skip for 30s');
      isRateLimited = true;
      rateLimitResetTime = Date.now() + 30000;
      // Return success to allow swap to proceed (user will see Phantom error if it fails)
      return { success: true, skipped: true };
    }

    return {
      success: false,
      error: e?.message || 'Simulation failed'
    };
  }
}

/**
 * Parse simulation error into human-readable message
 */
function parseSimulationError(err: any): string {
  if (typeof err === 'string') return err;
  
  // Common Solana errors
  if (err?.InstructionError) {
    const [idx, code] = err.InstructionError;
    if (typeof code === 'object') {
      if (code.Custom !== undefined) {
        return `Instruction ${idx} failed: Custom error ${code.Custom}`;
      }
    }
    return `Instruction ${idx} failed: ${JSON.stringify(code)}`;
  }

  if (err?.InsufficientFundsForRent) {
    return 'Insufficient SOL for rent';
  }

  return JSON.stringify(err);
}

// ============================================================================
// QUOTE FETCHING
// ============================================================================

/**
 * Fetch Jupiter quote via backend proxy
 * 
 * NEVER call if fromMint === toMint
 */
export async function fetchQuote(params: {
  inputMint: string;
  outputMint: string;
  amount: string; // in base units (lamports)
  slippageBps: number;
}): Promise<QuoteResponse | null> {
  const { inputMint, outputMint, amount, slippageBps } = params;

  // Guard: Never quote same token
  if (inputMint === outputMint) {
    console.warn('[fetchQuote] Same token, skipping');
    return null;
  }

  // Guard: Zero amount
  if (!amount || amount === '0') {
    return null;
  }

  try {
    const url = `${API_URL}/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippageBps}`;
    
    const res = await fetch(url);
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Quote failed: ${errorText}`);
    }

    return await res.json();
  } catch (e: any) {
    console.error('[fetchQuote] Error:', e);
    throw e;
  }
}

// ============================================================================
// SWAP EXECUTION
// ============================================================================

/**
 * Build swap transaction via backend
 * 
 * Backend flags (REQUIRED):
 * - wrapAndUnwrapSol: true
 * - dynamicComputeUnitLimit: true
 * - prioritizationFeeLamports: 'auto'
 */
export async function buildSwapTransaction(
  quote: QuoteResponse,
  userPublicKey: string
): Promise<{ swapTransaction: string; lastValidBlockHeight?: number }> {
  const res = await fetch(`${API_URL}/swap`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quoteResponse: quote,
      userPublicKey,
      // These are handled by backend, but documenting here:
      // wrapAndUnwrapSol: true,
      // dynamicComputeUnitLimit: true,
      // prioritizationFeeLamports: 'auto',
    })
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Swap build failed: ${errorText}`);
  }

  return await res.json();
}

/**
 * Execute swap with full safety flow:
 * 1. Build transaction (backend)
 * 2. Simulate (catch errors before signing)
 * 3. Sign + Send (Phantom)
 * 4. Confirm
 */
export async function executeSwap(
  quote: QuoteResponse,
  onStateChange?: (state: SwapState) => void
): Promise<SwapResult> {
  const phantom = getPhantom();
  
  if (!phantom) {
    return { success: false, error: 'Phantom wallet not found' };
  }

  if (!phantom.publicKey) {
    return { success: false, error: 'Wallet not connected' };
  }

  const userPublicKey = phantom.publicKey.toString();

  try {
    // 1. Build transaction
    onStateChange?.('simulating');
    const { swapTransaction, lastValidBlockHeight } = await buildSwapTransaction(quote, userPublicKey);

    // 2. Simulate BEFORE signing
    const simResult = await simulateSwapTransaction(swapTransaction, userPublicKey);
    
    if (!simResult.success) {
      console.error('[executeSwap] Simulation failed:', simResult.error);
      console.error('[executeSwap] Logs:', simResult.logs);
      return { 
        success: false, 
        error: `Simulation failed: ${simResult.error}` 
      };
    }

    // 3. Deserialize and sign
    onStateChange?.('awaiting-signature');
    const txBuffer = Buffer.from(swapTransaction, 'base64');
    const transaction = VersionedTransaction.deserialize(txBuffer);

    // 4. Sign and send via Phantom
    onStateChange?.('sending');
    const result = await phantom.signAndSendTransaction(transaction);
    const signature = result.signature;

    // 5. Confirm transaction
    onStateChange?.('confirming');
    const confirmation = await connection.confirmTransaction({
      signature,
      blockhash: (await connection.getLatestBlockhash()).blockhash,
      lastValidBlockHeight: lastValidBlockHeight || (await connection.getBlockHeight()) + 150
    }, 'confirmed');

    if (confirmation.value.err) {
      return {
        success: false,
        signature,
        error: 'Transaction failed on-chain',
        explorerUrl: `https://solscan.io/tx/${signature}`
      };
    }

    onStateChange?.('success');
    return {
      success: true,
      signature,
      explorerUrl: `https://solscan.io/tx/${signature}`
    };

  } catch (e: any) {
    console.error('[executeSwap] Error:', e);
    
    // Handle user rejection
    if (e?.message?.includes('User rejected') || e?.code === 4001) {
      return { success: false, error: 'Transaction cancelled' };
    }

    // Handle blockhash expired
    if (e?.message?.includes('Blockhash not found') || e?.message?.includes('block height exceeded')) {
      return { success: false, error: 'Transaction expired. Please try again.' };
    }

    return { 
      success: false, 
      error: e?.message || 'Swap failed' 
    };
  }
}

/**
 * Execute swap with automatic retries
 */
export async function executeSwapWithRetry(
  quote: QuoteResponse,
  maxRetries: number = 2,
  onStateChange?: (state: SwapState) => void,
  onRetry?: (attempt: number) => void
): Promise<SwapResult> {
  let lastError: string | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      onRetry?.(attempt);
      // Wait before retry
      await new Promise(r => setTimeout(r, 1000));
    }

    const result = await executeSwap(quote, onStateChange);

    if (result.success) {
      return result;
    }

    // Don't retry user rejections
    if (result.error === 'Transaction cancelled') {
      return result;
    }

    lastError = result.error;
    console.warn(`[executeSwapWithRetry] Attempt ${attempt + 1} failed:`, result.error);
  }

  return {
    success: false,
    error: lastError || 'Swap failed after retries'
  };
}
