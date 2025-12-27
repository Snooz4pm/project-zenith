
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Sparkles, AlertCircle } from 'lucide-react';

interface JournalModalProps {
    isOpen: boolean;
    onClose: () => void;
    symbol: string;
    aiContext?: string | null;
}

export default function JournalModal({ isOpen, onClose, symbol, aiContext }: JournalModalProps) {
    const [content, setContent] = useState('');
    const [sentiment, setSentiment] = useState<'Bullish' | 'Bearish' | 'Neutral'>('Neutral');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleImportAI = () => {
        if (aiContext) {
            setContent(prev => prev + (prev ? '\n\n' : '') + `**AI Market Context:**\n${aiContext}`);
        }
    };

    const handleSave = async () => {
        if (!content.trim()) return;
        setSaving(true);
        setError(null);

        try {
            const res = await fetch('/api/journal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    asset: symbol,
                    content,
                    sentiment,
                    phase: 'Analysis',
                    metadata: { aiImported: !!aiContext }
                })
            });

            if (res.ok) {
                setContent('');
                onClose();
            } else {
                const data = await res.json();
                setError(data.error || 'Failed to save');
            }
        } catch (e) {
            setError('Network error');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full max-w-lg bg-[#0a0a0f] border border-white/10 rounded-xl shadow-2xl flex flex-col"
                >
                    {/* Header */}
                    <div className="p-4 border-b border-white/10 flex items-center justify-between">
                        <h3 className="text-lg font-bold text-white">Journal Entry: {symbol}</h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
                    </div>

                    {/* Body */}
                    <div className="p-4 space-y-4">
                        {/* Sentiment */}
                        <div className="flex gap-2">
                            {['Bullish', 'Neutral', 'Bearish'].map(s => (
                                <button
                                    key={s}
                                    onClick={() => setSentiment(s as any)}
                                    className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${sentiment === s
                                            ? s === 'Bullish' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                                                : s === 'Bearish' ? 'bg-red-500/20 border-red-500 text-red-400'
                                                    : 'bg-gray-500/20 border-gray-500 text-gray-300'
                                            : 'border-white/5 hover:bg-white/5 text-gray-500'
                                        }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>

                        {/* Import AI */}
                        {aiContext && (
                            <button
                                onClick={handleImportAI}
                                className="w-full py-2 flex items-center justify-center gap-2 text-xs text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-lg transition-colors"
                            >
                                <Sparkles size={12} />
                                Import AI Analysis as Note
                            </button>
                        )}

                        {/* Textarea */}
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="What are you seeing? Capture your learning..."
                            className="w-full h-40 bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/30 resize-none"
                        />

                        {error && (
                            <div className="flex items-center gap-2 text-red-400 text-xs">
                                <AlertCircle size={12} />
                                {error} (Are you logged in?)
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-white/10 flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={saving || !content.trim()}
                            className="px-4 py-2 bg-white text-black font-semibold rounded-lg text-sm hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {saving ? 'Saving...' : <><Save size={16} /> Save Entry</>}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
