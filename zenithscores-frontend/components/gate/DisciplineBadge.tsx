
'use client';

import { useDisciplineGate } from "@/hooks/useDisciplineGate";
import { Shield, ShieldAlert, Lock, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function DisciplineBadge() {
    const { isLocked, gateLevel, serverState, localDecision } = useDisciplineGate();

    // Determine effective status (local decision usually faster than server)
    const status = isLocked ? 'locked' : localDecision.status;

    // Colors
    const statusColor = {
        'open': 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
        'warning': 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
        'locked': 'text-red-500 bg-red-500/10 border-red-500/20'
    }[status];

    const Icon = {
        'open': Shield,
        'warning': ShieldAlert,
        'locked': Lock
    }[status];

    return (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${statusColor} transition-colors duration-500`}>
            <Icon size={14} className={status === 'locked' ? 'animate-pulse' : ''} />
            <div className="flex flex-col leading-none">
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">
                    {gateLevel} Guard
                </span>
                <span className="text-xs font-bold">
                    {status === 'open' ? 'Active' : status.toUpperCase()}
                </span>
            </div>

            {/* Warning Message Popover (Simple) */}
            <AnimatePresence>
                {status !== 'open' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute top-16 right-6 w-64 p-4 bg-[#0a0a0c] border border-white/10 rounded-lg shadow-2xl z-50 backdrop-blur-xl"
                    >
                        <div className="flex items-start gap-3">
                            <Activity className={status === 'locked' ? 'text-red-500' : 'text-yellow-500'} size={20} />
                            <div>
                                <h4 className={`text-sm font-bold mb-1 ${status === 'locked' ? 'text-red-400' : 'text-yellow-400'}`}>
                                    {status === 'locked' ? 'Trading Locked' : 'Behavior Warning'}
                                </h4>
                                <p className="text-xs text-zinc-400 leading-relaxed mb-2">
                                    {localDecision.message || serverState?.lockExplanation || "Abnormal trading behavior detected."}
                                </p>
                                {status === 'locked' && (
                                    <div className="text-xs font-mono text-zinc-500 bg-white/5 p-1 rounded">
                                        Expires: {serverState?.lockExpiresAt ? new Date(serverState.lockExpiresAt).toLocaleTimeString() : '...'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
