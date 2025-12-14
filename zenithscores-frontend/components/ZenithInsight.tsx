'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateInsight } from '@/lib/zenith';
import { Lightbulb } from 'lucide-react';

interface Token {
    symbol: string;
    zenith_score: number;
    price_change_24h: number;
    volume_24h: number;
}

export default function ZenithInsight({ tokens }: { tokens: Token[] }) {
    const [index, setIndex] = useState(0);

    // Filter for interesting tokens (Score > 60)
    const interestingTokens = tokens.filter(t => t.zenith_score >= 60).slice(0, 5);
    // Fallback to top 3 if none match
    const displayTokens = interestingTokens.length > 0 ? interestingTokens : tokens.slice(0, 3);

    useEffect(() => {
        if (displayTokens.length <= 1) return;
        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % displayTokens.length);
        }, 5000); // Rotate every 5 seconds
        return () => clearInterval(timer);
    }, [displayTokens.length]);

    if (displayTokens.length === 0) return null;

    const currentToken = displayTokens[index];
    const insight = generateInsight(currentToken);

    return (
        <div className="w-full bg-blue-900/10 border-y border-blue-500/20 mb-8 backdrop-blur-sm">
            <div className="container mx-auto px-6 py-3 flex items-center gap-3">
                <Lightbulb className="text-yellow-400 w-5 h-5 flex-shrink-0" />
                <div className="overflow-hidden relative flex-1 h-6">
                    <AnimatePresence mode='wait'>
                        <motion.div
                            key={currentToken.symbol}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -20, opacity: 0 }}
                            transition={{ duration: 0.5 }}
                            className="text-sm text-blue-100 font-medium truncate"
                        >
                            <span className="font-bold text-blue-300 mr-2">Zenith Insight:</span>
                            {insight}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
