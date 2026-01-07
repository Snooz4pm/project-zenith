/**
 * Solana Token Types (for signals/flow/terminal)
 * 
 * Unified type for all Solana token displays.
 * Replaces NormalizedToken from dexscreener.
 */

import { SolanaToken } from '@/lib/solana/types';
import { RiskLevel } from '@/lib/solana/anti-rug';

// Extended token for UI display
export interface SolanaDisplayToken extends SolanaToken {
  id: string;
  chainId: 'solana';
  chainName: 'Solana';
  priceUsd: number;
  priceChange24h: number;
  volume24hUsd: number;
  
  // UI-specific
  dexUrl?: string;
  isMeme?: boolean;
  isHot?: boolean;
  
  // Risk analysis
  riskLevel?: RiskLevel;
  safetyScore?: number;
}

// Signal with edge scoring
export interface SolanaSignal extends SolanaDisplayToken {
  time: string;
  score: number;
  edgeScore: {
    volume: number;
    liquidity: number;
    momentum: number;
    smartMoney: number;
    overall: number;
  };
  maxTradeSize: number;
  smartMoneyFlow: 'accumulation' | 'distribution' | 'neutral';
  status: 'ACTIVE' | 'PENDING';
  type: 'LONG';
}

// Flow sections
export interface SolanaFlowData {
  hotNow: SolanaDisplayToken[];
  memeFlow: SolanaDisplayToken[];
  newPairs: SolanaDisplayToken[];
}

// Convert SolanaToken to display format
export function toDisplayToken(token: SolanaToken, extra?: {
  priceUsd?: number;
  priceChange24h?: number;
  volume24hUsd?: number;
}): SolanaDisplayToken {
  return {
    ...token,
    id: token.mint,
    chainId: 'solana',
    chainName: 'Solana',
    priceUsd: extra?.priceUsd ?? 0,
    priceChange24h: extra?.priceChange24h ?? 0,
    volume24hUsd: extra?.volume24hUsd ?? token.liquidityUsd * 0.1, // Estimate
    dexUrl: `https://solscan.io/token/${token.mint}`,
    isMeme: isMemeToken(token),
  };
}

// Meme detection
const MEME_KEYWORDS = [
  'inu', 'dog', 'doge', 'pepe', 'frog', 'cat', 'wojak', 'shib', 'elon', 'bonk',
  'based', 'mog', 'chad', 'meme', 'moon', 'rocket', 'baby', 'safe', 'floki', 'shiba',
  'wen', 'gm', 'wagmi', 'ser', 'anon', 'ai', 'gpt', 'bot', 'npc'
];

export function isMemeToken(token: SolanaToken): boolean {
  const name = token.name.toLowerCase();
  const symbol = token.symbol.toLowerCase();
  return MEME_KEYWORDS.some(k => name.includes(k) || symbol.includes(k));
}

// Calculate edge score
export function calculateEdgeScore(token: SolanaDisplayToken): SolanaSignal['edgeScore'] {
  const volumeScore = Math.min(100, Math.log10(token.volume24hUsd + 1) * 15);
  const liquidityScore = Math.min(100, Math.log10(token.liquidityUsd + 1) * 12);
  const momentumScore = Math.min(100, Math.abs(token.priceChange24h) * 3);
  const smartMoneyScore = Math.min(100, (token.volume24hUsd / (token.liquidityUsd + 1)) * 80);

  const overall = Math.round(
    volumeScore * 0.3 +
    liquidityScore * 0.25 +
    momentumScore * 0.25 +
    smartMoneyScore * 0.2
  );

  return {
    volume: Math.round(volumeScore),
    liquidity: Math.round(liquidityScore),
    momentum: Math.round(momentumScore),
    smartMoney: Math.round(smartMoneyScore),
    overall,
  };
}

// Determine smart money flow
export function getSmartMoneyFlow(token: SolanaDisplayToken): 'accumulation' | 'distribution' | 'neutral' {
  const volumeToLiqRatio = token.volume24hUsd / (token.liquidityUsd + 1);
  
  if (volumeToLiqRatio > 0.3 && token.priceChange24h > 5) return 'accumulation';
  if (volumeToLiqRatio > 0.3 && token.priceChange24h < -5) return 'distribution';
  return 'neutral';
}

// Calculate max trade size
export function calculateMaxTradeSize(token: SolanaDisplayToken): number {
  return Math.round(token.liquidityUsd * 0.02);
}

// Convert to signal
export function toSignal(token: SolanaDisplayToken): SolanaSignal {
  const edgeScore = calculateEdgeScore(token);
  
  return {
    ...token,
    time: new Date().toLocaleTimeString('en-US', { hour12: false }),
    score: edgeScore.overall,
    edgeScore,
    maxTradeSize: calculateMaxTradeSize(token),
    smartMoneyFlow: getSmartMoneyFlow(token),
    status: 'ACTIVE',
    type: 'LONG',
  };
}
