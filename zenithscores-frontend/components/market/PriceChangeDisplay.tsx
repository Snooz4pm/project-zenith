/**
 * PriceChangeDisplay - Honest 24h change display
 *
 * Shows "—" when data unavailable instead of fake "0.00%"
 * Maintains platform credibility
 */

import { getChangeColorClass } from '@/lib/market-data/change-calculator';

interface PriceChangeDisplayProps {
  change24h: number | null;
  status?: 'LIVE' | 'CLOSED' | 'STALE';
  className?: string;
  showSign?: boolean;
  decimals?: number;
}

export default function PriceChangeDisplay({
  change24h,
  status = 'LIVE',
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

  if (status === 'CLOSED') {
    return (
      <span className={`text-text-muted flex items-center gap-1 ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-text-muted/50" />
        Closed · {change24h > 0 ? '+' : ''}{change24h.toFixed(decimals)}%
      </span>
    );
  }

  if (status === 'STALE') {
    return (
      <span className={`text-yellow-500/80 flex items-center gap-1 ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500/50" />
        Delayed · {change24h > 0 ? '+' : ''}{change24h.toFixed(decimals)}%
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
export function CompactPriceChange({ change24h, status = 'LIVE' }: { change24h: number | null; status?: 'LIVE' | 'CLOSED' | 'STALE' }) {
  if (change24h === null || !Number.isFinite(change24h)) {
    return <span className="text-text-muted text-xs">—</span>;
  }

  if (status === 'CLOSED') {
    return <span className="text-text-muted text-xs">Closed</span>;
  }

  if (status === 'STALE') {
    return <span className="text-yellow-500 text-xs">Delayed</span>;
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
export function PriceChangeBadge({ change24h, status = 'LIVE' }: { change24h: number | null; status?: 'LIVE' | 'CLOSED' | 'STALE' }) {
  if (change24h === null || !Number.isFinite(change24h)) {
    return (
      <div className="px-2 py-1 rounded bg-white/5 text-text-muted text-xs">
        —
      </div>
    );
  }

  if (status === 'CLOSED') {
    return (
      <div className="px-2 py-1 rounded bg-white/5 text-text-muted text-xs border border-white/10">
        Closed
      </div>
    );
  }

  if (status === 'STALE') {
    return (
      <div className="px-2 py-1 rounded bg-yellow-500/10 text-yellow-500 text-xs border border-yellow-500/20">
        Delayed
      </div>
    );
  }

  const isPositive = change24h >= 0;
  const sign = isPositive ? '+' : '';

  return (
    <div className={`px-2 py-1 rounded text-xs font-medium ${isPositive
        ? 'bg-accent-mint/10 text-accent-mint'
        : 'bg-accent-danger/10 text-accent-danger'
      }`}>
      {sign}{change24h.toFixed(2)}%
    </div>
  );
}
