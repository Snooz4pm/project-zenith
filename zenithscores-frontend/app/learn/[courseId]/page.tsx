'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft,
    ChevronRight,
    BookOpen,
    Clock,
    Target,
    Zap,
    AlertCircle,
    Info,
    CheckCircle2,
    MessageSquare,
    BarChart3,
    Search,
    Sidebar as SidebarIcon,
    HelpCircle,
    TrendingUp,
    TrendingDown,
    Shield,
    Lightbulb,
    Globe,
    Database,
    Lock,
    ArrowRight,
    MousePointer2,
    GitBranch,
    Layers,
    Cpu,
    Unlink,
    Maximize2
} from 'lucide-react';
import { useRouter } from 'next/navigation';

// Mock Course Data Structure
const COURSES_REGISTRY: Record<string, any> = {
    'trading-fundamentals': {
        title: 'Trading Fundamentals',
        level: 'LVL 1 Novice',
        duration: '135 min',
        modulesCount: 6,
        modules: [
            { id: 'overview', title: 'The Genesis of Value', icon: <BookOpen className="w-4 h-4" /> },
            { id: 'mechanics', title: 'Market Mechanics', icon: <Database className="w-4 h-4" /> },
            { id: 'order-types', title: 'Order Execution Flow', icon: <Zap className="w-4 h-4" /> },
            { id: 'liquidity', title: 'The Role of Liquidity', icon: <BarChart3 className="w-4 h-4" /> },
            { id: 'participants', title: 'Institutional Landscape', icon: <Globe className="w-4 h-4" /> },
            { id: 'risk-intro', title: 'Risk Axioms', icon: <Shield className="w-4 h-4" /> },
        ],
    },
    'zenith-score-mastery': {
        title: 'Zenith Score Mastery',
        level: 'LVL 2 Specialist',
        duration: '105 min',
        modulesCount: 4,
        modules: [
            { id: 'theory', title: 'Algorithmic Theory', icon: <Cpu className="w-4 h-4" /> },
            { id: 'components', title: 'Score Components', icon: <Layers className="w-4 h-4" /> },
            { id: 'regime', title: 'Regime Identification', icon: <Globe className="w-4 h-4" /> },
            { id: 'application', title: 'Practical Trading', icon: <Target className="w-4 h-4" /> },
        ]
    },
    'technical-analysis': {
        title: 'Technical Analysis',
        level: 'LVL 3 Analyst',
        duration: '230 min',
        modulesCount: 5,
        modules: [
            { id: 'charts', title: 'Visual Structures', icon: <BarChart3 className="w-4 h-4" /> },
            { id: 'indicators', title: 'Derived Heuristics', icon: <Zap className="w-4 h-4" /> },
            { id: 'patterns', title: 'Recurring Geometries', icon: <Maximize2 className="w-4 h-4" /> },
            { id: 'volume', title: 'Volume Validation', icon: <Database className="w-4 h-4" /> },
            { id: 'synthesis', title: 'Analytical Synthesis', icon: <GitBranch className="w-4 h-4" /> },
        ]
    },
    'risk-management-pro': {
        title: 'Risk Management Pro',
        level: 'LVL 4 Strategist',
        duration: '140 min',
        modulesCount: 4,
        modules: [
            { id: 'sizing', title: 'Position Sizing Math', icon: <BarChart3 className="w-4 h-4" /> },
            { id: 'stops', title: 'Structural Invalidation', icon: <Shield className="w-4 h-4" /> },
            { id: 'kelly', title: 'Kelly Criterion', icon: <Zap className="w-4 h-4" /> },
            { id: 'portfolio', title: 'Portfolio Correlation', icon: <Layers className="w-4 h-4" /> },
        ]
    },
    'trading-psychology': {
        title: 'Trading Psychology',
        level: 'LVL 3 Behavioral',
        duration: '150 min',
        modulesCount: 4,
        modules: [
            { id: 'bias', title: 'Cognitive Biases', icon: <Lightbulb className="w-4 h-4" /> },
            { id: 'discipline', title: 'Execution Discipline', icon: <Zap className="w-4 h-4" /> },
            { id: 'routine', title: 'Operational Routines', icon: <Clock className="w-4 h-4" /> },
            { id: 'recovery', title: 'Drawdown Recovery', icon: <TrendingUp className="w-4 h-4" /> },
        ]
    },
    'defi-deep-dive': {
        title: 'DeFi Deep Dive',
        level: 'LVL 5 Architect',
        duration: '200 min',
        modulesCount: 5,
        modules: [
            { id: 'architecture', title: 'Protocol Arch', icon: <Unlink className="w-4 h-4" /> },
            { id: 'amm', title: 'AMM Mechanics', icon: <Database className="w-4 h-4" /> },
            { id: 'yield', title: 'Yield Optimization', icon: <TrendingUp className="w-4 h-4" /> },
            { id: 'security', title: 'Smart Contract Risk', icon: <Shield className="w-4 h-4" /> },
            { id: 'future', title: 'Future of Finance', icon: <Globe className="w-4 h-4" /> },
        ]
    }
};

import { saveCourseProgress, getSingleCourseProgress } from '@/lib/actions/learning';
import { useSession } from 'next-auth/react';
import { CheckCircle } from 'lucide-react';

export default function CoursePage({ params }: { params: { courseId: string } }) {
    const router = useRouter();
    const courseId = params.courseId;
    const course = COURSES_REGISTRY[courseId] || COURSES_REGISTRY['trading-fundamentals'];

    const [activeModule, setActiveModule] = useState(0);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [readingProgress, setReadingProgress] = useState(0);

    const { data: session } = useSession();
    const [isLoading, setIsLoading] = useState(true);
    const [completedModules, setCompletedModules] = useState<string[]>([]);

    // Hydrate progress from DB
    useEffect(() => {
        let isMounted = true;

        async function loadProgress() {
            if (!session?.user?.id || !courseId) return;

            try {
                const progressData = await getSingleCourseProgress(session.user.id, courseId);

                if (isMounted && progressData) {
                    // Logic: If lastModuleCompleted is found, we assume all previous are done 
                    // tailored to the "Linear Progression" model for this institutional course.
                    if (progressData.lastModuleCompleted) {
                        const modules = course.modules || [];
                        const lastIndex = modules.findIndex((m: any) => m.id === progressData.lastModuleCompleted);

                        if (lastIndex !== -1) {
                            const done = modules.slice(0, lastIndex + 1).map((m: any) => m.id);
                            setCompletedModules(done);
                            // Auto-navigate to next unfinished module if not done
                            if (!progressData.completed && lastIndex + 1 < modules.length) {
                                setActiveModule(lastIndex + 1);
                            } else {
                                setActiveModule(lastIndex);
                            }
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to load course progress", err);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }

        loadProgress();
        return () => { isMounted = false; };
    }, [session, courseId, course]);

    // Handle Marking Module as Done
    const handleCompleteModule = async (moduleId: string, moduleIndex: number) => {
        if (!session?.user?.id) return;

        // Optimistic Update
        const newCompleted = [...new Set([...completedModules, moduleId])];
        setCompletedModules(newCompleted);

        // Calculate stats
        const totalModules = course.modules.length;
        const currentProgressCount = newCompleted.length; // Approximation or strictly index based
        // For linear course, we use index
        const progressPercent = Math.min(100, Math.round(((moduleIndex + 1) / totalModules) * 100));
        const isCourseComplete = progressPercent === 100;

        // Persist
        await saveCourseProgress(
            session.user.id,
            courseId,
            progressPercent,
            moduleId,
            isCourseComplete
        );

        // Auto-advance after small delay for UX
        if (moduleIndex < totalModules - 1) {
            setTimeout(() => setActiveModule(moduleIndex + 1), 800);
        }
    };

    // Scroll progress handler
    useEffect(() => {
        const handleScroll = () => {
            const winScroll = document.documentElement.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = (winScroll / height) * 100;
            setReadingProgress(scrolled);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const renderContent = () => {
        switch (courseId) {
            case 'trading-fundamentals':
                return <TradingFundamentalsContent />;
            case 'zenith-score-mastery':
                return <ZenithMasteryContent />;
            case 'technical-analysis':
                return <TechnicalAnalysisContent />;
            case 'risk-management-pro':
                return <RiskManagementContent />;
            case 'trading-psychology':
                return <TradingPsychologyContent />;
            case 'defi-deep-dive':
                return <DeFiContent />;
            default:
                return <TradingFundamentalsContent />;
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-zinc-300 font-sans selection:bg-emerald-500/30 selection:text-emerald-200">

            {/* Progress Bar */}
            <div className="fixed top-0 left-0 w-full h-1 z-50 bg-zinc-900">
                <motion.div
                    className="h-full bg-emerald-500"
                    style={{ width: `${readingProgress}%` }}
                />
            </div>

            {/* Header */}
            <header className="h-16 border-b border-white/5 bg-[#0a0a0c]/80 backdrop-blur-xl sticky top-0 z-40 px-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-all"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="h-4 w-[1px] bg-white/10" />
                    <h1 className="text-sm font-bold tracking-tight text-white uppercase font-display">
                        {course.title} <span className="text-zinc-500 font-normal ml-2">/ {course.level}</span>
                    </h1>
                </div>

                <div className="flex items-center gap-6">
                    <div className="hidden md:flex items-center gap-2 text-xs font-mono text-zinc-500">
                        <Clock className="w-3.5 h-3.5" />
                        <span>EST. READ: {course.duration}</span>
                    </div>
                    <div className="h-4 w-[1px] bg-white/10 hidden md:block" />
                    <button className="p-2 text-zinc-500 hover:text-white transition-colors">
                        <Search className="w-4 h-4" />
                    </button>
                </div>
            </header>

            <div className="flex">
                {/* Sidebar Navigation */}
                <aside
                    className={`fixed left-0 top-16 bottom-0 z-30 bg-[#0a0a0c] border-r border-white/5 transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-72' : 'w-0 overflow-hidden'}`}
                >
                    <nav className="p-4 h-full overflow-y-auto space-y-1">
                        <div className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-2">
                            Course Structure
                        </div>
                        {course.modules.map((mod: any, idx: number) => {
                            const isCompleted = completedModules.includes(mod.id);
                            const isActive = activeModule === idx;

                            return (
                                <button
                                    key={mod.id}
                                    onClick={() => setActiveModule(idx)}
                                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all group ${isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5 border border-transparent'}`}
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <span className={`${isActive ? 'text-emerald-400' : isCompleted ? 'text-emerald-500/50' : 'text-zinc-600 group-hover:text-zinc-400'}`}>
                                            {isCompleted ? <CheckCircle className="w-4 h-4" /> : mod.icon}
                                        </span>
                                        <span className="truncate">{mod.title}</span>
                                    </div>
                                    {isCompleted && !isActive && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                                    )}
                                </button>
                            );
                        })}
                    </nav>
                </aside>

                {/* Main Content Area */}
                <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-72' : 'ml-0'}`}>
                    <div className="max-w-4xl mx-auto px-8 md:px-16 py-12 md:py-20 lg:py-24">
                        {renderContent()}

                        {/* Module Completion Action Area */}
                        <ModuleCompletionAction
                            isCompleted={completedModules.includes(course.modules[activeModule].id)}
                            onComplete={() => handleCompleteModule(course.modules[activeModule].id, activeModule)}
                        />

                        {/* Pagination / Navigation Footer */}
                        <div className="mt-12 pt-8 border-t border-white/10 flex items-center justify-between">
                            <button
                                className={`flex items-center gap-2 text-zinc-500 hover:text-white transition-all text-sm font-medium ${activeModule === 0 ? 'opacity-0 pointer-events-none' : ''}`}
                                onClick={() => setActiveModule(Math.max(0, activeModule - 1))}
                            >
                                <ChevronLeft className="w-4 h-4" /> Previous Module
                            </button>

                            {/* Only show 'Next' if it's not the last one, otherwise show finish course logic which is handled by completion */}
                            {activeModule < course.modules.length - 1 && (
                                <button
                                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 transition-all text-sm font-bold"
                                    onClick={() => setActiveModule(Math.min(course.modules.length - 1, activeModule + 1))}
                                >
                                    Next Module <ChevronRight className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </main>

                {/* Right Rail Insights */}
                <aside className="hidden xl:block w-80 bg-[#0a0a0c] border-l border-white/5 p-8 overflow-y-auto sticky top-16 h-[calc(100vh-4rem)]">
                    <div className="space-y-8">
                        <div>
                            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Core Concepts</h4>
                            <div className="space-y-4">
                                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                                    <div className="text-[10px] text-zinc-500 mb-1">LIQUIDITY</div>
                                    <p className="text-xs text-zinc-400 leading-snug">The ability to buy or sell an asset without causing significant price movement.</p>
                                </div>
                                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                                    <div className="text-[10px] text-zinc-500 mb-1">SLIPPAGE</div>
                                    <p className="text-xs text-zinc-400 leading-snug">The difference between the expected price of a trade and the price at which it's executed.</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                            <h4 className="text-xs font-bold text-emerald-400 mb-2 flex items-center gap-2">
                                <Info size={14} /> Analyst Tip
                            </h4>
                            <p className="text-[11px] text-emerald-200/60 leading-relaxed italic">
                                Cross-reference high-timeframe structural levels with current @ZenithScore conviction before entry.
                            </p>
                        </div>
                    </div>
                </aside>
            </div>

            {/* Floating Sidebar Toggle */}
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="fixed bottom-8 left-8 p-3 rounded-full bg-[#121214] border border-white/10 text-zinc-400 hover:text-white shadow-2xl z-50 hover:scale-110 transition-all"
            >
                <SidebarIcon size={20} />
            </button>

        </div>
    );
}

// --- Content Components ---

function TradingFundamentalsContent() {
    return (
        <motion.article
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="prose prose-invert prose-emerald max-w-none"
        >
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-8 tracking-tight font-display">
                Trading Fundamentals: The Mathematical Essence of Markets
            </h1>
            <p className="text-xl text-zinc-400 leading-relaxed mb-12">
                A professional architect must understand the strength of their materials before building a skyscraper. A trader must understand the mechanics of price, liquidity, and orders before risking a single dollar.
            </p>

            <section className="mb-16">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <span className="text-emerald-500 text-lg">01.</span> The Double Auction Heuristic
                </h2>
                <p className="leading-relaxed text-zinc-400 mb-6">
                    Every market—from @AAPL on the NASDAQ to @BTCUSD on Coinbase—operates on a continuous double auction. This is not just "buying and selling"; it is a battle between passive limit orders and aggressive market orders.
                </p>
                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                    <h3 className="text-lg font-bold text-white mb-4">The Order Book Mechanics</h3>
                    <div className="space-y-4 font-mono text-xs">
                        <div className="flex justify-between items-center text-red-400/80">
                            <span>LIMIT SELL (ASK) - $100.50</span>
                            <span>500 UNITS</span>
                        </div>
                        <div className="flex justify-between items-center text-red-500 font-bold bg-red-500/5 p-2 rounded border border-red-500/20">
                            <span>BEST ASK - $100.25</span>
                            <span>120 UNITS</span>
                        </div>
                        <div className="h-[1px] bg-white/10 my-2 relative">
                            <span className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 px-3 bg-[#0a0a0c] text-[10px] text-zinc-500">SPREAD: $0.05</span>
                        </div>
                        <div className="flex justify-between items-center text-emerald-500 font-bold bg-emerald-500/5 p-2 rounded border border-emerald-500/20">
                            <span>BEST BID - $100.20</span>
                            <span>450 UNITS</span>
                        </div>
                        <div className="flex justify-between items-center text-emerald-400/80">
                            <span>LIMIT BUY (BID) - $100.15</span>
                            <span>1500 UNITS</span>
                        </div>
                    </div>
                </div>
            </section>

            <div className="my-12 p-8 rounded-2xl bg-gradient-to-br from-white/[0.03] to-transparent border border-white/10 relative overflow-hidden group">
                <div className="flex items-start gap-4 relative z-10">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <Zap className="w-5 h-5" />
                    </div>
                    <div>
                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest block mb-2">INTERACTIVE — SCENARIO</span>
                        <p className="text-white font-medium leading-relaxed italic">
                            "You see a large limit buy order for 10,000 units at $100.15. Price drops to $100.16 and then immediately bounces without hitting the order. This is a sign of aggressive 'front-running' by market participants who don't want to miss the liquidity. How does this affect your entry strategy?"
                        </p>
                    </div>
                </div>
            </div>
        </motion.article>
    );
}

function ZenithMasteryContent() {
    return (
        <motion.article
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="prose prose-invert prose-emerald max-w-none"
        >
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-8 tracking-tight font-display">
                Zenith Score Mastery: Decoding Market Regime
            </h1>
            <section className="mb-16">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <span className="text-emerald-500 text-lg">01.</span> Algorithmic Foundations
                </h2>
                <p className="text-zinc-400 leading-relaxed mb-6">
                    Retail traders look at individual indicators like RSI or MACD. Professional systems look at *Regimes*. The Zenith Score is a unified measurement of the current market state, calculated via three primary vectors:
                </p>
                <div className="grid grid-cols-1 gap-6">
                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex gap-4">
                        <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400 border border-orange-500/20 shrink-0">
                            <Zap size={24} />
                        </div>
                        <div>
                            <h4 className="text-white font-bold mb-1">Momentum Velocity</h4>
                            <p className="text-sm text-zinc-500">Calculates the second-order derivative of price movement to identify acceleration or exhaustion.</p>
                        </div>
                    </div>
                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 shrink-0">
                            <BarChart3 size={24} />
                        </div>
                        <div>
                            <h4 className="text-white font-bold mb-1">Volume Integrity</h4>
                            <p className="text-sm text-zinc-500">Cross-references price action with transactional depth to confirm if a move is structural or speculative.</p>
                        </div>
                    </div>
                </div>
            </section>
        </motion.article>
    );
}

function TechnicalAnalysisContent() {
    return (
        <motion.article
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="prose prose-invert prose-emerald max-w-none"
        >
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-8 tracking-tight font-display">
                Technical Analysis: The Geometry of Human Behavior
            </h1>
            <p className="text-xl text-zinc-400 leading-relaxed mb-12">
                Charts are not crystal balls; they are maps of previous market auctions. A "Support" level is simply a price where historical demand exceeded supply. A "Trend" is a sustained imbalance in conviction.
            </p>

            <section className="mb-16">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <span className="text-emerald-500 text-lg">01.</span> Visual Structures & Market Flow
                </h2>
                <p className="text-zinc-400 leading-relaxed mb-6">
                    Learn to identify "Market Structure" shift (MSS). When price breaks the previous impulsive low in an uptrend, the regime has likely transitioned from 'Bullish' to 'Distribution'.
                </p>
            </section>
            <section className="mt-20 border-t border-white/5 pt-12">
                <p className="text-zinc-500 italic text-sm mb-8">
                    [End of Module 1: The Genesis of Value]
                </p>
                <div className="flex items-center gap-4">
                    {/* This button is injected dynamically for the active module context in the real implementation, 
                         but for this static content block view, we will rely on the parent container to inject the completion controls 
                         or wrapper. Since we are inside a static function return, we'll suggest using the parent's control.
                         
                         HOWEVER, to make this work seamlessly with the current structure, we will add the button in the main render loop 
                         or pass a prop. For now, let's allow the user to complete via the main UI footer or specific actions.
                     */}
                </div>
            </section>
        </motion.article>
    );
}

// Helper component for the "Complete Module" Action Area
function ModuleCompletionAction({ onComplete, isCompleted }: { onComplete: () => void, isCompleted: boolean }) {
    return (
        <div className="mt-12 p-1 bg-gradient-to-r from-emerald-500/20 to-transparent rounded-2xl">
            <div className="bg-[#0a0a0c] p-6 rounded-xl border border-emerald-500/20 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <h3 className="text-white font-bold text-lg flex items-center gap-2">
                        <CheckCircle className={isCompleted ? "text-emerald-500" : "text-zinc-600"} />
                        {isCompleted ? "Module Completed" : "Ready to Advance?"}
                    </h3>
                    <p className="text-zinc-500 text-sm mt-1">
                        {isCompleted ? "Great job. You've mastered this section." : "Confirm your understanding to proceed to the next module."}
                    </p>
                </div>
                <button
                    onClick={onComplete}
                    disabled={isCompleted}
                    className={`px-8 py-3 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${isCompleted
                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 cursor-default"
                            : "bg-emerald-500 text-black hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]"
                        }`}
                >
                    {isCompleted ? "Completed" : "Mark as Complete"}
                    {!isCompleted && <ArrowRight className="w-4 h-4" />}
                </button>
            </div>
        </div>
    );
}

function RiskManagementContent() {
    return (
        <motion.article
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="prose prose-invert prose-emerald max-w-none"
        >
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-8 tracking-tight font-display">
                Risk Management Pro: Defensive Alpha
            </h1>
            <section className="mb-16">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <span className="text-emerald-500 text-lg">01.</span> The 1% Rule and Beyond
                </h2>
                <p className="text-zinc-400 leading-relaxed mb-6">
                    Protecting capital is more important than growing it. If you lose 50%, you need 100% gain just to get back to breakeven. This is the asymmetry of risk.
                </p>
                <code className="block p-6 rounded-xl bg-black border border-white/10 text-emerald-400 font-mono text-sm mb-6">
                    Position Size = (Account Risk Amount) / (Stop Loss Distance)
                </code>
            </section>
        </motion.article>
    );
}

function TradingPsychologyContent() {
    return (
        <motion.article
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="prose prose-invert prose-emerald max-w-none"
        >
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-8 tracking-tight font-display">
                Trading Psychology: The Counter-Intuitive Brain
            </h1>
            <p className="text-zinc-400 leading-relaxed">
                Your brain is evolved for survival on the savannah, not for probability in the markets. Fear of Missing Out (FOMO) is a natural response to perceived resource scarcity, but in trading, it leads to buying at the top of an auction.
            </p>
        </motion.article>
    );
}

function DeFiContent() {
    return (
        <motion.article
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="prose prose-invert prose-emerald max-w-none"
        >
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-8 tracking-tight font-display">
                DeFi Deep Dive: Architecture of Autonomy
            </h1>
            <p className="text-zinc-400 leading-relaxed">
                Decentralized Finance replaces the central clearing house with a smart contract. Understand the mechanics of Automated Market Makers (AMMs) and why "Impermanent Loss" is a structural cost of providing liquidity.
            </p>
        </motion.article>
    );
}
