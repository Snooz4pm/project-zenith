'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Book, Plus, Search, Filter, Clock,
    Terminal, Shield, AlertTriangle, CheckCircle,
    ChevronRight, Lock, Trash2
} from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { getUserJournals, deleteJournal } from '@/lib/actions/notebook'; // We'll implement this hook/action connection

export default function NotebookPage() {
    const { data: session } = useSession();
    const [journals, setJournals] = useState<any[]>([]);
    const [notes, setNotes] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            if (session?.user?.id) {
                // Fetch journals
                const journalData = await getUserJournals(session.user.id);
                setJournals(journalData);

                // Fetch course notes
                try {
                    const notesResponse = await fetch('/api/notes');
                    if (notesResponse.ok) {
                        const notesData = await notesResponse.json();
                        setNotes(notesData.data || []);
                    }
                } catch (error) {
                    console.error('Failed to fetch notes:', error);
                }

                setIsLoading(false);
            }
        }
        fetchData();
    }, [session]);

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-zinc-300 font-sans selection:bg-emerald-500/30 selection:text-emerald-200">

            {/* Top Bar */}
            <header className="h-16 border-b border-white/5 bg-[#0a0a0c]/80 backdrop-blur-xl sticky top-0 z-40 px-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Book className="w-5 h-5 text-emerald-500" />
                    <h1 className="text-sm font-bold tracking-tight text-white uppercase font-display">
                        Trader's Flight Recorder <span className="text-zinc-600 font-normal ml-2">/ CLASSIFIED</span>
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <Link href="/notebook/new">
                        <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold text-white transition-all">
                            <Plus className="w-3 h-3" /> NEW ENTRY
                        </button>
                    </Link>
                </div>
            </header>

            {/* Main Grid */}
            <main className="max-w-7xl mx-auto px-6 py-12">

                {/* Course Notes Section */}
                {notes.length > 0 && (
                    <div className="mb-12">
                        <div className="flex items-center gap-3 mb-6">
                            <Book className="w-5 h-5 text-blue-400" />
                            <h2 className="text-lg font-bold text-white">Course Notes</h2>
                            <span className="text-xs text-zinc-500">({notes.length})</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {notes.map((note) => (
                                <motion.div
                                    key={note.id}
                                    whileHover={{ y: -2 }}
                                    className="p-5 rounded-xl bg-gradient-to-br from-blue-500/[0.05] to-transparent border border-blue-500/10 hover:border-blue-500/30 transition-all"
                                >
                                    <div className="text-[10px] font-mono text-zinc-500 mb-2">
                                        {new Date(note.createdAt).toLocaleDateString()} · {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    {note.asset && (
                                        <div className="inline-block px-2 py-0.5 rounded bg-blue-500/10 text-[10px] font-mono text-blue-400 border border-blue-500/20 mb-3">
                                            {note.asset.replace('COURSE-', '')}
                                        </div>
                                    )}
                                    <div className="text-sm text-zinc-300 line-clamp-4 whitespace-pre-wrap">
                                        {note.content}
                                    </div>
                                    {note.phase && (
                                        <div className="mt-3 text-xs text-zinc-500">
                                            {note.phase}
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Trading Journals Section */}
                {journals.length > 0 && (
                    <div className="mb-6">
                        <div className="flex items-center gap-3 mb-6">
                            <Terminal className="w-5 h-5 text-emerald-400" />
                            <h2 className="text-lg font-bold text-white">Trading Journals</h2>
                            <span className="text-xs text-zinc-500">({journals.length})</span>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && journals.length === 0 && notes.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                        <Terminal className="w-12 h-12 text-zinc-700 mb-4" />
                        <h3 className="text-lg font-bold text-white mb-2">No Flight Logs Found</h3>
                        <p className="text-zinc-500 text-sm max-w-md text-center mb-6">
                            Professional traders record their state of mind before pulling the trigger. Capture your first observation now.
                        </p>
                        <Link href="/notebook/new">
                            <button className="px-6 py-3 bg-emerald-500 text-black font-bold text-sm rounded-xl hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                                Initialize Log
                            </button>
                        </Link>
                    </div>
                )}

                {/* Journal Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {journals.map((journal) => (
                        <div key={journal.id} className="relative group">
                            <Link href={`/notebook/${journal.id}`}>
                                <motion.div
                                    whileHover={{ y: -2 }}
                                    className="h-64 p-6 rounded-xl bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 hover:border-emerald-500/30 transition-all overflow-hidden flex flex-col justify-between"
                                >
                                    {/* Status Badge */}
                                    <div className="absolute top-6 right-6">
                                        <StatusBadge status={journal.status} />
                                    </div>

                                    {/* Content */}
                                    <div className="flex flex-col h-full justify-between">
                                        <div>
                                            <div className="text-[10px] font-mono text-zinc-500 mb-2">
                                                {new Date(journal.createdAt).toLocaleDateString()} &middot; {new Date(journal.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors pr-10">
                                                {journal.title || "Untitled Operation"}
                                            </h3>
                                            {journal.assetSymbol && (
                                                <span className="inline-block px-2 py-0.5 rounded bg-white/5 text-[10px] font-mono text-zinc-400 border border-white/5">
                                                    {journal.assetSymbol}
                                                </span>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <div className="h-[1px] w-full bg-white/5" />
                                            <div className="flex items-center justify-between text-xs text-zinc-500">
                                                <span className="flex items-center gap-1">
                                                    <Terminal className="w-3 h-3" /> {(journal.liveLog as any[])?.length || 0} Log Entries
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </Link>

                            {/* Delete Button - Positioned absolute to avoid Link wrapping issues */}
                            <button
                                onClick={async (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (confirm('Are you sure you want to delete this journal entry?')) {
                                        await deleteJournal(journal.id, session?.user?.id as string);
                                        // Specific Optimistic UI update could go here, but revalidatePath usually handles it fast enough
                                        setJournals(prev => prev.filter(j => j.id !== journal.id));
                                    }
                                }}
                                className="absolute bottom-6 right-6 p-2 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100 z-10"
                                title="Delete Entry"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>

            </main>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles: any = {
        'BRIEFING': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        'LIVE': 'bg-red-500/10 text-red-500 border-red-500/20 animate-pulse',
        'DEBRIEF': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        'ARCHIVED': 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
    };

    return (
        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${styles[status] || styles['ARCHIVED']}`}>
            {status}
        </span>
    );
}
