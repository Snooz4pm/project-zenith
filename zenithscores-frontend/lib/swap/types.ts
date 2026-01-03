/**
 * Unified Swap Types
 *
 * Chain-agnostic swap interfaces
 */

export type ChainType = 'SOLANA' | 'EVM';

export interface SwapQuoteRequest {
  chainType: ChainType;
  sellToken: string; // Token address or mint
  buyToken: string; // Token address or mint
  amount: string; // Raw amount (with decimals)
  userAddress: string;
  slippageBps?: number; // Optional, defaults handled per chain
}

export interface SwapQuote {
  chainType: ChainType;
  sellToken: string;
  buyToken: string;
  sellAmount: string;
  buyAmount: string;
  buyAmountMin: string; // With slippage
  priceImpact: number; // Percentage
  route: string[]; // Token addresses in route
  estimatedGas: string;
  fee: {
    amount: string;
    token: string;
    percentage: number;
  };
}

export interface SwapExecuteRequest {
  chainType: ChainType;
  quote: SwapQuote;
  userAddress: string;
}

export interface SwapTransaction {
  chainType: ChainType;
  data: string; // Serialized transaction or transaction object
  to?: string; // EVM only
  value?: string; // EVM only
  from?: string; // EVM only
}
