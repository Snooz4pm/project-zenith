/**
 * Swap Module Exports
 * 
 * Production-grade swap infrastructure.
 * Import everything from here.
 */

// Execution engine
export {
  fetchQuote,
  buildSwapTransaction,
  executeSwap,
  executeSwapWithRetry,
  simulateSwapTransaction,
  type QuoteResponse,
  type SwapResult,
  type SwapState
} from './execution';

// Helpers
export {
  SOL_MINT,
  USDC_MINT,
  USDT_MINT,
  selectFromToken,
  selectToToken,
  autoSlippageByLiquidity,
  autoSlippageByAmount,
  getRecommendedSlippage,
  maxAmount,
  maxAmountBase,
  uiToLamports,
  lamportsToUi,
  canSwap,
  calculatePriorityFee
} from './helpers';

// Multi-route comparison
export {
  classifyRoute,
  pickBestRoutes,
  autoSelectRoute,
  formatRouteForDisplay,
  type ClassifiedRoute,
  type RouteInfo
} from './routes';

// Guards (if exists)
export * from './swapGuards';

// Utils (existing)
export * from './utils';
