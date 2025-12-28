'use client';

import { useState, useEffect } from 'react';
import { FileText, ArrowUpRight, Plus, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface NotesTileProps {
    onClick: () => void;
}

export default function NotesTile({ onClick }: NotesTileProps) {
    const [lastNote, setLastNote] = useState('Watch TSLA support at $248...');
    const [lastNoteTime, setLastNoteTime] = useState('3h ago');

    useEffect(() => {
        // In production, fetch from localStorage or API
        const savedNote = localStorage.getItem('zenith_last_note');
        const savedTime = localStorage.getItem('zenith_last_note_time');
        if (savedNote) setLastNote(savedNote);
        if (savedTime) setLastNoteTime(savedTime);
    }, []);

    const handleAddNote = (e: React.MouseEvent) => {
        e.stopPropagation();
        onClick();
    };

    return (
        <motion.div
            className="md:col-span-2 row-span-1 relative overflow-hidden rounded-2xl bg-[#0a0a12] border border-white/5 p-5 transition-all duration-300 hover:border-white/10 hover:shadow-lg hover:shadow-yellow-500/5 group cursor-pointer flex flex-col h-full"
            onClick={onClick}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
        >
            {/* Dynamic Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-500">
                        <FileText className="w-5 h-5" />
                    </div>
                    <span className="font-semibold text-white">Notes</span>
                </div>
                <button
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all"
                    onClick={handleAddNote}
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>

            <div className="relative z-10 flex-1 flex flex-col">
                {lastNote ? (
                    <div className="flex-1 bg-yellow-500/5 border border-yellow-500/10 rounded-xl p-3 relative group/note">
                        <p className="text-sm text-zinc-300 italic line-clamp-2">"{lastNote}"</p>
                        <div className="absolute bottom-2 right-3 flex items-center gap-1 text-[10px] text-zinc-500">
                            <Clock className="w-3 h-3" /> {lastNoteTime}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
                        <FileText className="w-6 h-6 mb-2 opacity-50" />
                        <span className="text-xs">No notes yet</span>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
