'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Book, Plus, Search, Filter, Clock,
    Terminal, Shield, AlertTriangle, CheckCircle,
    ChevronRight, Lock
} from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { getUserJournals } from '@/lib/actions/notebook'; // We'll implement this hook/action connection

export default function NotebookPage() {
    const { data: session } = useSession();
    const [journals, setJournals] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchDocs() {
            if (session?.user?.id) {
                const data = await getUserJournals(session.user.id);
                setJournals(data);
                setIsLoading(false);
            }
        }
        fetchDocs();
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

                {/* Empty State */}
                {!isLoading && journals.length === 0 && (
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
                        <Link href={`/notebook/${journal.id}`} key={journal.id}>
                            <motion.div
                                whileHover={{ y: -2 }}
                                className="group relative h-64 p-6 rounded-xl bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 hover:border-emerald-500/30 transition-all overflow-hidden"
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
                                        <h3 className="text-lg font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors">
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
