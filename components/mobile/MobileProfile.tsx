'use client';

import { useRouter } from 'next/navigation';
import { MessageCircle, Settings, ChevronRight } from 'lucide-react';
import Accordion from './Accordion';

interface MobileProfileProps {
  userId: string;
  name: string;
  username?: string;
  image?: string;
  level: number;
  bio?: string;
  isOwnProfile?: boolean;
  stats: {
    totalTrades: number;
    winRate: number;
    totalPnL: number;
    coursesCompleted: number;
  };
}

export default function MobileProfile({
  userId,
  name,
  username,
  image,
  level,
  bio,
  isOwnProfile = false,
  stats
}: MobileProfileProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[var(--void)] pb-20">
      {/* Header */}
      <div className="px-4 py-6 border-b border-white/5">
        <div className="flex items-start gap-4 mb-4">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--accent-mint)] to-[var(--accent-cyan)] flex items-center justify-center flex-shrink-0">
            {image ? (
              <img src={image} alt={name} className="w-full h-full rounded-full" />
            ) : (
              <span className="text-2xl font-bold text-white">{name.charAt(0)}</span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-white mb-1 truncate" style={{ fontFamily: 'var(--font-display)' }}>
              {name}
            </h1>
            {username && (
              <p className="text-sm text-[var(--text-secondary)] mb-2">@{username}</p>
            )}
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--accent-mint)]/10 border border-[var(--accent-mint)]/20 rounded-full">
              <span className="text-xs font-bold text-[var(--accent-mint)]">Level {level}</span>
            </div>
          </div>
        </div>

        {bio && (
          <p className="text-sm text-[var(--text-secondary)] mb-4">{bio}</p>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {!isOwnProfile ? (
            <>
              <button
                onClick={() => router.push(`/messages/${userId}`)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[var(--accent-mint)] text-black font-bold rounded-xl active:scale-95 transition-transform touch-target"
              >
                <MessageCircle size={18} />
                Message
              </button>
              <button className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl active:scale-95 transition-transform touch-target">
                <Settings size={18} className="text-white" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => router.push('/profile/private')}
                className="flex-1 px-4 py-3 bg-[var(--accent-mint)] text-black font-bold rounded-xl active:scale-95 transition-transform touch-target"
              >
                View My Dashboard
              </button>
              <button
                onClick={() => router.push('/profile/settings')}
                className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl active:scale-95 transition-transform touch-target"
              >
                <Settings size={18} className="text-white" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="px-4 py-6">
        <div className="grid grid-cols-2 gap-3">
          <QuickStat label="Total Trades" value={stats.totalTrades.toString()} />
          <QuickStat label="Win Rate" value={`${stats.winRate}%`} color={stats.winRate >= 50 ? 'mint' : 'danger'} />
          <QuickStat label="Total P&L" value={`$${Math.abs(stats.totalPnL).toLocaleString()}`} color={stats.totalPnL >= 0 ? 'mint' : 'danger'} />
          <QuickStat label="Courses" value={stats.coursesCompleted.toString()} color="cyan" />
        </div>
      </div>

      {/* Collapsible Sections */}
      <div className="px-4 pb-6 space-y-3">
        <Accordion title="Trading History" badge={stats.totalTrades}>
          <div className="pt-4 space-y-2">
            <TradeHistoryItem symbol="BTC" type="buy" pnl={1250} date="2 days ago" />
            <TradeHistoryItem symbol="ETH" type="sell" pnl={-340} date="3 days ago" />
            <TradeHistoryItem symbol="SOL" type="buy" pnl={890} date="5 days ago" />
          </div>
        </Accordion>

        <Accordion title="Learning Progress">
          <div className="pt-4 space-y-3">
            <CourseProgress title="Risk Management" progress={85} />
            <CourseProgress title="Technical Analysis" progress={60} />
            <CourseProgress title="Trading Psychology" progress={100} />
          </div>
        </Accordion>

        <Accordion title="Achievements" badge={12}>
          <div className="pt-4 grid grid-cols-3 gap-3">
            <Achievement icon="🏆" label="First Trade" />
            <Achievement icon="💎" label="Diamond Hands" />
            <Achievement icon="🎯" label="Sharp Shooter" />
            <Achievement icon="📈" label="Bull Market" />
            <Achievement icon="🔥" label="Hot Streak" />
            <Achievement icon="⭐" label="Rising Star" />
          </div>
        </Accordion>
      </div>
    </div>
  );
}

function QuickStat({ label, value, color = 'white' }: { label: string; value: string; color?: 'white' | 'mint' | 'danger' | 'cyan' }) {
  const colorClass = color === 'mint' ? 'text-[var(--accent-mint)]' :
                     color === 'danger' ? 'text-[var(--accent-danger)]' :
                     color === 'cyan' ? 'text-[var(--accent-cyan)]' :
                     'text-white';

  return (
    <div className="p-4 bg-[rgba(255,255,255,0.02)] border border-white/5 rounded-xl">
      <div className="text-xs text-[var(--text-secondary)] mb-1 uppercase tracking-wider">{label}</div>
      <div className={`text-2xl font-bold font-mono ${colorClass}`} style={{ fontFamily: 'var(--font-display)' }}>
        {value}
      </div>
    </div>
  );
}

function TradeHistoryItem({ symbol, type, pnl, date }: { symbol: string; type: 'buy' | 'sell'; pnl: number; date: string }) {
  const isBuy = type === 'buy';
  const isProfit = pnl >= 0;

  return (
    <div className="flex items-center justify-between p-3 bg-[rgba(255,255,255,0.02)] rounded-xl border border-white/5">
      <div className="flex items-center gap-3">
        <div className={`px-2 py-1 rounded-lg text-xs font-bold ${
          isBuy ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
        }`}>
          {isBuy ? 'BUY' : 'SELL'}
        </div>
        <div>
          <div className="text-sm font-bold text-white">{symbol}</div>
          <div className="text-xs text-[var(--text-muted)]">{date}</div>
        </div>
      </div>
      <div className={`text-sm font-bold font-mono ${isProfit ? 'text-[var(--accent-mint)]' : 'text-[var(--accent-danger)]'}`}>
        {isProfit ? '+' : ''}${Math.abs(pnl).toLocaleString()}
      </div>
    </div>
  );
}

function CourseProgress({ title, progress }: { title: string; progress: number }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-white">{title}</span>
        <span className="text-xs font-bold text-[var(--accent-mint)]">{progress}%</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[var(--accent-mint)] to-[var(--accent-cyan)] rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function Achievement({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 p-3 bg-[rgba(255,255,255,0.02)] border border-white/5 rounded-xl">
      <div className="text-2xl">{icon}</div>
      <div className="text-xs font-medium text-[var(--text-secondary)] text-center">{label}</div>
    </div>
  );
}
