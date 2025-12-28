'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Book, ChevronRight, Zap, Target } from 'lucide-react';
import { createJournalEntry } from '@/lib/actions/notebook';
import { useSession } from 'next-auth/react';

export default function NewJournalPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const [title, setTitle] = useState('');
    const [asset, setAsset] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !session?.user?.id) return;

        setIsSubmitting(true);
        // Simulate grabbing live market context (VIX, etc. would come from context provider)
        const dummyContext = { vix: 14.5, regime: 'BULL_TREND', session: 'NY' };

        const res = await createJournalEntry(session.user.id, title, asset.toUpperCase(), dummyContext);

        if (res.success && res.data) {
            router.push(`/notebook/${res.data.id}`);
        } else {
            console.error(res.error);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-lg"
            >
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10">
                        <Book className="w-6 h-6 text-emerald-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-white font-display uppercase tracking-tight">Initialize Flight Log</h1>
                    <p className="text-zinc-500 text-sm mt-2">Begin a new structured trading operation.</p>
                </div>

                <form onSubmit={handleSubmit} className="bg-white/[0.02] border border-white/5 rounded-2xl p-8 space-y-6">
                    <div>
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Operation Name / Thesis Title</label>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Long EURUSD on Liquidity Sweep"
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-700 outline-none focus:border-emerald-500/50 transition-all font-medium"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Target Asset (Optional)</label>
                        <div className="relative">
                            <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                            <input
                                value={asset}
                                onChange={(e) => setAsset(e.target.value)}
                                placeholder="AAPL"
                                className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-zinc-700 outline-none focus:border-emerald-500/50 transition-all font-mono uppercase"
                            />
                        </div>
                    </div>

                    <button
                        disabled={!title.trim() || isSubmitting}
                        className="w-full py-4 bg-emerald-500 text-black font-bold text-sm rounded-xl hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <span className="animate-pulse">Initializing...</span>
                        ) : (
                            <>Initialize Recorder <ChevronRight className="w-4 h-4" /></>
                        )}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
