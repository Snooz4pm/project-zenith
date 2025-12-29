'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, X, FileText, Loader2, Trash2 } from 'lucide-react';

interface Note {
    id: number;
    content: string;
    asset: string;
    createdAt: string;
}

export default function MiniJournal({ symbol }: { symbol: string }) {
    const [notes, setNotes] = useState<Note[]>([]);
    const [newNote, setNewNote] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadNotes();
    }, [symbol]);

    const loadNotes = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/notes');
            if (res.ok) {
                const data = await res.json();
                // Client-side filter because API might return all
                // Ideally API should support ?asset=SYMBOL
                const allNotes: Note[] = data.notes || [];
                const assetNotes = allNotes.filter(n =>
                    n.asset === symbol ||
                    n.asset === `$${symbol}` ||
                    (n.asset && n.asset.toUpperCase().includes(symbol.toUpperCase()))
                );
                setNotes(assetNotes);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const addNote = async () => {
        if (!newNote.trim()) return;
        setSaving(true);
        try {
            const res = await fetch('/api/notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: newNote,
                    asset: symbol,
                    phase: 'Analysis', // Default
                    sentiment: 'Neutral' // Default
                })
            });

            if (res.ok) {
                const data = await res.json();
                setNotes([data.note, ...notes]);
                setNewNote('');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    const deleteNote = async (id: number) => {
        try {
            const res = await fetch(`/api/notes/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setNotes(notes.filter(n => n.id !== id));
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] flex flex-col h-full min-h-[300px]">
            <div className="flex items-center gap-2 mb-4">
                <FileText size={14} className="text-amber-400" />
                <span className="text-xs text-amber-400 uppercase tracking-wide">Journal: {symbol}</span>
            </div>

            {/* Input */}
            <div className="mb-4">
                <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Quick observation..."
                    className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 resize-none h-20"
                />
                <div className="flex justify-end mt-2">
                    <button
                        onClick={addNote}
                        disabled={!newNote.trim() || saving}
                        className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[10px] font-bold rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                    >
                        {saving ? <Loader2 size={10} className="animate-spin" /> : <Save size={10} />}
                        Save Note
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar max-h-[300px]">
                {loading ? (
                    <div className="text-center py-4 text-xs text-gray-600">Loading notes...</div>
                ) : notes.length === 0 ? (
                    <div className="text-center py-4 text-xs text-gray-600 italic">No notes for this asset yet.</div>
                ) : (
                    <AnimatePresence>
                        {notes.map(note => (
                            <motion.div
                                key={note.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, height: 0 }}
                                className="p-3 bg-white/5 rounded-lg border border-white/5 group relative"
                            >
                                <button
                                    onClick={() => deleteNote(note.id)}
                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity"
                                >
                                    <Trash2 size={10} />
                                </button>
                                <p className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed pr-4">{note.content}</p>
                                <div className="mt-2 text-[10px] text-gray-600">
                                    {new Date(note.createdAt).toLocaleDateString()}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}
