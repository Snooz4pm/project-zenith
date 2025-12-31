/**
 * PriceChangeDisplay - Honest 24h change display
 *
 * Shows "—" when data unavailable instead of fake "0.00%"
 * Maintains platform credibility
 */

import { getChangeColorClass } from '@/lib/market-data/change-calculator';

interface PriceChangeDisplayProps {
  change24h: number | null;
  className?: string;
  showSign?: boolean;
  decimals?: number;
}

export default function PriceChangeDisplay({
  change24h,
  className = '',
  showSign = true,
  decimals = 2
}: PriceChangeDisplayProps) {
  // Data unavailable - be honest
  if (change24h === null || !Number.isFinite(change24h)) {
    return (
      <span className={`text-text-muted ${className}`}>
        —
      </span>
    );
  }

  const sign = change24h >= 0 ? '+' : '';
  const colorClass = getChangeColorClass(change24h);

  return (
    <span className={`${colorClass} ${className}`}>
      {showSign && sign}{change24h.toFixed(decimals)}%
    </span>
  );
}

/**
 * Compact version for tight spaces
 */
export function CompactPriceChange({ change24h }: { change24h: number | null }) {
  if (change24h === null || !Number.isFinite(change24h)) {
    return <span className="text-text-muted text-xs">—</span>;
  }

  const colorClass = getChangeColorClass(change24h);
  const sign = change24h >= 0 ? '+' : '';

  return (
    <span className={`${colorClass} text-xs font-medium`}>
      {sign}{change24h.toFixed(2)}%
    </span>
  );
}

/**
 * Badge version for cards
 */
export function PriceChangeBadge({ change24h }: { change24h: number | null }) {
  if (change24h === null || !Number.isFinite(change24h)) {
    return (
      <div className="px-2 py-1 rounded bg-white/5 text-text-muted text-xs">
        —
      </div>
    );
  }

  const isPositive = change24h >= 0;
  const sign = isPositive ? '+' : '';

  return (
    <div className={`px-2 py-1 rounded text-xs font-medium ${
      isPositive
        ? 'bg-accent-mint/10 text-accent-mint'
        : 'bg-accent-danger/10 text-accent-danger'
    }`}>
      {sign}{change24h.toFixed(2)}%
    </div>
  );
}
