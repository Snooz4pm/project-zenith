/**
 * Multi-Route Comparison
 * 
 * Jupiter returns multiple routes — use them intelligently.
 * 
 * Route Types:
 * - BEST_PRICE: Maximum output amount
 * - FASTEST: Fewest hops, lower latency
 * - LOW_IMPACT: Safest execution for large trades
 */

import { QuoteResponse } from './execution';

// ============================================================================
// TYPES
// ============================================================================

export interface RouteInfo {
  outAmount: string;
  inAmount: string;
  priceImpactPct: string;
  marketInfos: Array<{
    id: string;
    label: string;
    inputMint: string;
    outputMint: string;
    inAmount: string;
    outAmount: string;
    lpFee: { amount: string; pct: number };
    platformFee: { amount: string; pct: number };
  }>;
  slippageBps: number;
  otherAmountThreshold: string;
}

export interface ClassifiedRoute {
  route: QuoteResponse;
  type: 'best' | 'fastest' | 'low_impact';
  label: string;
  outAmount: bigint;
  hops: number;
  priceImpact: number;
  computeUnits?: number;
  advantage?: string;
}

// ============================================================================
// ROUTE CLASSIFICATION
// ============================================================================

/**
 * Classify a single route
 */
export function classifyRoute(route: QuoteResponse): {
  outAmount: bigint;
  hops: number;
  priceImpact: number;
  computeUnits: number;
} {
  return {
    outAmount: BigInt(route.outAmount),
    hops: route.routePlan?.length || 1,
    priceImpact: parseFloat(route.priceImpactPct || '0'),
    computeUnits: 0 // Jupiter doesn't always return this
  };
}

/**
 * Pick the best routes from a list
 * Returns up to 3 routes: best price, fastest, lowest impact
 */
export function pickBestRoutes(routes: QuoteResponse[]): ClassifiedRoute[] {
  if (!routes.length) return [];

  const classified: ClassifiedRoute[] = [];

  // 1. BEST PRICE — highest output
  const bestPrice = routes.reduce((best, current) => {
    return BigInt(current.outAmount) > BigInt(best.outAmount) ? current : best;
  });

  const bestClassified = classifyRoute(bestPrice);
  classified.push({
    route: bestPrice,
    type: 'best',
    label: 'Best Price',
    outAmount: bestClassified.outAmount,
    hops: bestClassified.hops,
    priceImpact: bestClassified.priceImpact,
    computeUnits: bestClassified.computeUnits,
    advantage: '+' + calculateAdvantage(bestPrice, routes) + ' more'
  });

  // 2. FASTEST — fewest hops (if different from best)
  const fastest = routes.reduce((fast, current) => {
    const currentHops = current.routePlan?.length || 1;
    const fastHops = fast.routePlan?.length || 1;
    return currentHops < fastHops ? current : fast;
  });

  if (fastest.outAmount !== bestPrice.outAmount) {
    const fastClassified = classifyRoute(fastest);
    classified.push({
      route: fastest,
      type: 'fastest',
      label: 'Fastest',
      outAmount: fastClassified.outAmount,
      hops: fastClassified.hops,
      priceImpact: fastClassified.priceImpact,
      computeUnits: fastClassified.computeUnits,
      advantage: `${fastClassified.hops} hop${fastClassified.hops > 1 ? 's' : ''}`
    });
  }

  // 3. LOW IMPACT — lowest price impact (if different)
  const lowImpact = routes.reduce((low, current) => {
    const currentImpact = parseFloat(current.priceImpactPct || '0');
    const lowImpactVal = parseFloat(low.priceImpactPct || '0');
    return currentImpact < lowImpactVal ? current : low;
  });

  if (lowImpact.outAmount !== bestPrice.outAmount && lowImpact.outAmount !== fastest.outAmount) {
    const lowClassified = classifyRoute(lowImpact);
    if (lowClassified.priceImpact < bestClassified.priceImpact * 0.8) { // Only show if significantly better
      classified.push({
        route: lowImpact,
        type: 'low_impact',
        label: 'Low Impact',
        outAmount: lowClassified.outAmount,
        hops: lowClassified.hops,
        priceImpact: lowClassified.priceImpact,
        computeUnits: lowClassified.computeUnits,
        advantage: `${(lowClassified.priceImpact * 100).toFixed(2)}% impact`
      });
    }
  }

  return classified;
}

/**
 * Calculate percentage advantage over average
 */
function calculateAdvantage(best: QuoteResponse, all: QuoteResponse[]): string {
  if (all.length <= 1) return '0%';

  const bestOut = BigInt(best.outAmount);
  const avgOut = all.reduce((sum, r) => sum + BigInt(r.outAmount), BigInt(0)) / BigInt(all.length);

  if (avgOut === BigInt(0)) return '0%';

  const diff = Number((bestOut - avgOut) * BigInt(10000) / avgOut) / 100;
  return diff.toFixed(2) + '%';
}

/**
 * Auto-select route based on trade size
 * 
 * Rules:
 * - Small trades (<$100) → BEST PRICE (maximize output)
 * - Medium trades ($100-$5k) → BEST PRICE
 * - Large trades (>$5k) → FASTEST (reduce latency risk)
 */
export function autoSelectRoute(
  routes: ClassifiedRoute[],
  tradeUsd: number
): ClassifiedRoute {
  if (!routes.length) throw new Error('No routes available');

  // Large trades → prefer fastest (lower latency risk)
  if (tradeUsd > 5000) {
    const fastest = routes.find(r => r.type === 'fastest');
    if (fastest) return fastest;
  }

  // Default → best price
  const best = routes.find(r => r.type === 'best');
  return best || routes[0];
}

/**
 * Format route for display
 */
export function formatRouteForDisplay(route: ClassifiedRoute): {
  type: string;
  label: string;
  output: string;
  hops: string;
  impact: string;
  advantage: string;
} {
  return {
    type: route.type,
    label: route.label,
    output: route.outAmount.toString(),
    hops: `${route.hops} hop${route.hops > 1 ? 's' : ''}`,
    impact: `${(route.priceImpact * 100).toFixed(2)}%`,
    advantage: route.advantage || ''
  };
}
