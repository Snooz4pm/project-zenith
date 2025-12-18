'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bot, Send, Zap, TrendingUp, TrendingDown, AlertTriangle,
    Target, Shield, Lightbulb, X, Maximize2, Minimize2, Sparkles
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://defioracleworkerapi.vercel.app';

interface TradeContext {
    symbol: string;
    price: number;
    change24h: number;
    zenithScore: number;
    action?: 'buy' | 'sell';
    amount?: number;
}

interface AIMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface AITradeAssistantProps {
    tradeContext?: TradeContext;
    onClose?: () => void;
    minimized?: boolean;
}

// Pre-defined quick prompts
const QUICK_PROMPTS = [
    { label: 'Analyze this trade', icon: <Target size={14} />, prompt: 'Analyze this trade setup' },
    { label: 'Risk assessment', icon: <Shield size={14} />, prompt: 'What are the risks?' },
    { label: 'Entry/Exit points', icon: <TrendingUp size={14} />, prompt: 'Suggest entry and exit points' },
    { label: 'Position size', icon: <Lightbulb size={14} />, prompt: 'Calculate optimal position size' },
];

export default function AITradeAssistant({ tradeContext, onClose, minimized: initialMinimized = false }: AITradeAssistantProps) {
    const [messages, setMessages] = useState<AIMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [minimized, setMinimized] = useState(initialMinimized);

    const sendMessage = useCallback(async (userMessage: string) => {
        if (!userMessage.trim() || loading) return;

        const userMsg: AIMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: userMessage,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            // Build context for AI
            let contextStr = userMessage;
            if (tradeContext) {
                contextStr = `
Context: User is looking at ${tradeContext.symbol} at $${tradeContext.price.toFixed(2)}, 
24h change: ${tradeContext.change24h >= 0 ? '+' : ''}${tradeContext.change24h.toFixed(2)}%,
Zenith Score: ${tradeContext.zenithScore}${tradeContext.action ? `, considering a ${tradeContext.action}` : ''}.

User question: ${userMessage}`;
            }

            const sessionId = localStorage.getItem('zenith_session_id') || 'demo-user';

            // Call AI endpoint
            const res = await fetch(`${API_URL}/api/v1/trading/ai-coach`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: sessionId,
                    prompt: contextStr,
                    context_type: 'trade_analysis'
                })
            });

            let aiResponse = "I'm analyzing your question...";

            if (res.ok) {
                const data = await res.json();
                aiResponse = data.response || data.message || "Great question! Based on the current market conditions...";
            } else {
                // Fallback response
                aiResponse = generateFallbackResponse(userMessage, tradeContext);
            }

            const aiMsg: AIMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: aiResponse,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error('AI request failed:', error);
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: generateFallbackResponse(userMessage, tradeContext),
                timestamp: new Date()
            }]);
        } finally {
            setLoading(false);
        }
    }, [loading, tradeContext]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(input);
    };

    // Minimized view - floating button
    if (minimized) {
        return (
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={() => setMinimized(false)}
                className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30 flex items-center justify-center hover:scale-110 transition-transform"
            >
                <Bot size={24} className="text-white" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-400 rounded-full animate-pulse" />
            </motion.button>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-b border-white/10 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                            <Bot size={20} className="text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white flex items-center gap-2">
                                Zenith AI
                                <Sparkles size={14} className="text-yellow-400" />
                            </h3>
                            <p className="text-xs text-gray-400">Your trading copilot</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setMinimized(true)}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                        >
                            <Minimize2 size={16} />
                        </button>
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Trade Context Banner */}
                {tradeContext && (
                    <div className="mt-3 p-2 rounded-lg bg-black/30 flex items-center gap-3">
                        <div className="text-lg font-bold text-white">{tradeContext.symbol}</div>
                        <div className="text-sm font-mono text-gray-300">${tradeContext.price.toFixed(2)}</div>
                        <div className={`text-xs font-bold px-2 py-0.5 rounded ${tradeContext.change24h >= 0
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                            {tradeContext.change24h >= 0 ? '+' : ''}{tradeContext.change24h.toFixed(1)}%
                        </div>
                        <div className="ml-auto text-xs text-gray-500">
                            Score: <span className="text-cyan-400 font-bold">{tradeContext.zenithScore}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Messages Area */}
            <div className="h-[280px] overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                    <div className="text-center py-8">
                        <Bot size={40} className="mx-auto mb-3 text-gray-600" />
                        <p className="text-gray-500 text-sm mb-4">Ask me anything about your trade!</p>
                        <div className="grid grid-cols-2 gap-2">
                            {QUICK_PROMPTS.map((qp, i) => (
                                <button
                                    key={i}
                                    onClick={() => sendMessage(qp.prompt)}
                                    className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-xs text-gray-400 hover:text-white"
                                >
                                    {qp.icon}
                                    {qp.label}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    messages.map(msg => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[85%] p-3 rounded-xl text-sm ${msg.role === 'user'
                                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                                    : 'bg-white/10 text-gray-200'
                                }`}>
                                {msg.content}
                            </div>
                        </motion.div>
                    ))
                )}

                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-white/10 p-3 rounded-xl text-sm text-gray-400 flex items-center gap-2">
                            <div className="flex gap-1">
                                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                            Analyzing...
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="p-3 border-t border-white/10">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about your trade..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500/50"
                    />
                    <button
                        type="submit"
                        disabled={loading || !input.trim()}
                        className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                    >
                        <Send size={16} />
                    </button>
                </div>
            </form>
        </motion.div>
    );
}

// Fallback response generator when API fails
function generateFallbackResponse(question: string, context?: TradeContext): string {
    const q = question.toLowerCase();

    if (context) {
        const { symbol, zenithScore, change24h } = context;
        const sentiment = zenithScore >= 70 ? 'bullish' : zenithScore >= 40 ? 'neutral' : 'bearish';
        const momentum = change24h >= 0 ? 'positive' : 'negative';

        if (q.includes('risk') || q.includes('danger')) {
            return `⚠️ **Risk Analysis for ${symbol}**\n\nWith a Zenith Score of ${zenithScore} and ${momentum} 24h momentum, here's what to watch:\n\n1. **Position Size**: Never risk more than 2% of your portfolio\n2. **Stop-Loss**: Set at ${change24h >= 0 ? '5-7%' : '3-5%'} below entry\n3. **Volatility**: Current conditions suggest ${sentiment} sentiment\n\nRemember: The market doesn't care about your feelings. Trade the chart, not your emotions. 📊`;
        }

        if (q.includes('entry') || q.includes('exit')) {
            return `📍 **Entry/Exit Strategy for ${symbol}**\n\nBased on Zenith Score ${zenithScore}:\n\n**Entry Zone**: Wait for a pullback to support. Current momentum is ${momentum}.\n**Take Profit**: Set 3 targets:\n- TP1: +5% (partial)\n- TP2: +10% (partial)\n- TP3: Trail the rest\n\n**Stop Loss**: Below recent swing low, max 5% risk.\n\nPro tip: Don't chase. Let the trade come to you. 🎯`;
        }

        if (q.includes('position') || q.includes('size')) {
            return `📊 **Position Sizing for ${symbol}**\n\nUsing the 2% rule:\n- Account Risk: 2% of total portfolio\n- If portfolio = $10,000 → Max risk = $200\n- With 5% stop-loss → Position size = $4,000\n\nZenith Score ${zenithScore} suggests ${sentiment} bias. ${zenithScore >= 70 ? 'Could consider slightly larger position.' : 'Keep it conservative.'}\n\n⚠️ Never all-in. Diamond hands are for memes, not portfolios.`;
        }

        return `🤖 **Analysis: ${symbol}**\n\nZenith Score: ${zenithScore} (${sentiment})\n24h Change: ${change24h >= 0 ? '+' : ''}${change24h.toFixed(1)}%\n\n${zenithScore >= 70
            ? "Strong momentum detected. Could be a good opportunity, but don't FOMO in. Wait for confirmation."
            : zenithScore >= 40
                ? "Mixed signals. This is a wait-and-see zone. Let the market show its hand first."
                : "Bearish indicators. Be cautious. If you're already in, consider tightening stops."}\n\nWhat specific aspect would you like me to analyze deeper? 🔍`;
    }

    // Generic responses
    if (q.includes('help') || q.includes('what can you')) {
        return `🤖 **I'm Zenith AI - Your Trading Copilot**\n\nI can help you with:\n• Trade analysis & risk assessment\n• Entry/exit point suggestions\n• Position sizing calculations\n• Market sentiment analysis\n• Zenith Score interpretation\n\nJust ask about any asset you're considering! 🚀`;
    }

    return `Great question! Here's my take:\n\nThe key to successful trading is risk management first, profits second. Never risk more than you can afford to lose, and always have a plan before entering any trade.\n\nWant me to analyze something specific? Just share the asset symbol or describe your trade idea! 📈`;
}
