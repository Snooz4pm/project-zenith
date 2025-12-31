'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import {
    BookOpen, ChevronRight, Save, Plus,
    Type, AlignLeft, Hash, List, Globe, Lock
} from 'lucide-react';
import { getAssetMissions, appendMissionUpdate, createLightweightMission } from '@/lib/actions/notebook';
import { ThesisItem } from '@/lib/types/notebook';
import MarketLog from '@/components/pulse/MarketLog';
import { PulseSignal } from '@/lib/pulse/types';

interface StudyWorkspaceProps {
    symbol: string;
    assetType: 'crypto' | 'stock' | 'forex';
    currentPrice?: number;
    marketSignals?: PulseSignal[]; // Optional: pass signals for context sidebar
}

interface Mission {
    id: string;
    title: string | null;
    status: string;
    thesis: ThesisItem[];
    createdAt: string;
    missionUpdates: { createdAt: string; note: string; price: number | null }[];
}

/**
 * STUDY WORKSPACE (Previously MissionPanel/FlightRecorder)
 * A calm, Notion-like environment for thinking and note-taking.
 */
export default function StudyWorkspace({ symbol, assetType, currentPrice, marketSignals = [] }: StudyWorkspaceProps) {
    const { data: session } = useSession();

    // UI State
    const [isOpen, setIsOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [activeBlockType, setActiveBlockType] = useState<'text' | 'h1' | 'h2' | 'hypothesis'>('text');

    // Data State
    const [currentMission, setCurrentMission] = useState<Mission | null>(null);
    const [editorContent, setEditorContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Auto-load session
    useEffect(() => {
        if (session?.user?.id && symbol) {
            loadLatestSession();
        }
    }, [session?.user?.id, symbol]);

    async function loadLatestSession() {
        if (!session?.user?.id) return;
        setIsLoading(true);
        try {
            const data = await getAssetMissions(session.user.id, symbol);

            // Cast and process data (similar to MissionPanel)
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

            if (typedMissions.length > 0) {
                // Load most recent active or create new
                setCurrentMission(typedMissions[0]);
            } else {
                // Implicitly create a "Study Session" if none exists? 
                // For MVP, we'll just show the creation prompt inline
                setCurrentMission(null);
            }
        } catch (e) {
            console.error("Failed to load study sessions", e);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleStartSession() {
        if (!session?.user?.id) return;
        setIsSaving(true);
        const title = `Study Session - ${new Date().toLocaleDateString()}`;
        const res = await createLightweightMission(session.user.id, symbol, title, undefined, currentPrice);
        if (res.success && res.data) {
            setCurrentMission(res.data as unknown as Mission);
        }
        setIsSaving(false);
    }

    async function handleSaveNote() {
        if (!session?.user?.id || !currentMission || !editorContent.trim()) return;
        setIsSaving(true);
        // Append as an update for now (in future: Block based persistence)
        await appendMissionUpdate(currentMission.id, session.user.id, editorContent, currentPrice, 'study_workspace');
        setEditorContent(''); // Clear after save? Or keep as scratchpad? 
        // For notebook feel, we might want to clear and show in "history" below
        await loadLatestSession();
        setIsSaving(false);
    }

    // Toggle main workspace
    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed right-6 bottom-6 z-40 bg-white text-black px-4 py-3 rounded-full shadow-2xl font-serif italic text-sm hover:scale-105 transition-transform flex items-center gap-2 border border-white/20"
            >
                <BookOpen size={16} />
                Open Study Workspace
            </button>
        );
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="fixed inset-0 z-50 bg-[#0a0a0c]/95 backdrop-blur-xl flex justify-center overflow-hidden"
            >
                {/* Main Canvas Container (Centered, Notion-width) */}
                <div className="w-full max-w-4xl h-full flex flex-col relative bg-[#0a0a0c] shadow-2xl border-x border-white/5">

                    {/* Header */}
                    <header className="h-14 flex items-center justify-between px-6 border-b border-white/5">
                        <div className="flex items-center gap-3 text-zinc-400">
                            <button onClick={() => setIsOpen(false)} className="hover:text-white transition-colors">
                                <ChevronRight className="rotate-180" size={18} />
                            </button>
                            <span className="text-sm font-medium text-zinc-500">/</span>
                            <span className="text-sm font-medium text-white">{symbol}</span>
                            <span className="text-sm font-medium text-zinc-500">/</span>
                            <span className="text-sm font-medium text-zinc-300">Study Session</span>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="text-xs text-zinc-500 font-mono">
                                {isSaving ? 'Saving...' : 'Auto-saved'}
                            </span>
                            <button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className={`p-2 rounded-md transition-colors ${isSidebarOpen ? 'text-blue-400 bg-blue-500/10' : 'text-zinc-500 hover:text-white'}`}
                                title="Toggle Context Sidebar"
                            >
                                <Globe size={16} />
                            </button>
                        </div>
                    </header>

                    <div className="flex flex-1 overflow-hidden">
                        {/* LEFT: The Canvas */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <div className="max-w-2xl mx-auto py-12 px-8 min-h-full">

                                {!currentMission ? (
                                    <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4">
                                        <BookOpen size={48} className="text-zinc-700 mb-2" />
                                        <h2 className="text-xl font-serif text-zinc-300">Start thinking.</h2>
                                        <p className="text-zinc-500 text-sm max-w-xs">
                                            Create a new study session for {symbol}. No pressure, just notes.
                                        </p>
                                        <button
                                            onClick={handleStartSession}
                                            disabled={isLoading}
                                            className="px-6 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-zinc-200 transition-colors"
                                        >
                                            Begin Session
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-8 animate-in fade-in duration-500">
                                        {/* Title Area */}
                                        <div className="group relative">
                                            <h1 className="text-4xl font-serif text-white placeholder-zinc-700 outline-none bg-transparent w-full">
                                                {currentMission.title || 'Untitled Session'}
                                            </h1>
                                            <div className="text-xs text-zinc-600 mt-2 font-mono">
                                                Started {new Date(currentMission.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>

                                        {/* History / Previous Blocks */}
                                        <div className="space-y-6">
                                            {currentMission.missionUpdates.map((update, idx) => (
                                                <div key={idx} className="group relative pl-4 border-l-2 border-zinc-800 hover:border-zinc-700 transition-colors py-1">
                                                    <div className="text-zinc-300 text-base leading-relaxed whitespace-pre-wrap font-serif">
                                                        {update.note}
                                                    </div>
                                                    <div className="text-[10px] text-zinc-600 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {new Date(update.createdAt).toLocaleTimeString()}
                                                        {update.price && ` • $${update.price}`}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Active Editor Block */}
                                        <div className="relative">
                                            <textarea
                                                className="w-full bg-transparent text-lg text-zinc-200 placeholder-zinc-700 resize-none outline-none font-serif leading-relaxed min-h-[150px]"
                                                placeholder="Type '/' for commands..."
                                                value={editorContent}
                                                onChange={(e) => setEditorContent(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                                        handleSaveNote();
                                                    }
                                                }}
                                                autoFocus
                                            />

                                            {/* Block Controls (Simple) */}
                                            <div className="absolute -left-12 top-1 flex flex-col gap-1 opacity-20 hover:opacity-100 transition-opacity">
                                                <button className="p-1.5 hover:bg-white/10 rounded text-zinc-400" title="Text">
                                                    <AlignLeft size={14} />
                                                </button>
                                                <button className="p-1.5 hover:bg-white/10 rounded text-zinc-400" title="Heading">
                                                    <Type size={14} />
                                                </button>
                                                <button className="p-1.5 hover:bg-white/10 rounded text-zinc-400" title="Hypothesis">
                                                    <Lock size={14} />
                                                </button>
                                            </div>

                                            {/* Action Bar */}
                                            {editorContent.trim() && (
                                                <div className="flex justify-end pt-2">
                                                    <button
                                                        onClick={handleSaveNote}
                                                        className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs transition-all"
                                                    >
                                                        Save Block <span className="text-zinc-500 text-[10px] ml-1">⌘+Enter</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT: Context Sidebar (Market Pulse) */}
                        <AnimatePresence>
                            {isSidebarOpen && (
                                <motion.div
                                    initial={{ width: 0, opacity: 0 }}
                                    animate={{ width: 320, opacity: 1 }}
                                    exit={{ width: 0, opacity: 0 }}
                                    className="border-l border-white/5 bg-[#0a0a0c]"
                                >
                                    <div className="p-4 h-full overflow-y-auto">
                                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">
                                            Live Context
                                        </h3>

                                        {/* Market Pulse Feed */}
                                        <div className="mb-8">
                                            <h4 className="flex items-center gap-2 text-xs text-zinc-400 mb-2">
                                                <Globe size={12} />
                                                Market Pulse
                                            </h4>
                                            <div className="bg-zinc-900/50 rounded-lg p-2 border border-white/5 min-h-[200px]">
                                                <MarketLog signals={marketSignals} maxVisible={10} />
                                            </div>
                                        </div>

                                        {/* Future: Signals, News, Etc */}
                                        <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-lg">
                                            <p className="text-xs text-zinc-400 text-center italic">
                                                "Only the disciplined mind is free."
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
