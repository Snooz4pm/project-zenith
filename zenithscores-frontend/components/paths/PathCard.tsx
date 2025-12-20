'use client';

import { motion } from 'framer-motion';
import {
    Cpu, Target, Activity, Database, Globe,
    ArrowRight, Lock, CheckCircle2, AlertTriangle, Zap
} from 'lucide-react';

import { PATHS_CONTENT } from '@/lib/paths-content';

interface PathCardProps {
    pathId: string;
    pathName: string;
    score: number;
    isLocked?: boolean;
    confidence: number;
    rank: number;
}



import { useRouter } from 'next/navigation';

export default function PathCard({ pathId, pathName, score, isLocked, confidence, rank }: PathCardProps) {
    const router = useRouter();
    const details = PATHS_CONTENT[pathId];

    // ... (rest of the component until the secondary button)

    // Safety: Log if details are missing
    if (!details) {
        console.warn(`[PathCard] Missing content details for pathId: ${pathId}`);
    }

    const Icon = details?.icon || Activity; // Fallback icon
    // Robust name fallback: Prop > Content > Default
    const displayName = pathName || details?.name || "Unnamed Path";

    // For unlocked view, primary path is Rank 1
    const isPrimary = rank === 1;

    // Safety: Fallback colors if details missing
    const startColor = details?.startColor || 'from-gray-700';
    const endColor = details?.endColor || 'to-gray-600';

    if (isLocked) {
        return (
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 relative overflow-hidden group hover:border-white/20 transition-all">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-black opacity-50" />
                <div className="relative z-10 flex items-center justify-between opacity-50 group-hover:opacity-70 transition-opacity">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/5 rounded-lg">
                            <Icon size={24} className="text-gray-400" />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">
                                Path Locked
                            </div>
                            <h3 className="text-xl font-bold text-gray-300">{displayName}</h3>
                        </div>
                    </div>
                    <Lock size={20} className="text-gray-500" />
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`border rounded-xl p-0 relative overflow-hidden group transition-all duration-300
                ${isPrimary
                    ? 'bg-gradient-to-br from-gray-900 to-gray-800 border-cyan-500/50 shadow-lg shadow-cyan-900/20 col-span-1 md:col-span-2'
                    : 'bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10'}
            `}
        >
            {/* Background accent */}
            <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${startColor} ${endColor} opacity-5 blur-[80px] rounded-full pointer-events-none`} />

            <div className="p-6 md:p-8 relative z-10">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${startColor} ${endColor} shadow-lg`}>
                            <Icon size={isPrimary ? 32 : 24} className="text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                {isPrimary && <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 text-[10px] font-bold uppercase rounded-full border border-cyan-500/20">Primary Match</span>}
                                <span className="text-xs text-gray-400 font-mono tracking-wider">MATCH: {score}%</span>
                            </div>
                            <h3 className={`${isPrimary ? 'text-3xl' : 'text-xl'} font-bold text-white mb-1`}>{displayName}</h3>
                            <p className="text-cyan-400 font-medium">{details?.tagline || 'Discover your trading personality'}</p>
                        </div>
                    </div>
                    {isPrimary && (
                        <div className="hidden md:block text-right">
                            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Confidence</div>
                            <div className="text-xl font-bold text-white">{confidence}%</div>
                        </div>
                    )}
                </div>

                {/* Content Body */}
                <div className={`${isPrimary ? 'grid md:grid-cols-2 gap-8' : 'space-y-4'}`}>
                    <div>
                        <div className="mb-4">
                            <h4 className="text-xs text-gray-500 uppercase tracking-widest mb-2 font-bold">Why this fits you</h4>
                            <p className="text-gray-300 leading-relaxed text-sm">
                                {details?.why || "Based on your activity, this path aligns with your decision-making style."}
                            </p>
                        </div>

                        {details && (
                            <div className="flex flex-col gap-3">
                                <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-white/5">
                                    <Zap size={16} className="text-yellow-400 mt-1 flex-shrink-0" />
                                    <div>
                                        <span className="text-xs text-gray-400 uppercase font-bold block mb-0.5">Superpower</span>
                                        <span className="text-sm text-gray-200">{details.superpower}</span>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-white/5">
                                    <AlertTriangle size={16} className="text-orange-400 mt-1 flex-shrink-0" />
                                    <div>
                                        <span className="text-xs text-gray-400 uppercase font-bold block mb-0.5">The Risk</span>
                                        <span className="text-sm text-gray-200">{details.risk}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {isPrimary && (
                        <div className="flex flex-col justify-between border-t md:border-t-0 md:border-l border-white/10 md:pl-8 pt-6 md:pt-0">
                            {details ? (
                                <div>
                                    <h4 className="text-xs text-gray-500 uppercase tracking-widest mb-3 font-bold">Recommended Career Roles</h4>
                                    <div className="space-y-2">
                                        {details.careerMatches?.map((role: string, idx: number) => (
                                            <div key={idx} className="flex items-center gap-2 text-sm text-cyan-100">
                                                <CheckCircle2 size={14} className="text-cyan-500" />
                                                {role}
                                            </div>
                                        )) || <div className="text-gray-500 text-sm">No roles available</div>}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-gray-500 italic text-sm">
                                    Details unavailable for this path ID.
                                </div>
                            )}

                            <button
                                onClick={() => router.push(`/learning/paths/${pathId}`)}
                                className="mt-6 w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-white/10 group"
                            >
                                View Full Roadmap
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* secondary view compact footer */}
            {!isPrimary && (
                <div className="px-6 pb-6 pt-2">
                    <div className="h-px bg-white/10 mb-4" />
                    <button
                        onClick={() => router.push(`/learning/paths/${pathId}`)}
                        className="w-full py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-sm font-bold rounded-lg transition-colors"
                    >
                        View Details
                    </button>
                </div>
            )}
        </motion.div>
    );
}
