'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bot, Send, Zap, Crown, Brain, TrendingUp, TrendingDown,
    AlertTriangle, Sparkles, MessageSquare, X, Minimize2, Maximize2
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { isPremiumUser } from '@/lib/premium';

interface ChatMessage {
    id: string;
    role: 'user' | 'coach';
    content: string;
    timestamp: Date;
    type?: 'analysis' | 'tip' | 'warning' | 'praise';
}

interface CoachContext {
    recentTrades?: { symbol: string; pnl: number; type: 'long' | 'short' }[];
    currentPosition?: { symbol: string; entry: number; size: number };
    marketCondition?: 'bullish' | 'bearish' | 'neutral';
    disciplineScore?: number;
    winStreak?: number;
}

interface AITradingCoachProps {
    context?: CoachContext;
    onClose?: () => void;
    minimized?: boolean;
    onToggleMinimize?: () => void;
}

// Quick action buttons for common questions
const QUICK_PROMPTS = [
    { label: 'Analyze my trade', prompt: 'Analyze my recent trading performance', icon: TrendingUp },
    { label: 'Risk check', prompt: 'Am I taking too much risk?', icon: AlertTriangle },
    { label: 'Market outlook', prompt: 'What should I watch for today?', icon: Brain },
    { label: 'Improve discipline', prompt: 'How can I improve my trading discipline?', icon: Zap }
];

export default function AITradingCoach({
    context,
    onClose,
    minimized = false,
    onToggleMinimize
}: AITradingCoachProps) {
    const { data: session } = useSession();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [quotaRemaining, setQuotaRemaining] = useState(5);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const isPremium = session?.user ? isPremiumUser(session.user) : false;
    const maxQuota = isPremium ? 50 : 5;

    // Initial greeting
    useEffect(() => {
        if (messages.length === 0) {
            const greeting = getPersonalizedGreeting(context);
            setMessages([{
                id: '1',
                role: 'coach',
                content: greeting,
                timestamp: new Date(),
                type: 'tip'
            }]);
        }
    }, []);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    function getPersonalizedGreeting(ctx?: CoachContext): string {
        if (!ctx) {
            return "👋 Hey trader! I'm your AI Trading Coach. Ask me about your trades, risk management, or market analysis. I'm here to keep you disciplined and profitable.";
        }

        if (ctx.winStreak && ctx.winStreak >= 3) {
            return `🔥 ${ctx.winStreak} wins in a row! Don't let it go to your head—size down on the next trade. Overconfidence kills more accounts than bad analysis. What's your next move?`;
        }

        if (ctx.disciplineScore && ctx.disciplineScore < 60) {
            return "⚠️ Your discipline score is slipping. Let's talk about what's going wrong before you make another trade. Walk me through your last few decisions.";
        }

        if (ctx.recentTrades && ctx.recentTrades.length > 0) {
            const lastTrade = ctx.recentTrades[0];
            if (lastTrade.pnl < 0) {
                return `I see that ${lastTrade.symbol} trade didn't work out. Let's analyze what happened—was it execution, setup, or just market noise? No judgment, just learning.`;
            }
        }

        return "👋 Good to see you. How can I help with your trading today? I can analyze trades, check your risk, or discuss strategy.";
    }

    async function handleSend(promptOverride?: string) {
        const messageText = promptOverride || input.trim();
        if (!messageText || isLoading) return;

        if (quotaRemaining <= 0 && !isPremium) {
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'coach',
                content: "⚠️ You've used all your free coaching sessions today. Upgrade to Premium for unlimited coaching!",
                timestamp: new Date(),
                type: 'warning'
            }]);
            return;
        }

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: messageText,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/coach/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: messageText,
                    context,
                    history: messages.slice(-6).map(m => ({ role: m.role, content: m.content }))
                })
            });

            if (!response.ok) throw new Error('Coach unavailable');

            const data = await response.json();

            const coachMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'coach',
                content: data.response || "Let me think about that... Try asking in a different way.",
                timestamp: new Date(),
                type: data.type || 'analysis'
            };

            setMessages(prev => [...prev, coachMessage]);
            setQuotaRemaining(prev => Math.max(0, prev - 1));

        } catch (error) {
            // Fallback response if API fails
            const fallbackResponses = [
                "Focus on the process, not the outcome. Did you follow your rules?",
                "Risk management first. How much of your account is this position?",
                "Is this a revenge trade or a planned setup? Be honest.",
                "Remember: the best trade is often no trade. Missing a move costs nothing.",
                "What's your stop loss? If you don't know, you shouldn't be in the trade."
            ];

            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'coach',
                content: fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)],
                timestamp: new Date(),
                type: 'tip'
            }]);
        }

        setIsLoading(false);
    }

    if (minimized) {
        return (
            <motion.button
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.05 }}
                onClick={onToggleMinimize}
                className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-600 
                         rounded-full shadow-lg shadow-purple-500/30 flex items-center justify-center z-50"
            >
                <Bot className="w-7 h-7 text-white" />
                {quotaRemaining > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full 
                                   text-xs font-bold text-white flex items-center justify-center">
                        {quotaRemaining}
                    </span>
                )}
            </motion.button>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 w-96 bg-gray-900 border border-gray-700 rounded-2xl 
                     shadow-2xl shadow-black/50 overflow-hidden z-50 flex flex-col max-h-[600px]"
        >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                        <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-sm">AI Trading Coach</h3>
                        <p className="text-xs text-white/70">
                            {isPremium ? (
                                <span className="flex items-center gap-1">
                                    <Crown className="w-3 h-3" /> Unlimited
                                </span>
                            ) : (
                                `${quotaRemaining}/${maxQuota} sessions left`
                            )}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={onToggleMinimize}
                        className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <Minimize2 className="w-4 h-4 text-white" />
                    </button>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <X className="w-4 h-4 text-white" />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px]">
                {messages.map((msg) => (
                    <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${msg.role === 'user'
                                ? 'bg-purple-600 text-white rounded-br-none'
                                : msg.type === 'warning'
                                    ? 'bg-red-600/20 border border-red-600/30 text-red-200 rounded-bl-none'
                                    : msg.type === 'praise'
                                        ? 'bg-emerald-600/20 border border-emerald-600/30 text-emerald-200 rounded-bl-none'
                                        : 'bg-gray-800 text-gray-200 rounded-bl-none'
                            }`}>
                            <p className="text-sm leading-relaxed">{msg.content}</p>
                        </div>
                    </motion.div>
                ))}

                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-start"
                    >
                        <div className="bg-gray-800 rounded-2xl rounded-bl-none px-4 py-3">
                            <div className="flex gap-1">
                                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </motion.div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts */}
            {messages.length <= 1 && (
                <div className="px-4 pb-3">
                    <p className="text-xs text-gray-500 mb-2">Quick actions:</p>
                    <div className="flex flex-wrap gap-2">
                        {QUICK_PROMPTS.map((qp, i) => (
                            <button
                                key={i}
                                onClick={() => handleSend(qp.prompt)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 
                                         rounded-full text-xs text-gray-300 transition-colors"
                            >
                                <qp.icon className="w-3 h-3" />
                                {qp.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-gray-800">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask your coach..."
                        disabled={isLoading || (quotaRemaining <= 0 && !isPremium)}
                        className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 
                                 text-sm text-white placeholder-gray-500 focus:outline-none 
                                 focus:border-purple-500 disabled:opacity-50"
                    />
                    <button
                        onClick={() => handleSend()}
                        disabled={!input.trim() || isLoading || (quotaRemaining <= 0 && !isPremium)}
                        className="p-2.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl 
                                 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send className="w-5 h-5 text-white" />
                    </button>
                </div>
            </div>

            {/* Premium Upsell */}
            {!isPremium && quotaRemaining <= 2 && (
                <div className="px-4 pb-4">
                    <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 
                                  rounded-xl p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Crown className="w-5 h-5 text-yellow-400" />
                            <span className="text-sm text-white">Upgrade for unlimited coaching</span>
                        </div>
                        <button className="px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 
                                        rounded-lg text-xs font-bold text-white">
                            Upgrade
                        </button>
                    </div>
                </div>
            )}
        </motion.div>
    );
}
