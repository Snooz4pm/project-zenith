'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Note {
    id: string;
    title: string;
    timestamp: string;
}

export default function NotesSnapshotTile() {
    const [recentNotes, setRecentNotes] = useState<Note[]>([]);

    useEffect(() => {
        // Fetch real latest notes from DB
        // For now: sample data
        const sampleNotes: Note[] = [
            { id: '1', title: 'ETH breakout analysis', timestamp: '2h ago' },
            { id: '2', title: 'Risk management rules', timestamp: '1d ago' },
            { id: '3', title: 'Trade journal - week 4', timestamp: '3d ago' },
        ];
        setRecentNotes(sampleNotes.slice(0, 3));
    }, []);

    return (
        <Link href="/notebook" className="block h-full">
            <div className="h-full bg-black border border-white/[0.06] rounded-lg p-5 flex flex-col hover:border-emerald-500/20 transition-colors">
                <div className="mb-4">
                    <h3 className="text-sm font-medium text-white mb-1">Notes</h3>
                    <p className="text-xs text-zinc-500">Latest thoughts</p>
                </div>

                <div className="flex-1 overflow-auto space-y-3">
                    {recentNotes.length === 0 ? (
                        <p className="text-xs text-zinc-600">No notes yet</p>
                    ) : (
                        recentNotes.map((note) => (
                            <div key={note.id} className="border-l-2 border-zinc-800 pl-3 hover:border-emerald-500/30 transition-colors">
                                <div className="text-sm font-medium text-white truncate">{note.title}</div>
                                <div className="text-xs text-zinc-500 mt-0.5">{note.timestamp}</div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </Link>
    );
}
