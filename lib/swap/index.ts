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

// Token filtering
export {
  isTradeableToken,
  filterTradeableTokens,
  isSwappableToken,
  type FilterableToken
} from './tokenFilter';

// Auto-select logic
export {
  autoSelectFrom,
  autoSelectTo,
  selectBestFromToken
} from './autoSelect';

// Swap modes (SAFE vs TURBO)
export {
  getModeConfig,
  getSlippage,
  getPriorityFee,
  type SwapMode,
  type SwapModeConfig
} from './swapMode';

// Guards (if exists)
export * from './swapGuards';

// Utils (existing)
export * from './utils';
