/**
 * Exit Reachability Module
 * 
 * Precomputes which tokens can reach the exit token within hop constraints.
 * Uses reverse BFS from exit token to build reachability graph.
 * 
 * This GUARANTEES paths end at the correct destination - no hallucination.
 */

import { SearchableToken } from '@/types/LiquidityFilter';

// ============================================================================
// TYPES
// ============================================================================

export interface ExitReachability {
    canReachExit: Set<string>;           // Token mints that can reach exit
    distanceToExit: Map<string, number>; // Minimum hops to exit for each token
    exitToken: string;                    // The target exit token
}

export interface AdjacencyGraph {
    // token mint -> array of token mints it can swap to
    outbound: Map<string, string[]>;
    // token mint -> array of token mints that can swap to it
    inbound: Map<string, string[]>;
}

// ============================================================================
// ADJACENCY GRAPH BUILDER
// ============================================================================

/**
 * Build adjacency graph from token universe.
 * A token A can swap to B if both have routes (liquidity exists).
 * 
 * Simplified model: If token has hasRoute=true, it can reach SOL/stables,
 * and through them, any other routable token.
 */
export function buildAdjacencyGraph(universe: SearchableToken[]): AdjacencyGraph {
    const outbound = new Map<string, string[]>();
    const inbound = new Map<string, string[]>();

    // Get all routable tokens
    const routableTokens = universe.filter(t => t.hasRoute);
    const routableMints = new Set(routableTokens.map(t => t.mint));

    // For each routable token, it can potentially reach any other routable token
    // (through intermediaries like SOL, USDC, etc.)
    for (const token of routableTokens) {
        const reachable: string[] = [];

        for (const other of routableTokens) {
            if (other.mint !== token.mint) {
                reachable.push(other.mint);
            }
        }

        outbound.set(token.mint, reachable);
    }

    // Build inbound graph (reverse of outbound)
    for (const [from, toList] of outbound.entries()) {
        for (const to of toList) {
            if (!inbound.has(to)) {
                inbound.set(to, []);
            }
            inbound.get(to)!.push(from);
        }
    }

    return { outbound, inbound };
}

// ============================================================================
// EXIT REACHABILITY (Reverse BFS)
// ============================================================================

/**
 * Build exit reachability graph using reverse BFS from exit token.
 * 
 * This tells us:
 * - Which tokens CAN reach the exit (canReachExit set)
 * - Minimum hops needed to reach exit from each token (distanceToExit map)
 * 
 * O(V + E) complexity, computed once per search request.
 */
export function buildExitReachability(
    universe: SearchableToken[],
    exitToken: string,
    adjacency?: AdjacencyGraph
): ExitReachability {
    // Build adjacency if not provided
    const graph = adjacency || buildAdjacencyGraph(universe);

    const canReachExit = new Set<string>();
    const distanceToExit = new Map<string, number>();

    // BFS queue: start from exit token
    const queue: Array<{ mint: string; depth: number }> = [
        { mint: exitToken, depth: 0 }
    ];

    canReachExit.add(exitToken);
    distanceToExit.set(exitToken, 0);

    while (queue.length > 0) {
        const { mint, depth } = queue.shift()!;

        // Get all tokens that can reach this token (inbound edges)
        const inboundNeighbors = graph.inbound.get(mint) || [];

        for (const prev of inboundNeighbors) {
            if (!canReachExit.has(prev)) {
                canReachExit.add(prev);
                distanceToExit.set(prev, depth + 1);
                queue.push({ mint: prev, depth: depth + 1 });
            }
        }
    }

    console.log(`[ExitReachability] Built for ${exitToken}: ${canReachExit.size} tokens can reach exit`);

    return {
        canReachExit,
        distanceToExit,
        exitToken
    };
}

// ============================================================================
// PRUNING HELPERS (Used in expandPath)
// ============================================================================

/**
 * Check if a candidate token can reach the exit within remaining hop budget.
 * Returns null if valid, or a reason string if invalid.
 */
export function checkExitReachability(
    candidateMint: string,
    currentHopsUsed: number,
    maxHops: number,
    reachability: ExitReachability
): string | null {
    // Rule 1: Token must be in reachable set
    if (!reachability.canReachExit.has(candidateMint)) {
        return `Token cannot reach exit ${reachability.exitToken}`;
    }

    // Rule 2: Must have enough hops remaining
    const hopsRemaining = maxHops - currentHopsUsed - 1; // -1 for the current hop
    const minHopsNeeded = reachability.distanceToExit.get(candidateMint) ?? Infinity;

    if (minHopsNeeded > hopsRemaining) {
        return `Need ${minHopsNeeded} hops to exit but only ${hopsRemaining} remaining`;
    }

    return null; // Valid
}

/**
 * Check if current token IS the exit token.
 */
export function isAtExitToken(
    currentMint: string,
    reachability: ExitReachability
): boolean {
    return currentMint === reachability.exitToken;
}
