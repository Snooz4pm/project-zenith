
'use client';

import { useState } from "react";
import { useDisciplineGate } from "@/hooks/useDisciplineGate";
import { Shield, ShieldAlert, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import DisciplinePanel from "./DisciplinePanel";

export function DisciplineBadge() {
    const { isLocked, gateLevel, serverState, localDecision } = useDisciplineGate();
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);

    // Determine effective status (local decision usually faster than server)
    const status = isLocked ? 'locked' : localDecision.status;
    const readiness = localDecision.readinessIndex ?? 100;

    // Colors
    const statusColor = {
        'open': 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20',
        'warning': 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20 hover:bg-yellow-500/20',
        'locked': 'text-red-500 bg-red-500/10 border-red-500/20 hover:bg-red-500/20'
    }[status];

    const statusLabel = {
        'open': 'CLEAR',
        'warning': 'CAUTION',
        'locked': 'LOCKED'
    }[status];

    const Icon = {
        'open': Shield,
        'warning': ShieldAlert,
        'locked': Lock
    }[status];

    return (
        <>
            {/* Badge Button */}
            <div className="relative">
                <button
                    onClick={() => setIsPanelOpen(true)}
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${statusColor} transition-all duration-300 cursor-pointer`}
                >
                    <Icon size={14} className={status === 'locked' ? 'animate-pulse' : ''} />
                    <div className="flex flex-col leading-none">
                        <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">
                            DG
                        </span>
                        <span className="text-xs font-bold">
                            {statusLabel}
                        </span>
                    </div>
                </button>

                {/* Hover Tooltip */}
                <AnimatePresence>
                    {showTooltip && !isPanelOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 5, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 5, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute top-full right-0 mt-2 w-64 p-3 bg-[#0a0a12] border border-white/10 rounded-lg shadow-2xl z-50"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <Icon size={16} className={statusColor.split(' ')[0]} />
                                <span className={`text-sm font-bold ${statusColor.split(' ')[0]}`}>
                                    Discipline Gate: {statusLabel}
                                </span>
                            </div>
                            <div className="text-xs text-gray-400 mb-2">
                                Trade Readiness: {readiness}%
                            </div>
                            {localDecision.message && (
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    {localDecision.message}
                                </p>
                            )}
                            <div className="text-[10px] text-gray-600 mt-2 pt-2 border-t border-white/5">
                                Click to open full panel
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Side Panel */}
            <DisciplinePanel
                isOpen={isPanelOpen}
                onClose={() => setIsPanelOpen(false)}
            />
        </>
    );
}

