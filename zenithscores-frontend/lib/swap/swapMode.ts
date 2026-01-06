/**
 * Swap Mode: SAFE vs TURBO
 * 
 * One switch controls everything.
 */

export type SwapMode = 'SAFE' | 'TURBO';

/**
 * Behavior matrix:
 * 
 * | Feature      | SAFE | TURBO |
 * |--------------|------|-------|
 * | Jupiter      | ✅   | ✅    |
 * | Raydium      | ✅   | ✅    |
 * | Phoenix      | ❌   | ✅    |
 * | Preflight    | ✅   | ❌    |
 * | Jito         | ❌   | ✅    |
 * | Priority Fee | Low  | High  |
 * | Slippage     | Auto | Tight |
 */

export interface SwapModeConfig {
  mode: SwapMode;
  useJupiter: boolean;
  useRaydium: boolean;
  usePhoenix: boolean;
  usePreflight: boolean;
  useJito: boolean;
  priorityFee: 'low' | 'high' | 'auto';
  slippageStrategy: 'auto' | 'tight';
}

export function getModeConfig(mode: SwapMode): SwapModeConfig {
  if (mode === 'TURBO') {
    return {
      mode: 'TURBO',
      useJupiter: true,
      useRaydium: true,
      usePhoenix: true,
      usePreflight: false,
      useJito: true,
      priorityFee: 'high',
      slippageStrategy: 'tight',
    };
  }

  return {
    mode: 'SAFE',
    useJupiter: true,
    useRaydium: true,
    usePhoenix: false,
    usePreflight: true,
    useJito: false,
    priorityFee: 'auto',
    slippageStrategy: 'auto',
  };
}

/**
 * Get slippage based on mode and volatility
 */
export function getSlippage(mode: SwapMode, volatility: number = 0): number {
  if (mode === 'TURBO') return 30; // 0.3% tight

  // SAFE mode: auto-adjust based on volatility
  if (volatility > 20) return 100; // 1%
  if (volatility > 10) return 75;  // 0.75%
  return 50; // 0.5%
}

/**
 * Get priority fee in lamports
 */
export function getPriorityFee(mode: SwapMode): number | 'auto' {
  if (mode === 'TURBO') return 100_000; // 0.0001 SOL
  return 'auto';
}
