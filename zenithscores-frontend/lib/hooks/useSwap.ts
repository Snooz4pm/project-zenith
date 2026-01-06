/**
 * useSwap Hook
 * 
 * Complete swap flow orchestration:
 * - Quote fetching with debounce
 * - Validation
 * - Execution with simulation
 * - State management
 * 
 * This is the single hook you need for swaps.
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useWalletBalances, getBalance } from '@/lib/hooks/useWalletBalances';
import { fetchQuote, executeSwapWithRetry, SwapState, QuoteResponse, SwapResult } from '@/lib/swap/execution';
import { maxAmount, uiToLamports, lamportsToUi, canSwap, getRecommendedSlippage, SOL_MINT } from '@/lib/swap/helpers';
import { getPhantom } from '@/lib/phantom';

// ============================================================================
// TYPES
// ============================================================================

export interface SwapToken {
  address: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
  liquidity?: number;
}

export interface UseSwapReturn {
  // State
  inputToken: SwapToken | null;
  outputToken: SwapToken | null;
  inputAmount: string;
  outputAmount: string;
  quote: QuoteResponse | null;
  swapState: SwapState;
  error: string | null;
  
  // Computed
  inputBalance: number;
  outputBalance: number;
  maxInput: number;
  priceImpact: string | null;
  canExecute: boolean;
  
  // Actions
  setInputToken: (token: SwapToken | null) => void;
  setOutputToken: (token: SwapToken | null) => void;
  setInputAmount: (amount: string) => void;
  setMaxInput: () => void;
  switchTokens: () => void;
  executeSwap: () => Promise<SwapResult>;
  refreshQuote: () => void;
  reset: () => void;
}

// ============================================================================
// HOOK
// ============================================================================

export function useSwap(walletAddress?: string | null): UseSwapReturn {
  // Balances
  const { balances, refresh: refreshBalances } = useWalletBalances(walletAddress);

  // Token state
  const [inputToken, setInputToken] = useState<SwapToken | null>(null);
  const [outputToken, setOutputToken] = useState<SwapToken | null>(null);
  const [inputAmount, setInputAmount] = useState<string>('');
  
  // Quote state
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [outputAmount, setOutputAmount] = useState<string>('');
  const [swapState, setSwapState] = useState<SwapState>('idle');
  const [error, setError] = useState<string | null>(null);

  // Refs for debounce
  const quoteTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastQuoteParamsRef = useRef<string>('');

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const inputBalance = inputToken ? getBalance(balances, inputToken.address) : 0;
  const outputBalance = outputToken ? getBalance(balances, outputToken.address) : 0;
  const maxInput = inputToken ? maxAmount(inputToken.address, inputBalance) : 0;

  const priceImpact = quote?.priceImpactPct 
    ? (parseFloat(quote.priceImpactPct) * 100).toFixed(2) 
    : null;

  const validation = canSwap({
    inputMint: inputToken?.address,
    outputMint: outputToken?.address,
    amount: parseFloat(inputAmount) || 0,
    balance: inputBalance
  });

  const canExecute = validation.valid && !!quote && swapState === 'quote-ready';

  // ============================================================================
  // QUOTE FETCHING (DEBOUNCED)
  // ============================================================================

  const fetchQuoteDebounced = useCallback(async () => {
    if (!inputToken || !outputToken || !inputAmount) {
      setQuote(null);
      setOutputAmount('');
      return;
    }

    const amount = parseFloat(inputAmount);
    if (isNaN(amount) || amount <= 0) {
      setQuote(null);
      setOutputAmount('');
      return;
    }

    // Same token check
    if (inputToken.address === outputToken.address) {
      setError('Cannot swap same token');
      return;
    }

    // Create params hash for deduplication
    const paramsHash = `${inputToken.address}-${outputToken.address}-${inputAmount}`;
    if (paramsHash === lastQuoteParamsRef.current && quote) {
      return; // Skip duplicate request
    }
    lastQuoteParamsRef.current = paramsHash;

    setSwapState('fetching-quote');
    setError(null);

    try {
      const amountLamports = uiToLamports(amount, inputToken.decimals);
      const slippage = getRecommendedSlippage(
        inputToken.address,
        outputToken.address,
        undefined,
        outputToken.liquidity
      );

      const quoteResult = await fetchQuote({
        inputMint: inputToken.address,
        outputMint: outputToken.address,
        amount: amountLamports,
        slippageBps: slippage
      });

      if (quoteResult) {
        setQuote(quoteResult);
        const outUi = lamportsToUi(quoteResult.outAmount, outputToken.decimals);
        setOutputAmount(outUi.toFixed(outputToken.decimals > 6 ? 6 : outputToken.decimals));
        setSwapState('quote-ready');
      } else {
        setQuote(null);
        setOutputAmount('');
        setSwapState('idle');
      }
    } catch (e: any) {
      console.error('[useSwap] Quote error:', e);
      setError(e?.message || 'Failed to get quote');
      setQuote(null);
      setOutputAmount('');
      setSwapState('error');
    }
  }, [inputToken, outputToken, inputAmount, quote]);

  // Debounced quote effect
  useEffect(() => {
    if (quoteTimeoutRef.current) {
      clearTimeout(quoteTimeoutRef.current);
    }

    // Don't fetch if missing required params
    if (!inputToken || !outputToken || !inputAmount || parseFloat(inputAmount) <= 0) {
      setQuote(null);
      setOutputAmount('');
      setSwapState('idle');
      return;
    }

    // Debounce quote fetch (500ms)
    quoteTimeoutRef.current = setTimeout(fetchQuoteDebounced, 500);

    return () => {
      if (quoteTimeoutRef.current) {
        clearTimeout(quoteTimeoutRef.current);
      }
    };
  }, [inputToken, outputToken, inputAmount, fetchQuoteDebounced]);

  // ============================================================================
  // ACTIONS
  // ============================================================================

  const setMaxInputAmount = useCallback(() => {
    if (maxInput > 0) {
      // Format based on token decimals
      const formatted = maxInput.toFixed(inputToken?.decimals || 9);
      setInputAmount(formatted);
    }
  }, [maxInput, inputToken]);

  const switchTokens = useCallback(() => {
    const tempInput = inputToken;
    const tempAmount = inputAmount;
    
    setInputToken(outputToken);
    setOutputToken(tempInput);
    setInputAmount(outputAmount);
    setQuote(null);
  }, [inputToken, outputToken, inputAmount, outputAmount]);

  const doExecuteSwap = useCallback(async (): Promise<SwapResult> => {
    const phantom = getPhantom();
    
    if (!phantom?.publicKey) {
      return { success: false, error: 'Wallet not connected' };
    }

    if (!quote) {
      return { success: false, error: 'No quote available' };
    }

    if (!validation.valid) {
      return { success: false, error: validation.reason };
    }

    setError(null);

    const result = await executeSwapWithRetry(
      quote,
      2, // max retries
      setSwapState,
      (attempt) => console.log(`[useSwap] Retry attempt ${attempt}`)
    );

    if (result.success) {
      // Refresh balances after successful swap
      setTimeout(() => refreshBalances(), 2000);
      
      // Clear input
      setInputAmount('');
      setOutputAmount('');
      setQuote(null);
    } else {
      setError(result.error || 'Swap failed');
      setSwapState('error');
    }

    return result;
  }, [quote, validation, refreshBalances]);

  const refreshQuote = useCallback(() => {
    lastQuoteParamsRef.current = ''; // Force refetch
    fetchQuoteDebounced();
  }, [fetchQuoteDebounced]);

  const reset = useCallback(() => {
    setInputToken(null);
    setOutputToken(null);
    setInputAmount('');
    setOutputAmount('');
    setQuote(null);
    setSwapState('idle');
    setError(null);
  }, []);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // State
    inputToken,
    outputToken,
    inputAmount,
    outputAmount,
    quote,
    swapState,
    error: error || (!validation.valid ? validation.reason || null : null),

    // Computed
    inputBalance,
    outputBalance,
    maxInput,
    priceImpact,
    canExecute,

    // Actions
    setInputToken,
    setOutputToken,
    setInputAmount,
    setMaxInput: setMaxInputAmount,
    switchTokens,
    executeSwap: doExecuteSwap,
    refreshQuote,
    reset
  };
}
