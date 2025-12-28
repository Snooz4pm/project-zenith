'use client';

import { useState, useEffect } from 'react';
import { Book, ArrowUpRight, FolderOpen } from 'lucide-react';
import { motion } from 'framer-motion';

interface NotebookTileProps {
    onClick: () => void;
}

export default function NotebookTile({ onClick }: NotebookTileProps) {
    const [entryCount, setEntryCount] = useState(0);

    useEffect(() => {
        // In a real app we would fetch the count of journal entries
        // For now we can just show a static number or fetch if API exists
        setEntryCount(12);
    }, []);

    return (
        <motion.div
            className="col-span-1 row-span-1 relative overflow-hidden rounded-2xl bg-[#0a0a12] border border-white/5 p-5 transition-all duration-300 hover:border-white/10 hover:shadow-lg hover:shadow-yellow-500/5 group cursor-pointer flex flex-col h-full"
            onClick={onClick}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
        >
            {/* Dynamic Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">
                        <Book className="w-5 h-5" />
                    </div>
                    <span className="font-semibold text-white">Journal</span>
                </div>
                <button className="text-zinc-500 hover:text-white transition-colors">
                    <ArrowUpRight className="w-4 h-4" />
                </button>
            </div>

            <div className="relative z-10 flex-1 flex flex-col justify-end">
                <div className="mb-2 flex justify-between items-end">
                    <span className="text-2xl font-bold text-white">{entryCount}</span>
                    <span className="text-xs text-yellow-400 font-medium mb-1">Entries</span>
                </div>

                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-3">
                    <motion.div
                        className="h-full bg-yellow-400 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: '60%' }} // Mock progress or usage
                        transition={{ duration: 1, ease: 'easeOut' }}
                    />
                </div>

                <p className="text-xs text-zinc-400 truncate flex items-center gap-1.5">
                    <FolderOpen className="w-3 h-3 text-yellow-500/70" />
                    Latest: "Market Structure Shift"
                </p>
            </div>
        </motion.div>
    );
}
