/**
 * Jupiter Route Validation Background Job
 * 
 * Validates token routes in the background to avoid blocking requests.
 * Runs periodically to keep route cache fresh.
 */

import { hasJupiterRoute, clearRouteCache } from './jupiter';
import { getSolanaTokens } from './discovery';
import { setCache, getCache, CACHE_KEYS } from './cache';

// Validation job state
let isRunning = false;
let lastRunTime = 0;
let validatedCount = 0;
let totalToValidate = 0;

// Job configuration
const JOB_CONFIG = {
  // How often to run full validation (6 hours)
  FULL_VALIDATION_INTERVAL: 6 * 60 * 60 * 1000,
  
  // Minimum liquidity to validate
  MIN_LIQUIDITY_TO_VALIDATE: 1000,
  
  // Max tokens to validate per run
  MAX_TOKENS_PER_RUN: 1000,
  
  // Concurrent requests to Jupiter
  CONCURRENCY: 5,
  
  // Delay between batches (ms)
  BATCH_DELAY: 200,
  
  // Request timeout (ms)
  REQUEST_TIMEOUT: 5000,
};

// Validated mints cache key
const VALIDATED_MINTS_KEY = 'jupiter-validated-mints';
const VALIDATED_MINTS_TTL = 6 * 60 * 60 * 1000; // 6 hours

/**
 * Get current job status
 */
export function getValidationJobStatus() {
  return {
    isRunning,
    lastRunTime,
    validatedCount,
    totalToValidate,
    progress: totalToValidate > 0 ? (validatedCount / totalToValidate * 100).toFixed(1) : 0,
  };
}

/**
 * Get cached validated mints (fast path)
 */
export function getCachedValidatedMints(): Set<string> | null {
  const cached = getCache<string[]>(VALIDATED_MINTS_KEY, VALIDATED_MINTS_TTL);
  return cached ? new Set(cached) : null;
}

/**
 * Run validation job
 * Called by cron or manually
 */
export async function runValidationJob(options?: {
  force?: boolean;
  maxTokens?: number;
}): Promise<{ success: boolean; validated: number; total: number }> {
  const { force = false, maxTokens = JOB_CONFIG.MAX_TOKENS_PER_RUN } = options ?? {};

  // Check if already running
  if (isRunning) {
    console.log('[ValidationJob] Already running, skipping...');
    return { success: false, validated: 0, total: 0 };
  }

  // Check if we ran recently (unless forced)
  if (!force && Date.now() - lastRunTime < JOB_CONFIG.FULL_VALIDATION_INTERVAL) {
    console.log('[ValidationJob] Ran recently, skipping...');
    return { success: false, validated: 0, total: 0 };
  }

  isRunning = true;
  validatedCount = 0;
  const startTime = Date.now();

  try {
    console.log('[ValidationJob] Starting validation...');

    // Get all tokens (from cache or fresh)
    const tokens = await getSolanaTokens();

    // Filter tokens to validate
    const toValidate = tokens
      .filter(t => t.liquidityUsd >= JOB_CONFIG.MIN_LIQUIDITY_TO_VALIDATE)
      .sort((a, b) => b.liquidityUsd - a.liquidityUsd)
      .slice(0, maxTokens);

    totalToValidate = toValidate.length;
    console.log(`[ValidationJob] Validating ${totalToValidate} tokens...`);

    const validMints: string[] = [];

    // Process in batches
    for (let i = 0; i < toValidate.length; i += JOB_CONFIG.CONCURRENCY) {
      const batch = toValidate.slice(i, i + JOB_CONFIG.CONCURRENCY);

      const results = await Promise.all(
        batch.map(async (token) => {
          try {
            const hasRoute = await hasJupiterRoute(token.mint);
            return { mint: token.mint, valid: hasRoute };
          } catch (err) {
            return { mint: token.mint, valid: false };
          }
        })
      );

      for (const r of results) {
        if (r.valid) {
          validMints.push(r.mint);
        }
        validatedCount++;
      }

      // Progress log every 100 tokens
      if (validatedCount % 100 === 0) {
        console.log(`[ValidationJob] Progress: ${validatedCount}/${totalToValidate}`);
      }

      // Delay between batches
      if (i + JOB_CONFIG.CONCURRENCY < toValidate.length) {
        await new Promise(r => setTimeout(r, JOB_CONFIG.BATCH_DELAY));
      }
    }

    // Cache validated mints
    setCache(VALIDATED_MINTS_KEY, validMints);

    const elapsed = Date.now() - startTime;
    lastRunTime = Date.now();

    console.log(`[ValidationJob] Complete: ${validMints.length}/${totalToValidate} valid in ${elapsed}ms`);

    return {
      success: true,
      validated: validMints.length,
      total: totalToValidate,
    };
  } catch (err) {
    console.error('[ValidationJob] Error:', err);
    return { success: false, validated: validatedCount, total: totalToValidate };
  } finally {
    isRunning = false;
  }
}

/**
 * Lazy validation - validate single token on-demand
 * Used when user clicks a token that hasn't been validated
 */
export async function lazyValidateToken(mint: string): Promise<boolean> {
  return hasJupiterRoute(mint);
}

/**
 * Trigger validation for new/high-priority tokens
 * Call this when new tokens are discovered
 */
export async function priorityValidate(mints: string[]): Promise<Map<string, boolean>> {
  const results = new Map<string, boolean>();

  for (const mint of mints.slice(0, 20)) { // Max 20 priority validations
    const valid = await hasJupiterRoute(mint);
    results.set(mint, valid);
    await new Promise(r => setTimeout(r, 100)); // Small delay
  }

  return results;
}
