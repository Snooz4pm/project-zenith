'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Activity, AlertTriangle, Lock, Shield, ChevronRight, Clock, TrendingDown, ChevronDown, FileText } from 'lucide-react';
import { useDisciplineGate } from '@/hooks/useDisciplineGate';
import { useDisciplineGatePanel } from '@/contexts/DisciplineGatePanelContext';
import { getViolationLogs } from '@/lib/gate/actions';

interface ViolationLog {
    id: string;
    type: string;
    severity: string;
    message: string;
    createdAt: string;
}

// Uses context - mounts at root level for proper z-index stacking
export function DisciplinePanel() {
    const { isOpen, closePanel } = useDisciplineGatePanel();
    const {
        isLocked,
        gateLevel,
        serverState,
        localDecision,
        override,
        refresh
    } = useDisciplineGate();

    const [showLogs, setShowLogs] = useState(false);
    const [logs, setLogs] = useState<ViolationLog[]>([]);
    const [logsLoading, setLogsLoading] = useState(false);

    const status = isLocked ? 'locked' : localDecision.status;
    const readinessIndex = localDecision.readinessIndex ?? 100;

    useEffect(() => {
        if (showLogs && logs.length === 0) {
            loadLogs();
        }
    }, [showLogs]);

    async function loadLogs() {
        setLogsLoading(true);
        try {
            const data = await getViolationLogs(10);
            setLogs(data as ViolationLog[]);
        } catch (e) {
            console.error('Failed to load logs:', e);
        }
        setLogsLoading(false);
    }

    const statusConfig = {
        open: { label: 'CLEAR', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: Shield },
        warning: { label: 'CAUTION', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: AlertTriangle },
        locked: { label: 'LOCKED', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: Lock }
    };

    const config = statusConfig[status];
    const StatusIcon = config.icon;

    const getLockTimeRemaining = () => {
        if (!serverState?.lockExpiresAt) return null;
        const remaining = new Date(serverState.lockExpiresAt).getTime() - Date.now();
        if (remaining <= 0) return null;
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop - HIGH Z-INDEX */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closePanel}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
                    />

                    {/* Panel - FIXED WIDTH + ISOLATION + HIGH Z-INDEX */}
                    <motion.div
                        initial={{ x: '100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        style={{ isolation: 'isolate' }}
                        className="fixed right-0 top-0 h-full w-[420px] max-w-[90vw] bg-[#0b0f14] border-l border-white/[0.06] z-[9999] flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex-shrink-0 bg-[#0b0f14]/95 backdrop-blur-xl border-b border-white/[0.06] px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Shield className="text-emerald-500" size={20} />
                                <h2 className="text-lg font-bold text-white">Discipline Gate</h2>
                            </div>
                            <button onClick={closePanel} className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors">
                                <X size={18} className="text-gray-400" />
                            </button>
                        </div>

                        {/* Content - Scrollable */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-5">
                            {/* Status Card */}
                            <div className={`p-4 rounded-xl border ${config.border} ${config.bg}`}>
                                <div className="flex items-center gap-3 mb-2">
                                    <StatusIcon className={config.color} size={24} />
                                    <div>
                                        <div className={`text-xs font-bold uppercase tracking-wider ${config.color}`}>Status</div>
                                        <div className={`text-2xl font-bold ${config.color}`}>{config.label}</div>
                                    </div>
                                </div>
                                {localDecision.message && <p className="text-sm text-gray-400 mt-2">{localDecision.message}</p>}
                                {status === 'locked' && getLockTimeRemaining() && (
                                    <div className="flex items-center gap-2 mt-3 text-sm text-red-400">
                                        <Clock size={14} />
                                        <span>Unlocks in {getLockTimeRemaining()}</span>
                                    </div>
                                )}
                            </div>

                            {/* Signals */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Signals Detected</h3>
                                <div className="space-y-2">
                                    <SignalRow icon={Activity} label="Trades (last hour)" value="0" status="neutral" />
                                    <SignalRow icon={TrendingDown} label="Market Regime" value="Volatile" status="warning" />
                                    <SignalRow icon={ChevronRight} label="Asset Switches (2m)" value="0" status="neutral" />
                                </div>
                            </div>

                            {/* Readiness Index */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Trade Readiness Index</h3>
                                <div className="relative">
                                    <div className="h-4 bg-white/[0.05] rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${readinessIndex}%` }}
                                            transition={{ duration: 0.5, ease: 'easeOut' }}
                                            className={`h-full rounded-full ${readinessIndex >= 70 ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' : readinessIndex >= 40 ? 'bg-gradient-to-r from-yellow-600 to-yellow-400' : 'bg-gradient-to-r from-red-600 to-red-400'}`}
                                        />
                                    </div>
                                    <div className="flex justify-between mt-2">
                                        <span className="text-xs text-gray-500">0</span>
                                        <span className={`text-lg font-bold ${readinessIndex >= 70 ? 'text-emerald-400' : readinessIndex >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>{readinessIndex}%</span>
                                        <span className="text-xs text-gray-500">100</span>
                                    </div>
                                </div>
                            </div>

                            {/* Recommendations */}
                            {localDecision.recommendations && localDecision.recommendations.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Recommendations</h3>
                                    <div className="space-y-2">
                                        {localDecision.recommendations.map((rec, idx) => (
                                            <div key={idx} className="flex items-start gap-2 text-sm text-gray-300 bg-white/[0.02] p-3 rounded-lg border border-white/[0.06]">
                                                <span className="text-yellow-400 mt-0.5">•</span>
                                                <span>{rec}</span>
                                            </div>
                                        ))}
                                        {localDecision.sizeReduction && localDecision.sizeReduction > 0 && (
                                            <div className="flex items-center gap-2 text-sm text-yellow-400 bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/20">
                                                <AlertTriangle size={14} />
                                                <span>Reduce position size by {localDecision.sizeReduction}%</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Violation Logs - Terminal Style */}
                            <div className="space-y-2">
                                <button
                                    onClick={() => setShowLogs(!showLogs)}
                                    className="flex items-center justify-between w-full text-xs font-bold text-gray-500 uppercase tracking-wider hover:text-gray-300 transition-colors"
                                >
                                    <span className="flex items-center gap-2"><FileText size={14} /> Violation History</span>
                                    <ChevronDown size={14} className={`transform transition-transform ${showLogs ? 'rotate-180' : ''}`} />
                                </button>
                                <AnimatePresence>
                                    {showLogs && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                            <div className="bg-[#0f1623] rounded-lg p-3 font-mono text-[13px] leading-relaxed max-h-[200px] overflow-y-auto">
                                                {logsLoading ? (
                                                    <div className="text-gray-500 text-center py-3">Loading...</div>
                                                ) : logs.length === 0 ? (
                                                    <div className="text-gray-600 text-center py-3 italic font-sans">No violations recorded. Keep it up!</div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {logs.map((log) => (
                                                            <div key={log.id} className="text-gray-400 whitespace-pre-wrap break-words">
                                                                <span className="text-gray-600">[{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}]</span>{' '}
                                                                <span className={`font-semibold ${log.severity === 'hard_lock' ? 'text-red-400' : log.severity === 'soft_lock' ? 'text-yellow-400' : 'text-emerald-400'}`}>
                                                                    {log.type.replace(/_/g, '_').toUpperCase()}
                                                                </span>
                                                                <span className="text-gray-500"> — </span>
                                                                <span className="text-gray-400">{log.message}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Gate Level */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Your Gate Level</h3>
                                <div className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-lg border border-white/[0.06]">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${gateLevel === 'expert' ? 'bg-purple-500/20 text-purple-400' : gateLevel === 'pro' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                        <Shield size={20} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-white capitalize">{gateLevel} Guard</div>
                                        <div className="text-xs text-gray-500">
                                            {gateLevel === 'beginner' && 'Strict protection enabled'}
                                            {gateLevel === 'pro' && 'Advisory mode with soft locks'}
                                            {gateLevel === 'expert' && 'Minimal intervention'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4 border-t border-white/[0.06]">
                                <button onClick={refresh} className="flex-1 py-2.5 px-4 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] rounded-lg text-sm font-medium text-gray-300 transition-colors">Refresh</button>
                                <button onClick={closePanel} className="flex-1 py-2.5 px-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg text-sm font-medium text-emerald-400 transition-colors">Minimize</button>
                            </div>

                            {/* Override (Pro/Expert) */}
                            {status === 'locked' && (gateLevel === 'pro' || gateLevel === 'expert') && (
                                <div className="pt-2">
                                    <button onClick={() => override('User override requested')} className="w-full py-2.5 px-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-sm font-medium text-red-400 transition-colors">Override Lock (5s wait)</button>
                                    <p className="text-[10px] text-gray-600 text-center mt-2">Overrides are logged and count against your discipline score</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

// Signal Row Component
function SignalRow({ icon: Icon, label, value, status }: { icon: any; label: string; value: string; status: 'neutral' | 'warning' | 'danger' }) {
    const statusColors = { neutral: 'text-gray-400', warning: 'text-yellow-400', danger: 'text-red-400' };
    return (
        <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg border border-white/[0.06]">
            <div className="flex items-center gap-2 text-sm text-gray-400"><Icon size={14} /><span>{label}</span></div>
            <span className={`text-sm font-semibold ${statusColors[status]}`}>{value}</span>
        </div>
    );
}

export default DisciplinePanel;
