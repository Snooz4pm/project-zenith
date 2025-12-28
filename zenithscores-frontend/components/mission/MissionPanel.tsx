'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import {
    Target, ChevronDown, ChevronUp, Plus,
    Clock, Lock, Send, BookOpen
} from 'lucide-react';
import { getAssetMissions, appendMissionUpdate, createLightweightMission } from '@/lib/actions/notebook';
import { ThesisItem } from '@/lib/types/notebook';

interface MissionPanelProps {
    symbol: string;
    assetType: 'crypto' | 'stock' | 'forex';
    currentPrice?: number;
}

interface Mission {
    id: string;
    title: string | null;
    status: string;
    thesis: ThesisItem[];
    createdAt: string;
    missionUpdates: { createdAt: string; note: string; price: number | null }[];
}

export default function MissionPanel({ symbol, assetType, currentPrice }: MissionPanelProps) {
    const { data: session } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const [missions, setMissions] = useState<Mission[]>([]);
    const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [note, setNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newMissionTitle, setNewMissionTitle] = useState('');
    const [newMissionHypothesis, setNewMissionHypothesis] = useState('');

    // Load missions on mount and when symbol changes
    useEffect(() => {
        if (session?.user?.id && symbol) {
            loadMissions();
        }
    }, [session?.user?.id, symbol]);

    async function loadMissions() {
        if (!session?.user?.id) return;
        setIsLoading(true);
        const data = await getAssetMissions(session.user.id, symbol);
        // Cast Prisma JsonValue to ThesisItem[] and handle date serialization
        type PrismaMission = Awaited<ReturnType<typeof getAssetMissions>>[number];
        const typedMissions = data.map((m: PrismaMission) => ({
            ...m,
            thesis: (m.thesis as ThesisItem[] | null) || [],
            createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : String(m.createdAt),
            missionUpdates: m.missionUpdates.map((u: PrismaMission['missionUpdates'][number]) => ({
                ...u,
                createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : String(u.createdAt)
            }))
        })) as Mission[];
        setMissions(typedMissions);
        if (typedMissions.length > 0 && !selectedMission) {
            setSelectedMission(typedMissions[0]);
        }
        setIsLoading(false);
    }

    async function handleCommitUpdate() {
        if (!session?.user?.id || !selectedMission || !note.trim()) return;
        setIsSubmitting(true);
        const res = await appendMissionUpdate(
            selectedMission.id,
            session.user.id,
            note.trim(),
            currentPrice,
            'asset_page'
        );
        if (res.success) {
            setNote('');
            await loadMissions(); // Refresh to show new update
        }
        setIsSubmitting(false);
    }

    async function handleCreateMission() {
        if (!session?.user?.id || !newMissionTitle.trim()) return;
        setIsSubmitting(true);
        const res = await createLightweightMission(
            session.user.id,
            symbol,
            newMissionTitle.trim(),
            newMissionHypothesis.trim() || undefined,
            currentPrice
        );
        if (res.success && res.data) {
            setNewMissionTitle('');
            setNewMissionHypothesis('');
            setShowCreateForm(false);
            await loadMissions();
            setSelectedMission(res.data as unknown as Mission);
        }
        setIsSubmitting(false);
    }

    if (!session) return null;

    const hypotheses = selectedMission?.thesis?.filter((t: ThesisItem) => t.type === 'hypothesis') || [];
    const rules = selectedMission?.thesis?.filter((t: ThesisItem) => t.type === 'rule') || [];
    const lastUpdate = selectedMission?.missionUpdates?.[0];

    return (
        <div className="fixed right-4 top-24 z-40">
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-lg ${selectedMission
                    ? 'bg-emerald-500 text-black hover:bg-emerald-400'
                    : 'bg-white/5 text-zinc-400 hover:bg-white/10 border border-white/10'
                    }`}
            >
                <Target size={14} />
                {selectedMission ? 'MISSION ACTIVE' : 'LINK MISSION'}
                {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {/* Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="absolute right-0 top-12 w-80 bg-[#0a0a0c] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-white/5 bg-white/[0.02]">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                                    Linked Mission
                                </h3>
                                <span className="text-[10px] text-zinc-600 font-mono">{symbol}</span>
                            </div>
                        </div>

                        <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
                            {/* Mission Selector */}
                            {!showCreateForm && (
                                <div className="space-y-2">
                                    <select
                                        value={selectedMission?.id || ''}
                                        onChange={(e) => {
                                            const mission = missions.find(m => m.id === e.target.value);
                                            setSelectedMission(mission || null);
                                        }}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                                    >
                                        <option value="">No mission linked</option>
                                        {missions.map(m => (
                                            <option key={m.id} value={m.id}>
                                                {m.title || 'Untitled Mission'}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={() => setShowCreateForm(true)}
                                        className="w-full flex items-center justify-center gap-2 py-2 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                                    >
                                        <Plus size={12} />
                                        Create Lightweight Mission
                                    </button>
                                </div>
                            )}

                            {/* Create Form */}
                            {showCreateForm && (
                                <div className="space-y-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                                    <input
                                        type="text"
                                        placeholder="Mission Title"
                                        value={newMissionTitle}
                                        onChange={(e) => setNewMissionTitle(e.target.value)}
                                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50"
                                    />
                                    <textarea
                                        placeholder="Your hypothesis (optional)"
                                        value={newMissionHypothesis}
                                        onChange={(e) => setNewMissionHypothesis(e.target.value)}
                                        rows={2}
                                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 resize-none"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setShowCreateForm(false)}
                                            className="flex-1 py-2 text-xs text-zinc-500 hover:text-white transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleCreateMission}
                                            disabled={!newMissionTitle.trim() || isSubmitting}
                                            className="flex-1 py-2 bg-emerald-500 text-black font-bold text-xs rounded-lg hover:bg-emerald-400 transition-colors disabled:opacity-50"
                                        >
                                            {isSubmitting ? 'Creating...' : 'Create'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Mission Snapshot */}
                            {selectedMission && !showCreateForm && (
                                <>
                                    {/* Read-only Thesis */}
                                    <div className="space-y-2">
                                        {hypotheses.length > 0 && (
                                            <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-[9px] font-bold text-blue-400 uppercase">Hypothesis</span>
                                                    <Lock size={10} className="text-zinc-600" />
                                                </div>
                                                <p className="text-xs text-zinc-300">{hypotheses[0].content}</p>
                                            </div>
                                        )}

                                        {rules.length > 0 && (
                                            <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-lg">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-[9px] font-bold text-red-400 uppercase">Rules</span>
                                                    <Lock size={10} className="text-zinc-600" />
                                                </div>
                                                {rules.slice(0, 2).map((r: ThesisItem) => (
                                                    <p key={r.id} className="text-xs text-zinc-300 mb-1">• {r.content}</p>
                                                ))}
                                            </div>
                                        )}

                                        {hypotheses.length === 0 && rules.length === 0 && (
                                            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-lg">
                                                <p className="text-xs text-zinc-500 italic">No thesis defined yet. Add details in the Notebook.</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Last Update */}
                                    {lastUpdate && (
                                        <div className="flex items-center gap-2 text-[10px] text-zinc-600">
                                            <Clock size={10} />
                                            Last update: {new Date(lastUpdate.createdAt).toLocaleString()}
                                        </div>
                                    )}

                                    {/* Quick Note Input */}
                                    <div className="space-y-2">
                                        <textarea
                                            placeholder="Log observation..."
                                            value={note}
                                            onChange={(e) => setNote(e.target.value)}
                                            rows={2}
                                            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 resize-none"
                                        />
                                        <button
                                            onClick={handleCommitUpdate}
                                            disabled={!note.trim() || isSubmitting}
                                            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-emerald-500 to-emerald-400 text-black font-bold text-xs rounded-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                                        >
                                            <Send size={12} />
                                            {isSubmitting ? 'COMMITTING...' : 'COMMIT TO MISSION'}
                                        </button>
                                        {currentPrice && (
                                            <p className="text-[10px] text-zinc-600 text-center">
                                                Will capture: ${currentPrice.toLocaleString()} @ {new Date().toLocaleTimeString()}
                                            </p>
                                        )}
                                    </div>

                                    {/* Link to Full Notebook */}
                                    <a
                                        href={`/notebook/${selectedMission.id}`}
                                        className="flex items-center justify-center gap-2 py-2 text-xs text-zinc-500 hover:text-white transition-colors border-t border-white/5 pt-3"
                                    >
                                        <BookOpen size={12} />
                                        Open in Notebook (Full Edit)
                                    </a>
                                </>
                            )}

                            {/* Empty State */}
                            {missions.length === 0 && !showCreateForm && !isLoading && (
                                <div className="text-center py-6">
                                    <Target className="mx-auto mb-3 text-zinc-700" size={32} />
                                    <p className="text-xs text-zinc-500 mb-3">
                                        No active missions for {symbol}.
                                        <br />
                                        Missions help track your thesis during live trading.
                                    </p>
                                    <button
                                        onClick={() => setShowCreateForm(true)}
                                        className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-white transition-colors"
                                    >
                                        <Plus size={12} className="inline mr-1" />
                                        Create Lightweight Mission
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
