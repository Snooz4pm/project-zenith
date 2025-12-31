'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Lock, Unlock, Terminal, Save, CheckCircle,
    AlertTriangle, Play, ChevronRight, Hash, MessageSquare
} from 'lucide-react';
import { ThesisItem, LogEntry, JournalStatus } from '@/lib/types/notebook';
import { updateJournalThesis, appendLiveLog, updateJournalStatus } from '@/lib/actions/notebook';

interface EditorProps {
    journal: any; // Ideally typed stricter
    userId: string;
}

export default function JournalEditor({ journal, userId }: EditorProps) {
    const [status, setStatus] = useState<JournalStatus>(journal.status);
    const [thesis, setThesis] = useState<ThesisItem[]>(journal.thesis || []);
    const [liveLog, setLiveLog] = useState<LogEntry[]>(journal.liveLog || []);

    // Autosave indicator state
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

    // Debounce timer ref for thesis updates
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const saveStatusTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Debounced thesis save function with status indicator
    const debouncedSaveThesis = useCallback((newThesis: ThesisItem[]) => {
        // Clear any existing timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Show "saving" status immediately when user starts typing
        setSaveStatus('saving');

        // Set new timer - save after 1 second of inactivity
        debounceTimerRef.current = setTimeout(async () => {
            try {
                await updateJournalThesis(journal.id, userId, newThesis);
                setSaveStatus('saved');

                // Clear "saved" status after 2 seconds
                if (saveStatusTimerRef.current) {
                    clearTimeout(saveStatusTimerRef.current);
                }
                saveStatusTimerRef.current = setTimeout(() => {
                    setSaveStatus('idle');
                }, 2000);
            } catch (error) {
                console.error('Failed to save thesis:', error);
                setSaveStatus('idle'); // Reset on error
            }
        }, 1000);
    }, [journal.id, userId]);

    // Cleanup timers on unmount
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
            if (saveStatusTimerRef.current) {
                clearTimeout(saveStatusTimerRef.current);
            }
        };
    }, []);

    // -- Actions --

    const handleLockBriefing = async () => {
        if (status !== 'BRIEFING') return;

        // Flush any pending thesis save before locking
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
            setSaveStatus('saving');
            await updateJournalThesis(journal.id, userId, thesis);
            setSaveStatus('saved');
        }

        setStatus('LIVE');
        await updateJournalStatus(journal.id, userId, 'LIVE');
    };

    const handleEndMission = async () => {
        if (status !== 'LIVE') return;
        setStatus('DEBRIEF');
        await updateJournalStatus(journal.id, userId, 'DEBRIEF');
    };

    // -- Render Logic based on Mode --

    return (
        <div className="max-w-4xl mx-auto px-6 py-12">

            {/* Header / Status Bar */}
            <header className="flex items-center justify-between mb-12 border-b border-white/5 pb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-bold text-white tracking-tight font-display">{journal.title}</h1>
                        {/* Autosave Indicator */}
                        {saveStatus === 'saving' && (
                            <span className="text-[10px] text-amber-500 flex items-center gap-1 animate-pulse">
                                <Save className="w-3 h-3" /> Saving...
                            </span>
                        )}
                        {saveStatus === 'saved' && (
                            <span className="text-[10px] text-emerald-500 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> Saved
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono text-zinc-500">
                        <span className="bg-white/5 px-2 py-1 rounded border border-white/5">{journal.assetSymbol || 'NO ASSET'}</span>
                        <span>{new Date(journal.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <ModeToggle status={status} onLock={handleLockBriefing} onEnd={handleEndMission} />
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                {/* LEFT: THESIS (The Plan) */}
                <div className="lg:col-span-12 xl:col-span-7 space-y-8">
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                <Hash className="w-3 h-3" /> Mission Briefing
                            </h3>
                            {status === 'BRIEFING' && <span className="text-[10px] text-emerald-500 animate-pulse">● EDITING ACTIVE</span>}
                            {status !== 'BRIEFING' && <span className="text-[10px] text-zinc-600 flex items-center gap-1"><Lock className="w-3 h-3" /> LOCKED</span>}
                        </div>

                        <ThesisEditor
                            initialData={thesis}
                            readOnly={status !== 'BRIEFING'}
                            onChange={(newThesis: ThesisItem[]) => {
                                setThesis(newThesis);
                                // Use debounced save instead of immediate save
                                debouncedSaveThesis(newThesis);
                            }}
                        />
                    </section>
                </div>

                {/* RIGHT: FLIGHT RECORDER (Live Log) */}
                <div className="lg:col-span-12 xl:col-span-5">
                    <div className="sticky top-24">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                <Terminal className="w-3 h-3" /> Flight Recorder
                            </h3>
                            {status === 'LIVE' && <span className="text-[10px] text-emerald-500 animate-pulse">● RECORDING</span>}
                        </div>

                        <div className="h-[600px] flex flex-col bg-[#050505] border border-white/10 rounded-xl overflow-hidden relative">
                            {/* CRT Scanline Effect */}
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] z-20 pointer-events-none bg-[length:100%_2px,3px_100%] opacity-20" />

                            {/* Log Stream */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs">
                                {liveLog.length === 0 && (
                                    <div className="text-zinc-700 italic text-center mt-20">Waiting for telemetry...</div>
                                )}
                                {liveLog.map(entry => (
                                    <div key={entry.id} className="flex gap-3">
                                        <span className="text-zinc-600 shrink-0 select-none">
                                            {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                        </span>
                                        <span className={`${entry.sentiment === 'fear' ? 'text-red-400' :
                                            entry.sentiment === 'confidence' ? 'text-emerald-400' :
                                                'text-zinc-300'
                                            }`}>
                                            {entry.content}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Command Input */}
                            {status !== 'ARCHIVED' && (
                                <div className="p-3 border-t border-white/10 bg-white/[0.02]">
                                    <LogInput
                                        onSubmit={async (text: string, sentiment: any) => {
                                            const entry: LogEntry = {
                                                id: crypto.randomUUID(),
                                                timestamp: new Date().toISOString(),
                                                content: text,
                                                sentiment
                                            };
                                            const newLog = [...liveLog, entry];
                                            setLiveLog(newLog);
                                            await appendLiveLog(journal.id, userId, entry);
                                        }}
                                        disabled={false} // Always define input even if readOnly logic handles suppression
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

// -- Sub-Components --

function ModeToggle({ status, onLock, onEnd }: any) {
    if (status === 'BRIEFING') {
        return (
            <button onClick={onLock} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-black font-bold text-xs rounded-lg hover:bg-emerald-400 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                <Lock className="w-3 h-3" /> COMMIT TO MISSION
            </button>
        );
    }
    if (status === 'LIVE') {
        return (
            <button onClick={onEnd} className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-white font-bold text-xs rounded-lg hover:bg-zinc-700 transition-all border border-white/10">
                <CheckCircle className="w-3 h-3" /> END MISSION & DEBRIEF
            </button>
        );
    }
    return (
        <span className="px-3 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded text-[10px] font-bold uppercase">
            DEBRIEF MODE
        </span>
    );
}

function ThesisEditor({ initialData, readOnly, onChange }: any) {
    const [items, setItems] = useState<ThesisItem[]>(initialData);

    const addItem = (type: any) => {
        const newItem: ThesisItem = { id: crypto.randomUUID(), type, content: '', conviction: 50 };
        const updated = [...items, newItem];
        setItems(updated);
        onChange(updated);
    };

    const updateItem = (id: string, updates: Partial<ThesisItem>) => {
        const updated = items.map(i => i.id === id ? { ...i, ...updates } : i);
        setItems(updated);
        onChange(updated); // In real app, debounce this part
    };

    const deleteItem = (id: string) => {
        const updated = items.filter(i => i.id !== id);
        setItems(updated);
        onChange(updated);
    };

    return (
        <div className="space-y-4">
            {items.map(item => (
                <div key={item.id} className="group relative flex gap-4">
                    {/* Semantic Type Marker */}
                    <div className={`w-1 shrink-0 rounded-full ${item.type === 'hypothesis' ? 'bg-blue-500 dashed-border' :
                        item.type === 'fact' ? 'bg-white' :
                            item.type === 'rule' ? 'bg-red-500' : 'bg-purple-500'
                        }`} />

                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[9px] font-bold uppercase tracking-wider ${item.type === 'hypothesis' ? 'text-blue-500' :
                                item.type === 'fact' ? 'text-white' :
                                    item.type === 'rule' ? 'text-red-500' : 'text-purple-500'
                                }`}>[{item.type}]</span>
                        </div>

                        {readOnly ? (
                            <p className={`text-sm ${item.type === 'fact' ? 'text-white font-medium' : 'text-zinc-400'}`}>
                                {item.content || <span className="italic text-zinc-600">Empty block...</span>}
                            </p>
                        ) : (
                            <textarea
                                value={item.content}
                                onChange={(e) => updateItem(item.id, { content: e.target.value })}
                                placeholder="Enter operational detail..."
                                className="w-full bg-transparent border-none p-0 text-sm text-zinc-300 focus:ring-0 placeholder-zinc-700 resize-none h-auto"
                                rows={2}
                            />
                        )}

                        {!readOnly && (
                            <button onClick={() => deleteItem(item.id)} className="absolute -right-8 top-0 p-2 text-zinc-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                ×
                            </button>
                        )}
                    </div>
                </div>
            ))}

            {!readOnly && (
                <div className="flex gap-2 mt-6 pt-4 border-t border-white/5">
                    <button onClick={() => addItem('fact')} className="text-[10px] px-3 py-1.5 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded transition-all">+ FACT</button>
                    <button onClick={() => addItem('hypothesis')} className="text-[10px] px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded transition-all">+ HYPOTHESIS</button>
                    <button onClick={() => addItem('rule')} className="text-[10px] px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded transition-all">+ RULE</button>
                    <button onClick={() => addItem('intuition')} className="text-[10px] px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded transition-all">+ INTUITION</button>
                </div>
            )}
        </div>
    );
}

function LogInput({ onSubmit, disabled }: any) {
    const [text, setText] = useState('');

    const handleSend = (e: any) => {
        e.preventDefault();
        if (!text.trim()) return;

        // Simple sentiment deduction for proto
        let sentiment: 'neutral' | 'fear' | 'confidence' = 'neutral';
        if (text.includes('fear') || text.includes('panic') || text.includes('stop')) sentiment = 'fear';
        if (text.includes('confident') || text.includes('good') || text.includes('target')) sentiment = 'confidence';

        onSubmit(text, sentiment);
        setText('');
    };

    return (
        <form onSubmit={handleSend} className="flex gap-2">
            <span className="text-emerald-500 font-mono py-2">{'>'}</span>
            <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Log State..."
                className="flex-1 bg-transparent border-none text-xs font-mono text-emerald-100 placeholder-emerald-900/50 focus:ring-0"
                autoFocus
                disabled={disabled}
            />
        </form>
    );
}
