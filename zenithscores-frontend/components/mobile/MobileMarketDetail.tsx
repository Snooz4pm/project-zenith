'use client';

import { ArrowLeft, TrendingUp, TrendingDown, Maximize2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Accordion from './Accordion';

interface MobileMarketDetailProps {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  regimeScore?: number;
  regime?: string;
  marketCap?: string;
  volume24h?: string;
  liquidity?: string;
  children?: React.ReactNode;
}

export default function MobileMarketDetail({
  symbol,
  name,
  price,
  change24h,
  regimeScore = 75,
  regime = 'BULLISH',
  marketCap,
  volume24h,
  liquidity,
  children
}: MobileMarketDetailProps) {
  const router = useRouter();
  const isPositive = change24h >= 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const getRegimeColor = (regime: string) => {
    if (regime === 'BULLISH') return 'text-[var(--accent-mint)]';
    if (regime === 'BEARISH') return 'text-[var(--accent-danger)]';
    return 'text-[var(--text-secondary)]';
  };

  return (
    <div className="min-h-screen bg-[var(--void)] pb-20">
      {/* Header */}
      <div className="sticky top-16 z-20 bg-[var(--void)]/95 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-3 px-4 py-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors touch-target"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
              {symbol}
            </h1>
            <p className="text-xs text-[var(--text-secondary)]">{name}</p>
          </div>
        </div>
      </div>

      {/* Price Section */}
      <div className="px-4 py-6 border-b border-white/5">
        <div className="mb-2">
          <div className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            {formatCurrency(price)}
          </div>
          <div className={`flex items-center gap-2 text-base font-bold ${
            isPositive ? 'text-[var(--accent-mint)]' : 'text-[var(--accent-danger)]'
          }`}>
            {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            <span>{isPositive ? '+' : ''}{formatCurrency(Math.abs(price * change24h / 100))}</span>
            <span>({isPositive ? '+' : ''}{change24h.toFixed(2)}%)</span>
          </div>
        </div>

        {/* DG Score Badge */}
        <div className="flex items-center gap-2">
          <div className={`px-3 py-1.5 rounded-full border font-bold text-sm ${
            regime === 'BULLISH'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : regime === 'BEARISH'
              ? 'bg-red-500/10 border-red-500/30 text-red-400'
              : 'bg-gray-500/10 border-gray-500/30 text-gray-400'
          }`}>
            {regime} {regimeScore}
          </div>
        </div>
      </div>

      {/* Mini Chart */}
      <div className="px-4 py-6">
        <button
          onClick={() => {/* TODO: Open fullscreen chart */}}
          className="group w-full h-64 bg-gradient-to-br from-[rgba(20,241,149,0.05)] to-[rgba(0,212,255,0.05)] rounded-2xl border border-white/5 flex items-center justify-center active:scale-[0.98] transition-transform touch-target"
        >
          <div className="text-center">
            <Maximize2 size={32} className="text-[var(--text-muted)] mx-auto mb-2 group-active:scale-90 transition-transform" />
            <p className="text-sm text-[var(--text-secondary)]">Tap to view chart</p>
          </div>
        </button>
      </div>

      {/* Regime Summary */}
      <div className="px-4 pb-6">
        <div className="p-4 bg-[rgba(255,255,255,0.02)] border border-white/5 rounded-2xl">
          <div className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-2">Market Regime</div>
          <div className={`text-2xl font-bold mb-2 ${getRegimeColor(regime)}`} style={{ fontFamily: 'var(--font-display)' }}>
            {regime}
          </div>
          <p className="text-sm text-[var(--text-secondary)]">
            Current market conditions indicate a {regime.toLowerCase()} trend with strength score of {regimeScore}/100.
          </p>
        </div>
      </div>

      {/* Collapsible Sections */}
      <div className="px-4 pb-6 space-y-3">
        {/* Market Log */}
        <Accordion title="Market Log" badge="24h">
          <div className="pt-4 space-y-3">
            <LogEntry time="2h ago" event="Price increased 5.2%" type="positive" />
            <LogEntry time="4h ago" event="Volume spike detected" type="neutral" />
            <LogEntry time="6h ago" event="Support level tested" type="neutral" />
          </div>
        </Accordion>

        {/* Liquidity & Volume */}
        <Accordion title="Liquidity & Volume">
          <div className="pt-4 grid grid-cols-2 gap-4">
            <StatCard label="Market Cap" value={marketCap || '$1.2B'} />
            <StatCard label="24h Volume" value={volume24h || '$450M'} />
            <StatCard label="Liquidity" value={liquidity || '$890M'} />
            <StatCard label="Circulating" value="18.5M" />
          </div>
        </Accordion>

        {/* Transaction Flow */}
        <Accordion title="Transaction Flow">
          <div className="pt-4 space-y-3">
            <FlowItem direction="buy" amount="$125,000" time="2 min ago" />
            <FlowItem direction="sell" amount="$89,000" time="5 min ago" />
            <FlowItem direction="buy" amount="$245,000" time="8 min ago" />
          </div>
        </Accordion>

        {/* Additional Content */}
        {children && (
          <Accordion title="Advanced Analysis">
            <div className="pt-4">
              {children}
            </div>
          </Accordion>
        )}
      </div>
    </div>
  );
}

function LogEntry({ time, event, type }: { time: string; event: string; type: 'positive' | 'negative' | 'neutral' }) {
  const color = type === 'positive' ? 'text-[var(--accent-mint)]' : type === 'negative' ? 'text-[var(--accent-danger)]' : 'text-[var(--text-secondary)]';

  return (
    <div className="flex items-start gap-3">
      <div className={`w-2 h-2 rounded-full mt-1.5 ${
        type === 'positive' ? 'bg-[var(--accent-mint)]' :
        type === 'negative' ? 'bg-[var(--accent-danger)]' :
        'bg-[var(--text-muted)]'
      }`} />
      <div className="flex-1">
        <div className={`text-sm font-medium ${color}`}>{event}</div>
        <div className="text-xs text-[var(--text-muted)] mt-0.5">{time}</div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-[rgba(255,255,255,0.02)] rounded-xl border border-white/5">
      <div className="text-xs text-[var(--text-secondary)] mb-1">{label}</div>
      <div className="text-base font-bold text-white font-mono">{value}</div>
    </div>
  );
}

function FlowItem({ direction, amount, time }: { direction: 'buy' | 'sell'; amount: string; time: string }) {
  const isBuy = direction === 'buy';

  return (
    <div className="flex items-center justify-between p-3 bg-[rgba(255,255,255,0.02)] rounded-xl border border-white/5">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          isBuy ? 'bg-emerald-500/10' : 'bg-red-500/10'
        }`}>
          {isBuy ? <TrendingUp size={16} className="text-emerald-400" /> : <TrendingDown size={16} className="text-red-400" />}
        </div>
        <div>
          <div className={`text-sm font-bold ${isBuy ? 'text-emerald-400' : 'text-red-400'}`}>
            {isBuy ? 'Buy' : 'Sell'}
          </div>
          <div className="text-xs text-[var(--text-muted)]">{time}</div>
        </div>
      </div>
      <div className="text-sm font-bold text-white font-mono">{amount}</div>
    </div>
  );
}
