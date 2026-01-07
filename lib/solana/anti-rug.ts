/**
 * Anti-Rug Heuristics for Solana Tokens
 * 
 * Scoring system to identify potential rug pulls.
 * Higher score = safer token.
 */

import { SolanaToken, SOL_MINT, USDC_MINT, USDT_MINT } from './types';

// Risk levels
export type RiskLevel = 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';

export interface TokenRiskAnalysis {
  mint: string;
  symbol: string;
  
  // Overall score (0-100, higher = safer)
  safetyScore: number;
  riskLevel: RiskLevel;
  
  // Individual scores
  scores: {
    liquidity: number;      // 0-25
    age: number;            // 0-20
    holders: number;        // 0-20
    sourceQuality: number;  // 0-15
    concentration: number;  // 0-10
    metadata: number;       // 0-10
  };
  
  // Red flags
  redFlags: string[];
  
  // Green flags
  greenFlags: string[];
}

// Verified safe tokens (blue chips)
const VERIFIED_SAFE_MINTS = new Set([
  SOL_MINT,
  USDC_MINT,
  USDT_MINT,
  'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',  // mSOL
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',  // JUP
  '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs', // WETH (Wormhole)
  'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3', // PYTH
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
  'So11111111111111111111111111111111111111112',   // wSOL
  'rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof',  // RNDR
  '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', // RAY
  'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',  // ORCA
]);

// Known scam patterns in symbols/names
const SCAM_PATTERNS = [
  /^(ELON|DOGE|SHIB|PEPE|WOJAK|TRUMP|BIDEN)/i,
  /FREE|AIRDROP|GIVEAWAY/i,
  /1000X|100X|MOON/i,
  /SAFE(?!TY)/i, // "SAFE" prefix (except SAFETY)
  /\$+/,         // Multiple $ signs
];

/**
 * Calculate liquidity score (0-25)
 */
function scoreLiquidity(liquidityUsd: number): { score: number; flags: string[] } {
  const flags: string[] = [];
  let score = 0;

  if (liquidityUsd >= 1_000_000) {
    score = 25;
    flags.push('✅ Very high liquidity ($1M+)');
  } else if (liquidityUsd >= 100_000) {
    score = 20;
    flags.push('✅ High liquidity ($100k+)');
  } else if (liquidityUsd >= 50_000) {
    score = 15;
  } else if (liquidityUsd >= 10_000) {
    score = 10;
  } else if (liquidityUsd >= 5_000) {
    score = 5;
  } else if (liquidityUsd >= 1_000) {
    score = 2;
    flags.push('⚠️ Low liquidity');
  } else {
    score = 0;
    flags.push('🚨 Very low liquidity (high slippage risk)');
  }

  return { score, flags };
}

/**
 * Calculate age score (0-20)
 */
function scoreAge(createdAt?: number): { score: number; flags: string[] } {
  const flags: string[] = [];
  let score = 0;

  if (!createdAt) {
    return { score: 5, flags: ['⚠️ Unknown token age'] };
  }

  const ageMs = Date.now() - createdAt;
  const ageDays = ageMs / (1000 * 60 * 60 * 24);

  if (ageDays >= 365) {
    score = 20;
    flags.push('✅ Token is over 1 year old');
  } else if (ageDays >= 90) {
    score = 15;
    flags.push('✅ Token is over 3 months old');
  } else if (ageDays >= 30) {
    score = 10;
  } else if (ageDays >= 7) {
    score = 5;
    flags.push('⚠️ Token is less than 1 month old');
  } else if (ageDays >= 1) {
    score = 2;
    flags.push('🚨 Token is less than 1 week old');
  } else {
    score = 0;
    flags.push('🚨 Token created in last 24 hours (EXTREME RISK)');
  }

  return { score, flags };
}

/**
 * Calculate holder score (0-20)
 * Note: Requires on-chain data fetch
 */
function scoreHolders(holderCount?: number): { score: number; flags: string[] } {
  const flags: string[] = [];
  let score = 0;

  if (!holderCount) {
    return { score: 5, flags: [] }; // Unknown, neutral score
  }

  if (holderCount >= 10_000) {
    score = 20;
    flags.push('✅ Large holder base (10k+)');
  } else if (holderCount >= 1_000) {
    score = 15;
    flags.push('✅ Good holder base (1k+)');
  } else if (holderCount >= 500) {
    score = 10;
  } else if (holderCount >= 100) {
    score = 5;
  } else if (holderCount >= 50) {
    score = 2;
    flags.push('⚠️ Few holders');
  } else {
    score = 0;
    flags.push('🚨 Very few holders (easy to manipulate)');
  }

  return { score, flags };
}

/**
 * Calculate source quality score (0-15)
 */
function scoreSourceQuality(sources: string[]): { score: number; flags: string[] } {
  const flags: string[] = [];
  let score = 0;

  const hasRaydium = sources.includes('raydium');
  const hasOrca = sources.includes('orca');

  if (hasRaydium && hasOrca) {
    score = 15;
    flags.push('✅ Listed on both Raydium and Orca');
  } else if (hasRaydium) {
    score = 12;
    flags.push('✅ Listed on Raydium');
  } else if (hasOrca) {
    score = 10;
    flags.push('✅ Listed on Orca');
  } else {
    score = 0;
    flags.push('🚨 Not on major DEXs');
  }

  return { score, flags };
}

/**
 * Calculate concentration score (0-10)
 * Checks if top wallets hold too much
 */
function scoreConcentration(topHolderPercent?: number): { score: number; flags: string[] } {
  const flags: string[] = [];
  let score = 5; // Default neutral

  if (topHolderPercent === undefined) {
    return { score: 5, flags: [] };
  }

  if (topHolderPercent <= 10) {
    score = 10;
    flags.push('✅ Well distributed supply');
  } else if (topHolderPercent <= 20) {
    score = 8;
  } else if (topHolderPercent <= 30) {
    score = 5;
  } else if (topHolderPercent <= 50) {
    score = 2;
    flags.push('⚠️ Top wallet holds >30%');
  } else {
    score = 0;
    flags.push('🚨 Top wallet holds >50% (rug risk)');
  }

  return { score, flags };
}

/**
 * Calculate metadata score (0-10)
 */
function scoreMetadata(token: SolanaToken): { score: number; flags: string[] } {
  const flags: string[] = [];
  let score = 5; // Default

  // Check for scam patterns
  for (const pattern of SCAM_PATTERNS) {
    if (pattern.test(token.symbol) || pattern.test(token.name)) {
      flags.push('🚨 Symbol/name matches known scam pattern');
      score = 0;
      break;
    }
  }

  // Has logo
  if (token.logoURI) {
    score += 2;
  }

  // Reasonable symbol length
  if (token.symbol.length >= 2 && token.symbol.length <= 6) {
    score += 2;
  }

  // Cap at 10
  score = Math.min(10, score);

  return { score, flags };
}

/**
 * Get risk level from score
 */
function getRiskLevel(score: number): RiskLevel {
  if (score >= 80) return 'SAFE';
  if (score >= 60) return 'LOW';
  if (score >= 40) return 'MEDIUM';
  if (score >= 20) return 'HIGH';
  return 'EXTREME';
}

/**
 * Analyze token risk
 */
export function analyzeTokenRisk(
  token: SolanaToken,
  extra?: {
    holderCount?: number;
    topHolderPercent?: number;
  }
): TokenRiskAnalysis {
  // Verified tokens get max score
  if (VERIFIED_SAFE_MINTS.has(token.mint)) {
    return {
      mint: token.mint,
      symbol: token.symbol,
      safetyScore: 100,
      riskLevel: 'SAFE',
      scores: {
        liquidity: 25,
        age: 20,
        holders: 20,
        sourceQuality: 15,
        concentration: 10,
        metadata: 10,
      },
      redFlags: [],
      greenFlags: ['✅ Verified blue-chip token'],
    };
  }

  const redFlags: string[] = [];
  const greenFlags: string[] = [];

  // Calculate individual scores
  const liquidity = scoreLiquidity(token.liquidityUsd);
  const age = scoreAge(token.createdAt);
  const holders = scoreHolders(extra?.holderCount);
  const sourceQuality = scoreSourceQuality(token.sources);
  const concentration = scoreConcentration(extra?.topHolderPercent);
  const metadata = scoreMetadata(token);

  // Collect flags
  for (const f of [...liquidity.flags, ...age.flags, ...holders.flags, 
                   ...sourceQuality.flags, ...concentration.flags, ...metadata.flags]) {
    if (f.startsWith('✅')) greenFlags.push(f);
    else redFlags.push(f);
  }

  const scores = {
    liquidity: liquidity.score,
    age: age.score,
    holders: holders.score,
    sourceQuality: sourceQuality.score,
    concentration: concentration.score,
    metadata: metadata.score,
  };

  const safetyScore = Object.values(scores).reduce((a, b) => a + b, 0);

  return {
    mint: token.mint,
    symbol: token.symbol,
    safetyScore,
    riskLevel: getRiskLevel(safetyScore),
    scores,
    redFlags,
    greenFlags,
  };
}

/**
 * Quick risk check (fast, no on-chain data)
 */
export function quickRiskCheck(token: SolanaToken): {
  safe: boolean;
  riskLevel: RiskLevel;
  reason?: string;
} {
  // Verified = always safe
  if (VERIFIED_SAFE_MINTS.has(token.mint)) {
    return { safe: true, riskLevel: 'SAFE' };
  }

  // Very low liquidity = not safe
  if (token.liquidityUsd < 1000) {
    return { safe: false, riskLevel: 'EXTREME', reason: 'Liquidity too low' };
  }

  // Created in last 24 hours = high risk
  if (token.createdAt && Date.now() - token.createdAt < 24 * 60 * 60 * 1000) {
    return { safe: false, riskLevel: 'HIGH', reason: 'Token too new' };
  }

  // Scam pattern = not safe
  for (const pattern of SCAM_PATTERNS) {
    if (pattern.test(token.symbol)) {
      return { safe: false, riskLevel: 'HIGH', reason: 'Suspicious name' };
    }
  }

  // Not on major DEX = medium risk
  if (!token.sources.includes('raydium') && !token.sources.includes('orca')) {
    return { safe: false, riskLevel: 'MEDIUM', reason: 'Not on major DEX' };
  }

  // Default: low-medium risk based on liquidity
  if (token.liquidityUsd >= 50000) {
    return { safe: true, riskLevel: 'LOW' };
  }

  return { safe: true, riskLevel: 'MEDIUM' };
}

/**
 * Filter tokens by risk level
 */
export function filterByRisk(
  tokens: SolanaToken[],
  maxRisk: RiskLevel = 'MEDIUM'
): SolanaToken[] {
  const riskOrder: RiskLevel[] = ['SAFE', 'LOW', 'MEDIUM', 'HIGH', 'EXTREME'];
  const maxRiskIndex = riskOrder.indexOf(maxRisk);

  return tokens.filter(token => {
    const { riskLevel } = quickRiskCheck(token);
    return riskOrder.indexOf(riskLevel) <= maxRiskIndex;
  });
}
