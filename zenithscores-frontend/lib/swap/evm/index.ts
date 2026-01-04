/**
 * EVM Swap Engine (0x Protocol)
 * 
 * Clean exports for import organization
 */

export { getEvmQuote } from './quote';
export { approveEvmIfNeeded } from './approve';
export { executeEvmSwap } from './execute';

export type { EvmQuote, EvmQuoteParams } from './quote';
