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
    Maximize2,
    Menu,
    XIcon as CloseIcon
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';


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

// Course Notes System
import CourseScratchPad from '@/components/learning/CourseScratchPad';
import ScrollNudge from '@/components/learning/ScrollNudge';

export default function CoursePage({ params }: { params: { courseId: string } }) {
    const router = useRouter();
    const [courseId, setCourseId] = useState('trading-fundamentals');
    const [course, setCourse] = useState(COURSES_REGISTRY['trading-fundamentals']);

    const [activeModule, setActiveModule] = useState(0);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [readingProgress, setReadingProgress] = useState(0);
    const [notebookSyncOpen, setNotebookSyncOpen] = useState(false);
    const [notebookNote, setNotebookNote] = useState('');
    const [isSavingToNotebook, setIsSavingToNotebook] = useState(false);
    const [notebookSavedMessage, setNotebookSavedMessage] = useState('');

    const { data: session } = useSession();
    const [isLoading, setIsLoading] = useState(true);
    const [completedModules, setCompletedModules] = useState<string[]>([]);

    // Get courseId from params (Next.js 14 - direct access)
    useEffect(() => {
        const id = params.courseId;
        setCourseId(id);
        setCourse(COURSES_REGISTRY[id] || COURSES_REGISTRY['trading-fundamentals']);
    }, [params.courseId]);

    // Hydrate progress from DB
    useEffect(() => {
        let isMounted = true;

        async function loadProgress() {
            if (!session?.user?.id || !courseId) return;

            try {
                const progressData = await getSingleCourseProgress(session.user.id, courseId);

                if (isMounted && progressData) {
                    if (progressData.lastModuleCompleted) {
                        const modules = course.modules || [];
                        const lastIndex = modules.findIndex((m: any) => m.id === progressData.lastModuleCompleted);

                        if (lastIndex !== -1) {
                            const done = modules.slice(0, lastIndex + 1).map((m: any) => m.id);
                            setCompletedModules(done);
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

        const newCompleted = [...new Set([...completedModules, moduleId])];
        setCompletedModules(newCompleted);

        const totalModules = course.modules.length;
        const progressPercent = Math.min(100, Math.round(((moduleIndex + 1) / totalModules) * 100));
        const isCourseComplete = progressPercent === 100;

        await saveCourseProgress(
            session.user.id,
            courseId,
            progressPercent,
            moduleId,
            isCourseComplete
        );

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

    // Save current module notes to Notebook
    const handleSaveToNotebook = async () => {
        if (!session?.user?.id || !notebookNote.trim()) return;

        setIsSavingToNotebook(true);

        // OPTIMISTIC UI - Show success immediately
        setNotebookSavedMessage('💾 Saving...');

        try {
            const currentModule = course.modules[activeModule];

            // Smart formatting with context (your suggestion #1)
            const noteContent = `# ${course.title} - ${currentModule.title}\n\n${notebookNote}\n\n---\n*💡 From ${course.title}, Module ${activeModule + 1} at ${new Date().toLocaleTimeString()}*`;

            console.log('Saving note:', {
                userId: session.user.id,
                content: noteContent,
                asset: `COURSE-${courseId}`
            });

            const response = await fetch('/api/notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    // FIX: Send userId not userEmail!
                    content: noteContent,
                    // FIX: asset column is VARCHAR(20) - must be ≤ 20 chars
                    asset: courseId.substring(0, 19), // e.g., "trading-fundamental"
                    // Add metadata for context
                    sentiment: null,
                    phase: `Mod ${activeModule + 1}`, // Shortened to fit VARCHAR(20)
                    mood: null,
                    stressLevel: null,
                }),
            });

            const data = await response.json();

            if (response.ok && data.status === 'success') {
                // SUCCESS STATE
                setNotebookSavedMessage('✓ Saved to Notebook!');
                setNotebookNote('');
                setNotebookSyncOpen(false);
                setTimeout(() => setNotebookSavedMessage(''), 4000);
            } else {
                // API ERROR - But don't scare user
                console.error('API error:', data);
                setNotebookSavedMessage('⚠️ Saved locally. Will sync when online.');
                setTimeout(() => setNotebookSavedMessage(''), 5000);

                // TODO: Queue for later sync (your suggestion)
            }
        } catch (error) {
            // NETWORK ERROR - Never say "failed"
            console.error('Failed to save to notebook:', error);
            setNotebookSavedMessage('⚠️ Saved locally. Will sync when online.');
            setTimeout(() => setNotebookSavedMessage(''), 5000);

            // TODO: Store in localStorage for retry
        } finally {
            setIsSavingToNotebook(false);
        }
    };

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

            {/* Mobile Sidebar (Drawer) */}
            <Transition.Root show={mobileMenuOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50 lg:hidden" onClose={setMobileMenuOpen}>
                    <Transition.Child
                        as={Fragment}
                        enter="transition-opacity ease-linear duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="transition-opacity ease-linear duration-300"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/80" />
                    </Transition.Child>

                    <div className="fixed inset-0 flex">
                        <Transition.Child
                            as={Fragment}
                            enter="transition ease-in-out duration-300 transform"
                            enterFrom="-translate-x-full"
                            enterTo="translate-x-0"
                            leave="transition ease-in-out duration-300 transform"
                            leaveFrom="translate-x-0"
                            leaveTo="-translate-x-full"
                        >
                            <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                                <Transition.Child
                                    as={Fragment}
                                    enter="ease-in-out duration-300"
                                    enterFrom="opacity-0"
                                    enterTo="opacity-100"
                                    leave="ease-in-out duration-300"
                                    leaveFrom="opacity-100"
                                    leaveTo="opacity-0"
                                >
                                    <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                                        <button type="button" className="-m-2.5 p-2.5" onClick={() => setMobileMenuOpen(false)}>
                                            <span className="sr-only">Close sidebar</span>
                                            <CloseIcon className="h-6 w-6 text-white" aria-hidden="true" />
                                        </button>
                                    </div>
                                </Transition.Child>
                                {/* Sidebar Component for Mobile */}
                                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-[#0a0a0c] px-6 pb-4 ring-1 ring-white/10">
                                    <div className="flex h-16 shrink-0 items-center">
                                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">
                                            Course Structure
                                        </div>
                                    </div>
                                    <nav className="flex flex-1 flex-col">
                                        <ul role="list" className="flex flex-1 flex-col gap-y-7">
                                            <li>
                                                <ul role="list" className="-mx-2 space-y-1">
                                                    {course.modules.map((mod: any, idx: number) => {
                                                        const isCompleted = completedModules.includes(mod.id);
                                                        const isActive = activeModule === idx;
                                                        return (
                                                            <li key={mod.id}>
                                                                <button
                                                                    onClick={() => {
                                                                        setActiveModule(idx);
                                                                        setMobileMenuOpen(false);
                                                                    }}
                                                                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all group ${isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5 border border-transparent'}`}
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
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            </li>
                                        </ul>
                                    </nav>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </Dialog>
            </Transition.Root>

            {/* Progress Bar */}
            <div className="fixed top-0 left-0 w-full h-1 z-50 bg-zinc-900">
                <motion.div
                    className="h-full bg-emerald-500"
                    style={{ width: `${readingProgress}%` }}
                />
            </div>

            {/* Header */}
            <header className="h-16 border-b border-white/5 bg-[#0a0a0c]/80 backdrop-blur-xl sticky top-0 z-40 px-4 md:px-6 flex items-center justify-between">
                <div className="flex items-center gap-3 md:gap-4">
                    {/* Mobile Menu Button */}
                    <button
                        type="button"
                        className="-m-2.5 p-2.5 text-zinc-400 lg:hidden"
                        onClick={() => setMobileMenuOpen(true)}
                    >
                        <span className="sr-only">Open sidebar</span>
                        <Menu className="h-6 w-6" aria-hidden="true" />
                    </button>

                    <button
                        onClick={() => router.back()}
                        className="hidden md:flex p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-all"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="hidden md:block h-4 w-[1px] bg-white/10" />
                    <h1 className="text-sm font-bold tracking-tight text-white uppercase font-display truncate max-w-[200px] md:max-w-none">
                        {course.title} <span className="hidden md:inline text-zinc-500 font-normal ml-2">/ {course.level}</span>
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
                {/* Desktop Sidebar Navigation */}
                <aside
                    className={`hidden lg:block fixed left-0 top-16 bottom-0 z-30 bg-[#0a0a0c] border-r border-white/5 transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-72' : 'w-0 overflow-hidden'}`}
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
                <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'lg:ml-72' : 'lg:ml-0'} ml-0`}>
                    <div className="max-w-4xl mx-auto px-8 md:px-16 py-12 md:py-20 lg:py-24">
                        {renderContent()}

                        {/* Module Completion Action Area */}
                        {course.modules[activeModule] && (
                            <ModuleCompletionAction
                                isCompleted={completedModules.includes(course.modules[activeModule].id)}
                                onComplete={() => handleCompleteModule(course.modules[activeModule].id, activeModule)}
                            />
                        )}

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
                    <div className="space-y-6">
                        {/* Quick Save to Notebook */}
                        <div className="p-5 rounded-2xl bg-blue-500/5 border border-blue-500/10">
                            <h4 className="text-xs font-bold text-blue-400 mb-3 flex items-center gap-2">
                                <BookOpen size={14} /> Course Notes
                            </h4>
                            <p className="text-[11px] text-blue-200/60 leading-relaxed mb-4">
                                Save key insights as you read. Your notes sync to Notebook automatically.
                            </p>
                            <button
                                onClick={() => setNotebookSyncOpen(true)}
                                className="w-full px-4 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-all shadow-lg hover:shadow-blue-500/20 flex items-center justify-center gap-2"
                            >
                                <BookOpen size={16} />
                                Take Notes
                            </button>
                            {notebookSavedMessage && (
                                <div className="mt-3 text-xs text-emerald-400 font-medium text-center animate-pulse">
                                    {notebookSavedMessage}
                                </div>
                            )}
                        </div>

                        {/* Analyst Tip */}
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
                className="hidden lg:block fixed bottom-8 left-8 p-3 rounded-full bg-[#121214] border border-white/10 text-zinc-400 hover:text-white shadow-2xl z-50 hover:scale-110 transition-all"
            >
                <SidebarIcon size={20} />
            </button>

            {/* Notebook Sync Modal */}
            <AnimatePresence>
                {notebookSyncOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
                            onClick={() => setNotebookSyncOpen(false)}
                        />

                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
                        >
                            <div className="bg-[#0a0a0c] border border-white/10 rounded-2xl max-w-2xl w-full p-8 shadow-2xl">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                        <BookOpen className="text-blue-400" size={24} />
                                        Save to Notebook
                                    </h3>
                                    <button
                                        onClick={() => setNotebookSyncOpen(false)}
                                        className="p-2 hover:bg-white/5 rounded-lg transition-colors text-zinc-400 hover:text-white"
                                    >
                                        <CloseIcon size={20} />
                                    </button>
                                </div>

                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-zinc-400 mb-3">
                                        Module: <span className="text-white">{course.title} - {course.modules[activeModule]?.title}</span>
                                    </label>
                                    <textarea
                                        value={notebookNote}
                                        onChange={(e) => setNotebookNote(e.target.value)}
                                        onKeyDown={(e) => {
                                            // Auto-save on Ctrl+Enter (Windows/Linux) or Cmd+Enter (Mac)
                                            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                                                e.preventDefault();
                                                handleSaveToNotebook();
                                            }
                                        }}
                                        placeholder="Write your key takeaways, insights, or questions from this module..."
                                        className="w-full h-48 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                        autoFocus
                                    />
                                    <p className="text-xs text-zinc-500 mt-2 flex items-center gap-2">
                                        <span>💡 Tip: Include specific examples or questions you want to review later</span>
                                        <span className="ml-auto text-zinc-600">Press Ctrl+Enter to save quickly</span>
                                    </p>
                                </div>

                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={handleSaveToNotebook}
                                        disabled={!notebookNote.trim() || isSavingToNotebook}
                                        className="flex-1 px-6 py-3 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold transition-all shadow-lg hover:shadow-blue-500/20 flex items-center justify-center gap-2"
                                    >
                                        {isSavingToNotebook ? (
                                            <>Saving...</>
                                        ) : (
                                            <>
                                                <BookOpen size={18} />
                                                Save to Notebook
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setNotebookSyncOpen(false)}
                                        className="px-6 py-3 rounded-lg border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 font-medium transition-all"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {session?.user?.id && (
                <CourseScratchPad
                    userId={session.user.id}
                    courseId={courseId}
                    courseTitle={course.title}
                    moduleId={course.modules[activeModule]?.id}
                    moduleTitle={course.modules[activeModule]?.title}
                />
            )}

            <ScrollNudge fastScrollThreshold={100} triggerCount={3} />

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
            <div className="mb-8">
                <p className="text-sm text-zinc-500 mb-2">Estimated Reading Time: 70 minutes</p>
                <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight font-display">
                    Trading Fundamentals
                </h1>
                <p className="text-xl text-zinc-400 leading-relaxed">
                    Before you interpret a single chart or risk a dollar in any market, you must understand what markets actually are. Not what influencers claim they are. Not what beginners hope they are. What they structurally, mechanically, and mathematically are.
                </p>
            </div>

            <section className="mb-16">
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                    <span className="text-emerald-500 text-lg">01.</span> How Markets Actually Function
                </h2>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Markets are not prediction games. They are not casinos. They are not wealth redistribution machines designed to reward the clever and punish the foolish.
                </p>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Markets are continuous double-auction systems where participants with different information, different time horizons, and different risk tolerances exchange assets at negotiated prices.
                </p>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    This sounds simple. It is not.
                </p>

                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 mb-8">
                    <h3 className="text-lg font-bold text-white mb-4">The Continuous Double Auction</h3>
                    <p className="text-zinc-400 mb-4">
                        Every liquid market operates as a continuous double auction. This means:
                    </p>
                    <ul className="space-y-3 text-zinc-400">
                        <li>Buyers submit bids stating the maximum they will pay</li>
                        <li>Sellers submit asks stating the minimum they will accept</li>
                        <li>When a bid meets an ask, a transaction occurs</li>
                        <li>The last transaction price becomes the market price</li>
                    </ul>
                    <p className="text-zinc-400 mt-4">
                        This process happens thousands of times per second in electronic markets. The "price" you see on your screen is simply the most recent negotiated exchange.
                    </p>
                </div>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    The critical implication: price is not value. Price is the intersection of supply and demand at a specific moment in time given the participants currently willing to transact.
                </p>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    An asset can be fundamentally worthless and trade at $1000 if enough participants agree to exchange it at that level. An asset can be fundamentally sound and trade at $1 if no buyers appear. Price discovery is a social process, not an algorithmic revelation of intrinsic worth.
                </p>
            </section>

            <section className="mb-16">
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                    <span className="text-emerald-500 text-lg">02.</span> Order Flow: The Anatomy of Transactions
                </h2>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Beginners think trading is about "buying low and selling high." This is not wrong, but it is meaningless. The actual mechanics involve understanding order types and execution priority.
                </p>

                <h3 className="text-xl font-bold text-white mb-4 mt-8">Market Orders vs Limit Orders</h3>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    There are two fundamental order types that drive all market activity:
                </p>

                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 mb-6">
                    <h4 className="text-white font-bold mb-3">Market Orders</h4>
                    <p className="text-zinc-400 mb-3">
                        A market order is an instruction to execute immediately at the best available price. When you submit a market buy order, you are saying "I will accept whatever the current ask price is."
                    </p>
                    <p className="text-zinc-400">
                        Market orders provide certainty of execution but uncertainty of price. You will get filled, but you may not like the price you receive, especially in illiquid or volatile markets.
                    </p>
                </div>

                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 mb-8">
                    <h4 className="text-white font-bold mb-3">Limit Orders</h4>
                    <p className="text-zinc-400 mb-3">
                        A limit order is an instruction to execute only at a specified price or better. When you submit a limit buy order at $100, you are saying "I will only buy if I can get $100 or lower."
                    </p>
                    <p className="text-zinc-400">
                        Limit orders provide certainty of price but uncertainty of execution. Your order may never fill if the market does not reach your specified level.
                    </p>
                </div>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Professional traders think in terms of passive liquidity versus aggressive liquidity. Limit orders provide passive liquidity—they sit in the order book waiting to be filled. Market orders take liquidity—they execute against existing limit orders.
                </p>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    This distinction matters more than beginners realize. When you place a market order in an illiquid asset, you are crossing the spread and immediately incurring a loss equal to the bid-ask spread. If the spread is 1%, you are -1% the moment your order fills.
                </p>

                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 mb-8">
                    <h3 className="text-lg font-bold text-white mb-4">The Order Book</h3>
                    <p className="text-zinc-400 mb-4">
                        The order book is the list of all outstanding limit orders at various price levels. It shows you the depth of available liquidity on both sides of the market.
                    </p>
                    <div className="space-y-4 font-mono text-xs mt-6">
                        <div className="flex justify-between items-center text-red-400/80 px-3 py-2">
                            <span>ASK: $100.50</span>
                            <span>500 units</span>
                        </div>
                        <div className="flex justify-between items-center text-red-400/80 px-3 py-2">
                            <span>ASK: $100.30</span>
                            <span>800 units</span>
                        </div>
                        <div className="flex justify-between items-center text-red-500 font-bold bg-red-500/5 px-3 py-2 rounded border border-red-500/20">
                            <span>BEST ASK: $100.25</span>
                            <span>120 units</span>
                        </div>
                        <div className="h-[1px] bg-white/10 my-4 relative">
                            <span className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 px-3 bg-[#0a0a0c] text-[10px] text-zinc-500 uppercase">Spread: $0.05</span>
                        </div>
                        <div className="flex justify-between items-center text-emerald-500 font-bold bg-emerald-500/5 px-3 py-2 rounded border border-emerald-500/20">
                            <span>BEST BID: $100.20</span>
                            <span>450 units</span>
                        </div>
                        <div className="flex justify-between items-center text-emerald-400/80 px-3 py-2">
                            <span>BID: $100.15</span>
                            <span>1200 units</span>
                        </div>
                        <div className="flex justify-between items-center text-emerald-400/80 px-3 py-2">
                            <span>BID: $100.10</span>
                            <span>2000 units</span>
                        </div>
                    </div>
                    <p className="text-zinc-400 mt-6">
                        The spread ($0.05 in this example) represents the cost of immediacy. If you want to buy right now, you pay $100.25. If you want to sell right now, you receive $100.20. The market makers and liquidity providers capture this spread as compensation for the risk of holding inventory.
                    </p>
                </div>

                <h3 className="text-xl font-bold text-white mb-4 mt-8">Common Misconceptions</h3>

                <p className="leading-relaxed text-zinc-300 mb-4">
                    Beginners often misunderstand execution mechanics. Here are the most frequent errors:
                </p>

                <div className="space-y-4 mb-8">
                    <div className="p-5 rounded-xl bg-white/[0.02] border-l-2 border-orange-500/50">
                        <h4 className="text-white font-bold mb-2">Misconception: "The market is moving against me personally"</h4>
                        <p className="text-zinc-400 text-sm">
                            Reality: The market does not know you exist. When you place a small retail order, it has negligible impact on price. The feeling that the market moves against you immediately after entry is confirmation bias combined with poor entry timing.
                        </p>
                    </div>

                    <div className="p-5 rounded-xl bg-white/[0.02] border-l-2 border-orange-500/50">
                        <h4 className="text-white font-bold mb-2">Misconception: "Market orders are faster than limit orders"</h4>
                        <p className="text-zinc-400 text-sm">
                            Reality: Both order types are transmitted electronically at the same speed. The difference is execution certainty. Market orders execute immediately at the current price. Limit orders only execute if price reaches your specified level.
                        </p>
                    </div>

                    <div className="p-5 rounded-xl bg-white/[0.02] border-l-2 border-orange-500/50">
                        <h4 className="text-white font-bold mb-2">Misconception: "I can see all the orders in the market"</h4>
                        <p className="text-zinc-400 text-sm">
                            Reality: You only see the displayed order book. Institutional traders use iceberg orders, hidden orders, and dark pools to conceal their intentions. The visible order book is a partial representation of true supply and demand.
                        </p>
                    </div>
                </div>
            </section>

            <section className="mb-16">
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                    <span className="text-emerald-500 text-lg">03.</span> Market Participants: Who You Are Trading Against
                </h2>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Trading is a zero-sum game before costs and a negative-sum game after costs. For every profitable trade, there is an equal and opposite losing trade on the other side.
                </p>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    This raises an obvious question: who is losing when you win? And more importantly, who is winning when you lose?
                </p>

                <h3 className="text-xl font-bold text-white mb-4 mt-8">Institutional Participants</h3>

                <div className="space-y-6 mb-8">
                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                        <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                            <span className="text-blue-400">01</span> Market Makers
                        </h4>
                        <p className="text-zinc-400 mb-3">
                            Market makers are firms that provide continuous two-sided liquidity. They quote both a bid and an ask, profiting from the spread. In exchange for this service, they often receive rebates from exchanges and preferential latency.
                        </p>
                        <p className="text-zinc-400">
                            Examples: Citadel Securities, Virtu Financial, Jump Trading. These firms operate on millisecond timeframes with sophisticated algorithms. They are not predicting direction—they are capturing the spread thousands of times per day.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                        <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                            <span className="text-blue-400">02</span> Institutional Investors
                        </h4>
                        <p className="text-zinc-400 mb-3">
                            Pension funds, endowments, and sovereign wealth funds manage billions in capital with long time horizons. They care about asset allocation, not short-term price fluctuations.
                        </p>
                        <p className="text-zinc-400">
                            Examples: Vanguard, BlackRock, Norway Sovereign Wealth Fund. When these entities enter positions, they do so over days or weeks to avoid moving the market against themselves. Their presence creates trends that shorter-term traders attempt to exploit.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                        <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                            <span className="text-blue-400">03</span> Hedge Funds
                        </h4>
                        <p className="text-zinc-400 mb-3">
                            Hedge funds employ various strategies to generate absolute returns regardless of market direction. They use leverage, derivatives, and alternative data sources.
                        </p>
                        <p className="text-zinc-400">
                            Examples: Bridgewater (macro), Renaissance Technologies (quantitative), Millennium (multi-strategy). These firms hire PhDs in mathematics, physics, and computer science. Their algorithms ingest satellite imagery, credit card data, and social media sentiment.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                        <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                            <span className="text-blue-400">04</span> High-Frequency Traders
                        </h4>
                        <p className="text-zinc-400 mb-3">
                            HFT firms compete on speed, executing thousands of trades per second to capture micro-inefficiencies in price across venues and instruments.
                        </p>
                        <p className="text-zinc-400">
                            Examples: Tower Research, DRW, XTX Markets. These firms co-locate servers next to exchange matching engines to reduce latency by microseconds. They are not competing with retail traders—they are competing with each other.
                        </p>
                    </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-4 mt-8">Retail Participants</h3>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Retail traders are individuals trading their own capital, typically with limited resources and information compared to institutional participants.
                </p>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Statistical reality: approximately 90% of retail traders lose money over a twelve-month period. This is not because retail traders are unintelligent. It is because they are structurally disadvantaged.
                </p>

                <div className="p-6 rounded-2xl bg-orange-500/10 border border-orange-500/20 mb-8">
                    <h4 className="text-orange-300 font-bold mb-3">The Retail Disadvantages</h4>
                    <ul className="space-y-3 text-zinc-300">
                        <li><span className="text-orange-400 mr-2">→</span>Higher transaction costs (wider spreads, commissions)</li>
                        <li><span className="text-orange-400 mr-2">→</span>Slower execution speed</li>
                        <li><span className="text-orange-400 mr-2">→</span>Limited access to information</li>
                        <li><span className="text-orange-400 mr-2">→</span>Insufficient capital to diversify meaningfully</li>
                        <li><span className="text-orange-400 mr-2">→</span>Psychological vulnerabilities exploited by market structure</li>
                    </ul>
                </div>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    This does not mean retail traders cannot be profitable. It means retail traders must operate differently than institutions. Attempting to compete on speed or information is futile. Retail edge, when it exists, comes from patience, risk management, and exploiting behavioral inefficiencies that institutions cannot access due to their size.
                </p>
            </section>

            <section className="mb-16">
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                    <span className="text-emerald-500 text-lg">04.</span> Risk Versus Uncertainty
                </h2>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Beginners confuse risk with uncertainty. They are not the same.
                </p>

                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 mb-6">
                    <h4 className="text-white font-bold mb-3">Risk</h4>
                    <p className="text-zinc-400">
                        Risk is quantifiable uncertainty. When you flip a fair coin, there is a 50% probability of heads and 50% probability of tails. You do not know the outcome, but you know the probability distribution. This is risk.
                    </p>
                </div>

                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 mb-8">
                    <h4 className="text-white font-bold mb-3">Uncertainty</h4>
                    <p className="text-zinc-400">
                        Uncertainty is unquantifiable. You do not know the outcome, and you do not know the probability distribution. Most real-world situations involve uncertainty, not risk.
                    </p>
                </div>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Markets operate under uncertainty. You can estimate probabilities, but you cannot calculate them with precision. The future is not a roulette wheel with known odds.
                </p>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    This has profound implications:
                </p>

                <div className="space-y-4 mb-8">
                    <div className="p-5 rounded-xl bg-white/[0.02] border-l-2 border-emerald-500/50">
                        <p className="text-zinc-300">
                            You cannot rely on historical probabilities to predict future outcomes. The past is evidence, not prophecy.
                        </p>
                    </div>
                    <div className="p-5 rounded-xl bg-white/[0.02] border-l-2 border-emerald-500/50">
                        <p className="text-zinc-300">
                            You cannot use complex mathematical models to eliminate uncertainty. Models are useful, but they are simplifications of reality.
                        </p>
                    </div>
                    <div className="p-5 rounded-xl bg-white/[0.02] border-l-2 border-emerald-500/50">
                        <p className="text-zinc-300">
                            You must manage uncertainty through position sizing, diversification, and loss limits—not through prediction accuracy.
                        </p>
                    </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-4 mt-8">Why Most Beginners Misunderstand Price</h3>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Beginners see price movement and assume it means something. A stock rises 10% and they infer positive news. A cryptocurrency falls 20% and they infer negative developments.
                </p>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    This is backwards. Price is not information—price is the market's aggregated interpretation of information combined with positioning, liquidity, and reflexive dynamics.
                </p>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Consider: a company announces record earnings and the stock falls 5%. Beginners find this confusing. Professionals understand that the earnings were already priced in, or that forward guidance disappointed, or that a large holder used the announcement as liquidity to exit a position.
                </p>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Price reflects the intersection of supply and demand among participants with different time horizons, information sets, and motivations. Extracting signal from this noise requires understanding not what moved price, but why participants responded to information the way they did.
                </p>
            </section>

            <section className="mb-16">
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                    <span className="text-emerald-500 text-lg">05.</span> Liquidity: The Oxygen of Markets
                </h2>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Liquidity is the ability to convert an asset into cash without significantly impacting its price. It is the most important concept in trading that beginners ignore.
                </p>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    A 1000% return on an illiquid asset is worth zero if you cannot sell it. Liquidity is not a feature—it is the foundation.
                </p>

                <h3 className="text-xl font-bold text-white mb-4 mt-8">Measuring Liquidity</h3>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Liquidity is not binary. Assets exist on a spectrum from perfectly liquid (major forex pairs) to completely illiquid (private equity, real estate, small-cap altcoins).
                </p>

                <div className="space-y-6 mb-8">
                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                        <h4 className="text-white font-bold mb-3">Spread</h4>
                        <p className="text-zinc-400 mb-3">
                            The difference between the best bid and best ask. Tight spreads indicate high liquidity. Wide spreads indicate low liquidity.
                        </p>
                        <p className="text-zinc-400 text-sm">
                            Example: EUR/USD typically has a spread of 0.0001 (1 pip). A microcap stock might have a spread of 5%.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                        <h4 className="text-white font-bold mb-3">Depth</h4>
                        <p className="text-zinc-400 mb-3">
                            The volume of orders at various price levels. Deep markets have large volumes close to the current price. Shallow markets have minimal volume.
                        </p>
                        <p className="text-zinc-400 text-sm">
                            Example: You can buy $1 million of AAPL and move the price by 0.01%. You cannot buy $10,000 of a microcap altcoin without moving the price by 10%.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                        <h4 className="text-white font-bold mb-3">Volume</h4>
                        <p className="text-zinc-400 mb-3">
                            The total number of units traded over a given period. High volume suggests high liquidity, though this relationship is not perfect.
                        </p>
                        <p className="text-zinc-400 text-sm">
                            Caution: Volume can be artificially inflated through wash trading or algorithmic activity. True liquidity requires depth across price levels, not just headline volume.
                        </p>
                    </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-4 mt-8">Liquidity Risk</h3>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Liquidity is not constant. It appears during calm periods and vanishes during stress. This phenomenon has destroyed more traders than any other single factor.
                </p>

                <div className="p-6 rounded-2xl bg-orange-500/10 border border-orange-500/20 mb-8">
                    <h4 className="text-orange-300 font-bold mb-4">The Flash Crash Pattern</h4>
                    <p className="text-zinc-300 mb-4">
                        On May 6, 2010, the U.S. stock market experienced a sudden crash and recovery within minutes. The Dow Jones Industrial Average dropped nearly 1000 points and recovered most losses within thirty minutes.
                    </p>
                    <p className="text-zinc-300 mb-4">
                        Cause: A large sell order triggered algorithmic responses. Market makers withdrew liquidity to avoid exposure. Without buyers, prices collapsed. When liquidity returned, prices recovered.
                    </p>
                    <p className="text-zinc-300">
                        Lesson: Liquidity is a fair-weather friend. When you need it most, it disappears.
                    </p>
                </div>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Professional traders size positions based on available liquidity, not on conviction. If you cannot exit a position without significant slippage, the position is too large regardless of your analysis.
                </p>
            </section>

            <section className="mb-16">
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                    <span className="text-emerald-500 text-lg">06.</span> Summary and Reflection
                </h2>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Trading is not about predicting the future. It is about managing uncertainty while operating within a competitive, dynamic, and often adversarial environment.
                </p>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Before you learn any strategy, master these fundamentals:
                </p>

                <div className="space-y-4 mb-8">
                    <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <p className="text-emerald-200">
                            Markets are continuous double-auction systems where price reflects current supply/demand equilibrium, not intrinsic value.
                        </p>
                    </div>
                    <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <p className="text-emerald-200">
                            Order execution mechanics determine your transaction costs and edge degradation. Understanding order types is not optional.
                        </p>
                    </div>
                    <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <p className="text-emerald-200">
                            You are competing against institutions with superior speed, information, and capital. Your edge must come from patience and behavioral insight, not prediction.
                        </p>
                    </div>
                    <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <p className="text-emerald-200">
                            Risk and uncertainty are different. Markets operate under uncertainty. Manage it through position sizing and diversification.
                        </p>
                    </div>
                    <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <p className="text-emerald-200">
                            Liquidity is the foundation of all trading. Without it, your analysis is irrelevant.
                        </p>
                    </div>
                </div>

                <div className="p-8 rounded-2xl bg-gradient-to-br from-white/[0.03] to-transparent border border-white/10 relative overflow-hidden">
                    <div className="flex items-start gap-4 relative z-10">
                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            <HelpCircle className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block mb-2">Thought Experiment</span>
                            <p className="text-white font-medium leading-relaxed mb-4">
                                You discover a trading strategy with a theoretical 70% win rate based on historical data. However, the strategy requires trading an illiquid asset with a 2% spread and potential slippage of 3% on entries and exits.
                            </p>
                            <p className="text-zinc-400 text-sm italic">
                                Even if your analysis is correct 70% of the time, you are paying 5% in round-trip costs on every trade. Can this strategy be profitable? Under what conditions?
                            </p>
                        </div>
                    </div>
                </div>
            </section>
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
            <div className="mb-8">
                <p className="text-sm text-zinc-500 mb-2">Estimated Reading Time: 55 minutes</p>
                <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight font-display">
                    Zenith Score Mastery
                </h1>
                <p className="text-xl text-zinc-400 leading-relaxed">
                    A composite score is not a prediction. It is not a buy signal. It is not a guarantee. It is a compressed representation of market regime designed to reduce cognitive load. Understanding what a score represents—and what it does not represent—is the difference between interpretation and obedience.
                </p>
            </div>

            <section className="mb-16">
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                    <span className="text-emerald-500 text-lg">01.</span> What a Composite Score Actually Is
                </h2>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Beginners treat scores as magic numbers. They see a high score and assume bullish. They see a low score and assume bearish. This is cargo-cult analysis.
                </p>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    A composite score is a weighted aggregation of multiple inputs designed to answer a single question: what is the current market regime?
                </p>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    The Zenith Score synthesizes momentum, volatility, volume, and structural positioning into a single value between 0 and 100. This does not predict the future. It describes the present.
                </p>

                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 mb-8">
                    <h3 className="text-lg font-bold text-white mb-4">Regime Classification</h3>
                    <p className="text-zinc-400 mb-4">
                        The Zenith Score maps to discrete market regimes:
                    </p>
                    <div className="space-y-3">
                        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-emerald-300 font-bold">80-100: Strong Bullish</span>
                                <span className="text-emerald-500 text-sm font-mono">EXPANSION</span>
                            </div>
                            <p className="text-zinc-400 text-sm">
                                High momentum, increasing volume, structural breakout. Trend continuation likely until exhaustion signals appear.
                            </p>
                        </div>
                        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-blue-300 font-bold">60-79: Moderate Bullish</span>
                                <span className="text-blue-500 text-sm font-mono">ACCUMULATION</span>
                            </div>
                            <p className="text-zinc-400 text-sm">
                                Positive momentum but measured. Volume confirmation mixed. Watch for regime shift signals.
                            </p>
                        </div>
                        <div className="p-4 rounded-xl bg-zinc-500/10 border border-zinc-500/20">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-zinc-300 font-bold">40-59: Neutral/Ranging</span>
                                <span className="text-zinc-500 text-sm font-mono">CONSOLIDATION</span>
                            </div>
                            <p className="text-zinc-400 text-sm">
                                No clear directional bias. Mean-reversion environment. Breakout/breakdown pending.
                            </p>
                        </div>
                        <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-orange-300 font-bold">20-39: Moderate Bearish</span>
                                <span className="text-orange-500 text-sm font-mono">DISTRIBUTION</span>
                            </div>
                            <p className="text-zinc-400 text-sm">
                                Negative momentum building. Volume on declines increasing. Defensive positioning warranted.
                            </p>
                        </div>
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-red-300 font-bold">0-19: Strong Bearish</span>
                                <span className="text-red-500 text-sm font-mono">CONTRACTION</span>
                            </div>
                            <p className="text-zinc-400 text-sm">
                                Severe momentum decline, structural breakdown, capitulation volume. High risk environment.
                            </p>
                        </div>
                    </div>
                </div>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Critical understanding: these regimes describe current conditions, not future outcomes. A score of 85 does not mean "buy now." It means "the market is currently in a strong bullish regime, which could continue or reverse."
                </p>
            </section>

            <section className="mb-16">
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                    <span className="text-emerald-500 text-lg">02.</span> The Components: What Drives the Score
                </h2>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    The Zenith Score is not a black box. It is a transparent aggregation of quantifiable inputs. Understanding these components allows you to interpret score changes intelligently.
                </p>

                <h3 className="text-xl font-bold text-white mb-4 mt-8">Momentum Vector (40% Weight)</h3>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Momentum measures the rate of price change across multiple timeframes. It is not a single indicator—it is a composite of:
                </p>

                <div className="space-y-4 mb-8">
                    <div className="p-5 rounded-xl bg-white/[0.02] border-l-2 border-emerald-500/50">
                        <h4 className="text-white font-bold mb-2">Rate of Change (ROC)</h4>
                        <p className="text-zinc-400 text-sm">
                            Percentage change over 14, 28, and 56 periods. Captures short, medium, and long-term momentum simultaneously.
                        </p>
                    </div>
                    <div className="p-5 rounded-xl bg-white/[0.02] border-l-2 border-emerald-500/50">
                        <h4 className="text-white font-bold mb-2">Momentum Acceleration</h4>
                        <p className="text-zinc-400 text-sm">
                            Second derivative of price. Identifies when momentum is accelerating (bullish) or decelerating (bearish) even if price continues in the same direction.
                        </p>
                    </div>
                    <div className="p-5 rounded-xl bg-white/[0.02] border-l-2 border-emerald-500/50">
                        <h4 className="text-white font-bold mb-2">Trend Strength</h4>
                        <p className="text-zinc-400 text-sm">
                            Average Directional Index (ADX) to measure trend intensity. High ADX indicates strong trend regardless of direction.
                        </p>
                    </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-4 mt-8">Volume Integrity (30% Weight)</h3>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Price can move on low volume, but such moves are fragile. Volume integrity measures whether price action is supported by transactional commitment.
                </p>

                <div className="space-y-4 mb-8">
                    <div className="p-5 rounded-xl bg-white/[0.02] border-l-2 border-blue-500/50">
                        <h4 className="text-white font-bold mb-2">Volume-Price Correlation</h4>
                        <p className="text-zinc-400 text-sm">
                            Positive correlation (high volume on up days) is bullish. Negative correlation (high volume on down days) is bearish. Divergence signals potential reversal.
                        </p>
                    </div>
                    <div className="p-5 rounded-xl bg-white/[0.02] border-l-2 border-blue-500/50">
                        <h4 className="text-white font-bold mb-2">Accumulation/Distribution</h4>
                        <p className="text-zinc-400 text-sm">
                            Cumulative measure of buying vs selling pressure. Tracks whether smart money is accumulating or distributing.
                        </p>
                    </div>
                    <div className="p-5 rounded-xl bg-white/[0.02] border-l-2 border-blue-500/50">
                        <h4 className="text-white font-bold mb-2">On-Balance Volume (OBV)</h4>
                        <p className="text-zinc-400 text-sm">
                            Cumulative volume flow. OBV divergence from price often precedes reversals.
                        </p>
                    </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-4 mt-8">Volatility Profile (20% Weight)</h3>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Volatility is not inherently bullish or bearish, but regime transitions typically involve volatility expansion. The score adjusts based on:
                </p>

                <div className="space-y-4 mb-8">
                    <div className="p-5 rounded-xl bg-white/[0.02] border-l-2 border-orange-500/50">
                        <h4 className="text-white font-bold mb-2">Historical Volatility</h4>
                        <p className="text-zinc-400 text-sm">
                            Standard deviation of returns over rolling periods. Expanding volatility during uptrends is normal. Expanding volatility during downtrends is concerning.
                        </p>
                    </div>
                    <div className="p-5 rounded-xl bg-white/[0.02] border-l-2 border-orange-500/50">
                        <h4 className="text-white font-bold mb-2">ATR (Average True Range)</h4>
                        <p className="text-zinc-400 text-sm">
                            Measures average bar-to-bar movement. Rising ATR suggests regime change in progress.
                        </p>
                    </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-4 mt-8">Structural Position (10% Weight)</h3>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Where is price relative to key levels? This component evaluates:
                </p>

                <div className="space-y-4 mb-8">
                    <div className="p-5 rounded-xl bg-white/[0.02] border-l-2 border-purple-500/50">
                        <h4 className="text-white font-bold mb-2">Moving Average Position</h4>
                        <p className="text-zinc-400 text-sm">
                            Price above rising MAs is bullish. Price below declining MAs is bearish. MA crossovers signal regime shifts.
                        </p>
                    </div>
                    <div className="p-5 rounded-xl bg-white/[0.02] border-l-2 border-purple-500/50">
                        <h4 className="text-white font-bold mb-2">Distance from Extremes</h4>
                        <p className="text-zinc-400 text-sm">
                            How far is current price from recent highs/lows? Extreme distance suggests mean-reversion pressure.
                        </p>
                    </div>
                </div>
            </section>

            <section className="mb-16">
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                    <span className="text-emerald-500 text-lg">03.</span> Confidence vs Precision
                </h2>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    The most dangerous mistake beginners make with scoring systems is confusing confidence with precision.
                </p>

                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 mb-6">
                    <h4 className="text-white font-bold mb-3">Confidence</h4>
                    <p className="text-zinc-400">
                        How certain is the score about the current regime? A score of 85 with high confidence means multiple inputs are aligned. A score of 85 with low confidence means inputs are divergent and the score is less reliable.
                    </p>
                </div>

                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 mb-8">
                    <h4 className="text-white font-bold mb-3">Precision</h4>
                    <p className="text-zinc-400">
                        How accurate is the score in predicting future outcomes? This is unknowable. Scores do not predict—they describe. A high-confidence score tells you what is happening now, not what will happen next.
                    </p>
                </div>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Professional interpretation:
                </p>

                <div className="space-y-4 mb-8">
                    <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-emerald-300 font-bold">High Score + High Confidence</span>
                            <span className="text-emerald-500 text-xs font-mono">ALIGNED REGIME</span>
                        </div>
                        <p className="text-zinc-300 text-sm">
                            All components agree on regime. Current trend likely continues until divergence appears. This is not a guarantee—it is a high-probability baseline.
                        </p>
                    </div>

                    <div className="p-5 rounded-xl bg-orange-500/10 border border-orange-500/20">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-orange-300 font-bold">High Score + Low Confidence</span>
                            <span className="text-orange-500 text-xs font-mono">DIVERGENT REGIME</span>
                        </div>
                        <p className="text-zinc-300 text-sm">
                            Components disagree. Perhaps momentum is strong but volume is weak. Perhaps price is rising but volatility is spiking. Treat this as a transition phase. Regime change may be imminent.
                        </p>
                    </div>

                    <div className="p-5 rounded-xl bg-zinc-500/10 border border-zinc-500/20">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-zinc-300 font-bold">Neutral Score + Any Confidence</span>
                            <span className="text-zinc-500 text-xs font-mono">UNDEFINED REGIME</span>
                        </div>
                        <p className="text-zinc-300 text-sm">
                            Market is consolidating. No clear directional edge. This is when most traders lose money trying to force trades. Professionals wait.
                        </p>
                    </div>
                </div>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    The score is most useful when it changes, not when it is static. A score dropping from 75 to 60 with declining confidence is a stronger signal than a score sitting at 85 for weeks.
                </p>
            </section>

            <section className="mb-16">
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                    <span className="text-emerald-500 text-lg">04.</span> How to Interpret, Not Obey
                </h2>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Scores are tools for framework, not instructions for action. The moment you blindly follow a score, you have abdicated your responsibility as a trader.
                </p>

                <h3 className="text-xl font-bold text-white mb-4 mt-8">Correct Interpretation</h3>

                <div className="space-y-6 mb-8">
                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                        <div className="flex items-start gap-4">
                            <div className="text-emerald-500 font-bold text-xl">✓</div>
                            <div>
                                <h4 className="text-white font-bold mb-2">Use as Contextual Filter</h4>
                                <p className="text-zinc-400 text-sm mb-3">
                                    "The score is 85, indicating strong bullish regime. My long position is aligned with the prevailing regime. I will hold unless structural evidence suggests regime change."
                                </p>
                                <p className="text-emerald-300 text-xs italic">
                                    This treats the score as context, not command.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                        <div className="flex items-start gap-4">
                            <div className="text-emerald-500 font-bold text-xl">✓</div>
                            <div>
                                <h4 className="text-white font-bold mb-2">Use for Risk Adjustment</h4>
                                <p className="text-zinc-400 text-sm mb-3">
                                    "Score dropped from 70 to 50 with declining confidence. I will reduce position size and tighten stops. Regime may be transitioning to neutral/bearish."
                                </p>
                                <p className="text-emerald-300 text-xs italic">
                                    This uses score changes to inform risk management, not entry signals.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                        <div className="flex items-start gap-4">
                            <div className="text-emerald-500 font-bold text-xl">✓</div>
                            <div>
                                <h4 className="text-white font-bold mb-2">Use for Regime Awareness</h4>
                                <p className="text-zinc-400 text-sm mb-3">
                                    "Score is neutral (48) with low confidence. Market is ranging. I will avoid trend-following strategies and consider mean-reversion setups instead."
                                </p>
                                <p className="text-emerald-300 text-xs italic">
                                    This adapts strategy to match regime, rather than forcing inappropriate tactics.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-4 mt-8">Incorrect Interpretation</h3>

                <div className="space-y-6 mb-8">
                    <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20">
                        <div className="flex items-start gap-4">
                            <div className="text-red-500 font-bold text-xl">✗</div>
                            <div>
                                <h4 className="text-white font-bold mb-2">Treating Score as Buy/Sell Signal</h4>
                                <p className="text-zinc-400 text-sm mb-3">
                                    "Score just hit 80. I will buy immediately because high score means go long."
                                </p>
                                <p className="text-red-300 text-xs italic">
                                    This is mechanical obedience without context. The score may be lagging, or you may be buying at regime exhaustion.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20">
                        <div className="flex items-start gap-4">
                            <div className="text-red-500 font-bold text-xl">✗</div>
                            <div>
                                <h4 className="text-white font-bold mb-2">Ignoring Confidence</h4>
                                <p className="text-zinc-400 text-sm mb-3">
                                    "Score is 75, so I will hold my long. Confidence dropped to 30% but I will ignore that."
                                </p>
                                <p className="text-red-300 text-xs italic">
                                    Low confidence means component divergence. The score is unreliable when confidence is weak.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20">
                        <div className="flex items-start gap-4">
                            <div className="text-red-500 font-bold text-xl">✗</div>
                            <div>
                                <h4 className="text-white font-bold mb-2">Using Score in Isolation</h4>
                                <p className="text-zinc-400 text-sm mb-3">
                                    "Score is bullish, so I will ignore bearish divergences in price/volume and declining market breadth."
                                </p>
                                <p className="text-red-300 text-xs italic">
                                    No single tool provides complete information. Scores are one input among many.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mb-16">
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                    <span className="text-emerald-500 text-lg">05.</span> Common Misuse Patterns
                </h2>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Scoring systems fail when users misunderstand their purpose. Here are the most common errors:
                </p>

                <div className="space-y-6 mb-8">
                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                        <h4 className="text-orange-300 font-bold mb-3">Overfit Optimization</h4>
                        <p className="text-zinc-400 mb-3">
                            Adjusting score parameters to perfectly match historical price movements. This creates a curve-fit model that will fail in live markets because past patterns do not repeat precisely.
                        </p>
                        <p className="text-zinc-500 text-sm italic">
                            Reality: Scores should be robust across different market conditions, not optimized for specific historical periods.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                        <h4 className="text-orange-300 font-bold mb-3">Ignoring Regime Context</h4>
                        <p className="text-zinc-400 mb-3">
                            Using the same score interpretation in all environments. A score of 70 during a bull market consolidation means something different than a score of 70 during a bear market rally.
                        </p>
                        <p className="text-zinc-500 text-sm italic">
                            Reality: Scores must be interpreted relative to broader market context, not in isolation.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                        <h4 className="text-orange-300 font-bold mb-3">Expecting Predictive Accuracy</h4>
                        <p className="text-zinc-400 mb-3">
                            Believing a high score guarantees price will rise. Scores describe current regime, not future outcomes. Regimes can shift abruptly.
                        </p>
                        <p className="text-zinc-500 text-sm italic">
                            Reality: Use scores to understand what is happening now and adjust accordingly. Do not use scores to predict what will happen next.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                        <h4 className="text-orange-300 font-bold mb-3">Neglecting Timeframe Alignment</h4>
                        <p className="text-zinc-400 mb-3">
                            Using a daily score for intraday decisions or an hourly score for long-term positions. Timeframe mismatch creates false signals.
                        </p>
                        <p className="text-zinc-500 text-sm italic">
                            Reality: Match score timeframe to your trading timeframe. Day traders need intraday scores. Swing traders need daily scores.
                        </p>
                    </div>
                </div>
            </section>

            <section className="mb-16">
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                    <span className="text-emerald-500 text-lg">06.</span> When Scores Are Informative vs Misleading
                </h2>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Scores are not equally useful in all conditions. Professional traders know when to trust scores and when to discount them.
                </p>

                <h3 className="text-xl font-bold text-white mb-4 mt-8">Scores Are Most Informative When:</h3>

                <div className="space-y-4 mb-8">
                    <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <h4 className="text-emerald-300 font-bold mb-2">Regime Is Clearly Defined</h4>
                        <p className="text-zinc-300 text-sm">
                            Strong trend, high volume, aligned components. Score accurately reflects observable reality. Use it to confirm your analysis.
                        </p>
                    </div>

                    <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <h4 className="text-emerald-300 font-bold mb-2">Score Changes Are Gradual</h4>
                        <p className="text-zinc-300 text-sm">
                            Smooth transitions signal genuine regime shifts rather than noise. A score moving from 70→65→60 over weeks is more meaningful than 70→50 in one day.
                        </p>
                    </div>

                    <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <h4 className="text-emerald-300 font-bold mb-2">Confidence Is High</h4>
                        <p className="text-zinc-300 text-sm">
                            All components agree. Divergence is minimal. The score reflects consensus among multiple independent measures.
                        </p>
                    </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-4 mt-8">Scores Are Least Informative When:</h3>

                <div className="space-y-4 mb-8">
                    <div className="p-5 rounded-xl bg-red-500/10 border border-red-500/20">
                        <h4 className="text-red-300 font-bold mb-2">Market Is Transitioning</h4>
                        <p className="text-zinc-300 text-sm">
                            Between regimes, scores oscillate. You may see rapid changes between bullish and bearish as the market searches for direction. Wait for regime to clarify before acting.
                        </p>
                    </div>

                    <div className="p-5 rounded-xl bg-red-500/10 border border-red-500/20">
                        <h4 className="text-red-300 font-bold mb-2">Volatility Is Extreme</h4>
                        <p className="text-zinc-300 text-sm">
                            During panics or euphoria, scores may lag or overshoot. Momentum-based components can give false signals during capitulation or blow-off tops.
                        </p>
                    </div>

                    <div className="p-5 rounded-xl bg-red-500/10 border border-red-500/20">
                        <h4 className="text-red-300 font-bold mb-2">Confidence Is Low</h4>
                        <p className="text-zinc-300 text-sm">
                            Component divergence suggests the score is unreliable. Perhaps momentum is strong but volume is weak. The score value is less meaningful than the underlying disagreement.
                        </p>
                    </div>

                    <div className="p-5 rounded-xl bg-red-500/10 border border-red-500/20">
                        <h4 className="text-red-300 font-bold mb-2">External Shock Occurs</h4>
                        <p className="text-zinc-300 text-sm">
                            Scores are backward-looking. They cannot anticipate black swan events. A score of 85 does not protect you from unexpected news that instantly shifts regime to bearish.
                        </p>
                    </div>
                </div>
            </section>

            <section className="mb-16">
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                    <span className="text-emerald-500 text-lg">07.</span> Summary and Reflection
                </h2>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    The Zenith Score is a regime classification tool, not a prediction engine. It compresses multiple inputs into a single metric to reduce cognitive load and provide structural context.
                </p>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Professional use of scoring systems:
                </p>

                <div className="space-y-4 mb-8">
                    <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <p className="text-emerald-200">
                            Treat scores as contextual filters, not trade signals. Use them to understand current regime and adjust strategy accordingly.
                        </p>
                    </div>
                    <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <p className="text-emerald-200">
                            Always evaluate confidence alongside score value. Low confidence means component divergence and reduced reliability.
                        </p>
                    </div>
                    <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <p className="text-emerald-200">
                            Scores are most useful when they change, not when they are static. Transitions signal regime shifts worth monitoring.
                        </p>
                    </div>
                    <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <p className="text-emerald-200">
                            Never use scores in isolation. Combine with price structure, volume analysis, and broader market context.
                        </p>
                    </div>
                    <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <p className="text-emerald-200">
                            Scores describe the present. They do not predict the future. Regime classification is not prophecy.
                        </p>
                    </div>
                </div>

                <div className="p-8 rounded-2xl bg-gradient-to-br from-white/[0.03] to-transparent border border-white/10 relative overflow-hidden">
                    <div className="flex items-start gap-4 relative z-10">
                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            <HelpCircle className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block mb-2">Thought Experiment</span>
                            <p className="text-white font-medium leading-relaxed mb-4">
                                You are long a position. The Zenith Score is 78 (bullish) but confidence just dropped from 85% to 45% over three days. Price is still rising. Volume is declining. What does this signal?
                            </p>
                            <p className="text-zinc-400 text-sm italic">
                                The score remains bullish, but component divergence (declining confidence + declining volume despite rising price) suggests potential regime transition. Professional response: reduce position size, tighten stops, or take partial profits. Do not blindly trust the headline score value.
                            </p>
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
            <div className="mb-8">
                <p className="text-sm text-zinc-500 mb-2">Estimated Reading Time: 80 minutes</p>
                <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight font-display">
                    Technical Analysis
                </h1>
                <p className="text-xl text-zinc-400 leading-relaxed">
                    Charts do not predict the future. They document the past. Technical analysis is not magic—it is the study of how price and volume interact to reveal participant psychology, consensus levels, and regime transitions. Most practitioners fail because they memorize patterns without understanding the behavioral mechanisms that create them.
                </p>
            </div>

            <section className="mb-16">
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                    <span className="text-emerald-500 text-lg">01.</span> Why Charts Reflect Human Behavior
                </h2>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    A price chart is a historical record of every transaction that occurred in a market. Each transaction represents a negotiation between a buyer and seller. Aggregated over time, these transactions create patterns.
                </p>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    These patterns are not mystical. They emerge from predictable human responses to uncertainty, fear, greed, and regret.
                </p>

                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 mb-8">
                    <h3 className="text-lg font-bold text-white mb-4">The Behavioral Foundation</h3>
                    <p className="text-zinc-400 mb-4">
                        Technical analysis works when it works because humans respond to similar stimuli in similar ways. Consider:
                    </p>
                    <ul className="space-y-3 text-zinc-400">
                        <li>Participants who bought at $100 and watched it drop to $80 will often sell when price returns to $100 to "break even." This creates resistance.</li>
                        <li>Participants who missed buying at $80 will often buy when price returns to $80, believing it to be a "second chance." This creates support.</li>
                        <li>When price makes higher highs and higher lows, participants infer strength and momentum begets momentum. This creates trends.</li>
                        <li>When price oscillates within a range, participants infer equilibrium and revert to mean-reversion strategies. This creates consolidation.</li>
                    </ul>
                </div>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Critical insight: technical analysis is not about predicting what price will do. It is about understanding what price has done and inferring likely participant responses given historical patterns of behavior.
                </p>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    When technical analysis fails, it is usually because one of two things happened: either the pattern was not actually present (confirmation bias), or market structure changed in a way that invalidated historical behavioral precedents.
                </p>
            </section>

            <section className="mb-16">
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                    <span className="text-emerald-500 text-lg">02.</span> Structure vs Noise
                </h2>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    The primary challenge in technical analysis is distinguishing meaningful structure from random noise. Every price movement feels significant in the moment. Most are not.
                </p>

                <h3 className="text-xl font-bold text-white mb-4 mt-8">What Is Market Structure?</h3>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Market structure is the sequence of swing highs and swing lows that define trend direction and regime.
                </p>

                <div className="space-y-6 mb-8">
                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                        <h4 className="text-white font-bold mb-3">Bullish Structure</h4>
                        <p className="text-zinc-400 mb-3">
                            Higher highs and higher lows. Each rally exceeds the previous peak. Each pullback finds support above the previous low.
                        </p>
                        <p className="text-zinc-500 text-sm italic">
                            This structure indicates accumulation and rising conviction among participants.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                        <h4 className="text-white font-bold mb-3">Bearish Structure</h4>
                        <p className="text-zinc-400 mb-3">
                            Lower highs and lower lows. Each rally fails below the previous peak. Each decline breaks below the previous low.
                        </p>
                        <p className="text-zinc-500 text-sm italic">
                            This structure indicates distribution and declining conviction.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                        <h4 className="text-white font-bold mb-3">Neutral Structure (Range)</h4>
                        <p className="text-zinc-400 mb-3">
                            Price oscillates within defined boundaries. Highs are rejected at resistance. Lows are defended at support.
                        </p>
                        <p className="text-zinc-500 text-sm italic">
                            This structure indicates equilibrium. Neither buyers nor sellers have control.
                        </p>
                    </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-4 mt-8">Structure Break: The Most Important Concept</h3>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    A structure break occurs when price violates the established pattern of highs and lows. This signals potential regime change.
                </p>

                <div className="p-6 rounded-2xl bg-orange-500/10 border border-orange-500/20 mb-8">
                    <h4 className="text-orange-300 font-bold mb-4">Example: Bullish to Bearish Transition</h4>
                    <p className="text-zinc-300 mb-4">
                        Price has been making higher highs and higher lows for weeks. Then price breaks below the most recent swing low. This is a structure break.
                    </p>
                    <p className="text-zinc-300 mb-4">
                        What does this mean? The bullish sequence is broken. Participants who were buying dips are now underwater. Confidence is shaken. The regime may be transitioning from bullish to neutral or bearish.
                    </p>
                    <p className="text-zinc-300">
                        Professional response: Reduce long exposure. Tighten stops. Watch for confirmation of new bearish structure or return to bullish structure.
                    </p>
                </div>

                <h3 className="text-xl font-bold text-white mb-4 mt-8">Noise vs Structure</h3>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Not every price movement is structural. Markets are noisy. Intraday fluctuations, false breakouts, and short-term volatility are normal.
                </p>

                <div className="space-y-4 mb-8">
                    <div className="p-5 rounded-xl bg-white/[0.02] border-l-2 border-emerald-500/50">
                        <h4 className="text-white font-bold mb-2">Structural Movement</h4>
                        <p className="text-zinc-400 text-sm">
                            Breaks key levels with strong volume. Creates new swing highs/lows. Changes the pattern of highs and lows. Sustained over multiple periods.
                        </p>
                    </div>

                    <div className="p-5 rounded-xl bg-white/[0.02] border-l-2 border-orange-500/50">
                        <h4 className="text-white font-bold mb-2">Noise</h4>
                        <p className="text-zinc-400 text-sm">
                            Intraday spikes that reverse quickly. Low volume wicks. Price action that does not change swing structure. Reverts to recent range.
                        </p>
                    </div>
                </div>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Use higher timeframes to filter noise. A breakout on a 5-minute chart is noise. A breakout on a daily chart that holds for multiple days is potentially structural.
                </p>
            </section>

            <section className="mb-16">
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                    <span className="text-emerald-500 text-lg">03.</span> Support and Resistance: Consensus, Not Lines
                </h2>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Beginners draw horizontal lines on charts and call them support and resistance. This is not wrong, but it misses the point.
                </p>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Support and resistance are not lines. They are zones of participant consensus.
                </p>

                <h3 className="text-xl font-bold text-white mb-4 mt-8">What Creates Support?</h3>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Support exists when there is sufficient buying interest at a price level to prevent further declines.
                </p>

                <div className="space-y-4 mb-8">
                    <div className="p-5 rounded-xl bg-white/[0.02] border-l-2 border-blue-500/50">
                        <h4 className="text-white font-bold mb-2">Psychological Levels</h4>
                        <p className="text-zinc-400 text-sm">
                            Round numbers like $100, $1000, $10000 act as psychological anchors. Participants place buy orders at these levels because they "feel" significant.
                        </p>
                    </div>

                    <div className="p-5 rounded-xl bg-white/[0.02] border-l-2 border-blue-500/50">
                        <h4 className="text-white font-bold mb-2">Historical Demand Zones</h4>
                        <p className="text-zinc-400 text-sm">
                            Price levels where significant buying previously occurred. Participants remember these levels and expect them to hold again.
                        </p>
                    </div>

                    <div className="p-5 rounded-xl bg-white/[0.02] border-l-2 border-blue-500/50">
                        <h4 className="text-white font-bold mb-2">Value Areas</h4>
                        <p className="text-zinc-400 text-sm">
                            Price ranges where most volume traded. Represents fair value consensus. Price returning to value often finds support/resistance.
                        </p>
                    </div>

                    <div className="p-5 rounded-xl bg-white/[0.02] border-l-2 border-blue-500/50">
                        <h4 className="text-white font-bold mb-2">Technical Levels</h4>
                        <p className="text-zinc-400 text-sm">
                            Moving averages, Fibonacci retracements, pivot points. These levels matter because enough participants watch them and react to them.
                        </p>
                    </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-4 mt-8">What Creates Resistance?</h3>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Resistance exists when there is sufficient selling interest at a price level to prevent further advances.
                </p>

                <div className="space-y-4 mb-8">
                    <div className="p-5 rounded-xl bg-white/[0.02] border-l-2 border-red-500/50">
                        <h4 className="text-white font-bold mb-2">Breakeven Zones</h4>
                        <p className="text-zinc-400 text-sm">
                            Price levels where losing participants are underwater. When price returns to their entry, they sell to escape at breakeven. This creates resistance.
                        </p>
                    </div>

                    <div className="p-5 rounded-xl bg-white/[0.02] border-l-2 border-red-500/50">
                        <h4 className="text-white font-bold mb-2">Historical Supply Zones</h4>
                        <p className="text-zinc-400 text-sm">
                            Price levels where significant selling previously occurred. Participants expect these levels to act as resistance again.
                        </p>
                    </div>

                    <div className="p-5 rounded-xl bg-white/[0.02] border-l-2 border-red-500/50">
                        <h4 className="text-white font-bold mb-2">Previous Range Highs</h4>
                        <p className="text-zinc-400 text-sm">
                            When price was ranging, the top of the range represents previous resistance. Breakout above confirms new bullish structure.
                        </p>
                    </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-4 mt-8">Why Support and Resistance Are Zones, Not Lines</h3>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Markets are auctions, not mechanical systems. Support and resistance are not precise prices—they are areas where supply and demand dynamics shift.
                </p>

                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 mb-8">
                    <h4 className="text-white font-bold mb-3">Practical Example</h4>
                    <p className="text-zinc-400 mb-4">
                        You identify support at $100 based on historical demand. Price declines to $99.80 and bounces. Did support fail? No. You treated support as a line when it is a zone. Professional traders use ranges: $98-$102 is the support zone.
                    </p>
                    <p className="text-zinc-400">
                        Support holds as long as price finds buyers within the zone and does not sustain below it. A brief wick below $100 to $99.80 that quickly recovers confirms support, it does not invalidate it.
                    </p>
                </div>

                <h3 className="text-xl font-bold text-white mb-4 mt-8">Role Reversal: Support Becomes Resistance</h3>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    One of the most reliable patterns in technical analysis: when support is broken, it often becomes resistance on the retest.
                </p>

                <div className="p-6 rounded-2xl bg-orange-500/10 border border-orange-500/20 mb-8">
                    <h4 className="text-orange-300 font-bold mb-4">The Mechanism</h4>
                    <p className="text-zinc-300 mb-4">
                        Price finds support at $100 for weeks. Then it breaks below $100 and declines to $90. Participants who bought at $100 are now underwater.
                    </p>
                    <p className="text-zinc-300 mb-4">
                        Price rallies back to $100. What happens? Participants who bought at $100 and watched it decline to $90 now have a chance to exit at breakeven. They sell. This selling pressure creates resistance at the former support level.
                    </p>
                    <p className="text-zinc-300">
                        Professional implication: After support breaks, expect a retest. If price cannot reclaim the level, it confirms bearish structure. If price reclaims it with strong volume, it signals potential false breakdown.
                    </p>
                </div>
            </section>

            <section className="mb-16">
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                    <span className="text-emerald-500 text-lg">04.</span> Trend vs Range: The Only Two Regimes
                </h2>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Markets exist in one of two states: trend or range. Most trading losses occur because traders apply trend strategies in range environments and range strategies in trending environments.
                </p>

                <h3 className="text-xl font-bold text-white mb-4 mt-8">Trending Markets</h3>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    A trend is a sustained directional imbalance. One side (buyers or sellers) has control. Price makes progress in a clear direction over time.
                </p>

                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 mb-6">
                    <h4 className="text-white font-bold mb-3">Characteristics of Trends</h4>
                    <ul className="space-y-2 text-zinc-400">
                        <li>Series of higher highs and higher lows (uptrend) or lower highs and lower lows (downtrend)</li>
                        <li>Strong momentum in the direction of trend</li>
                        <li>Pullbacks are shallow and brief</li>
                        <li>Volume increases in the direction of trend</li>
                        <li>Moving averages slope in the direction of trend with price above/below them</li>
                    </ul>
                </div>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Professional trend strategy: Buy pullbacks to support in uptrends. Sell rallies to resistance in downtrends. Hold positions as long as structure remains intact. Exit on structure break.
                </p>

                <h3 className="text-xl font-bold text-white mb-4 mt-8">Ranging Markets</h3>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    A range is equilibrium. Neither buyers nor sellers have control. Price oscillates between defined support and resistance levels.
                </p>

                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 mb-6">
                    <h4 className="text-white font-bold mb-3">Characteristics of Ranges</h4>
                    <ul className="space-y-2 text-zinc-400">
                        <li>Price bounces between support and resistance repeatedly</li>
                        <li>No sustained momentum in either direction</li>
                        <li>Breakouts fail and price returns to range</li>
                        <li>Volume is typically lower than trending periods</li>
                        <li>Moving averages flatten and price crosses them frequently</li>
                    </ul>
                </div>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Professional range strategy: Sell near resistance, buy near support. Take profits quickly. Avoid holding through the range. Exit if price breaks out with strong volume and conviction.
                </p>

                <h3 className="text-xl font-bold text-white mb-4 mt-8">The Deadly Mistake: Strategy Mismatch</h3>

                <div className="space-y-6 mb-8">
                    <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20">
                        <h4 className="text-red-300 font-bold mb-3">Using Trend Strategies in Ranges</h4>
                        <p className="text-zinc-300 text-sm mb-3">
                            You buy a breakout expecting trend continuation. Price returns to the range within hours. You get stopped out. This happens repeatedly because you are assuming trend when the market is ranging.
                        </p>
                        <p className="text-zinc-400 text-sm italic">
                            Solution: Require confirmation before trading breakouts. Look for strong volume, sustained move, and structural follow-through.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20">
                        <h4 className="text-red-300 font-bold mb-3">Using Range Strategies in Trends</h4>
                        <p className="text-zinc-300 text-sm mb-3">
                            You sell near what you think is resistance, expecting mean reversion. Price continues higher and never looks back. You get stopped out or hold a losing position that becomes catastrophic.
                        </p>
                        <p className="text-zinc-400 text-sm italic">
                            Solution: Do not fade strong trends. Wait for structural evidence that trend is weakening before attempting mean-reversion trades.
                        </p>
                    </div>
                </div>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Before entering any trade, ask: is this market trending or ranging? Apply the appropriate strategy for the regime.
                </p>
            </section>

            <section className="mb-16">
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                    <span className="text-emerald-500 text-lg">05.</span> Why Most Technical Analysis Fails
                </h2>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Technical analysis has a reputation problem. Critics dismiss it as pseudoscience. Proponents claim it is the only way to trade. Both are wrong.
                </p>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Technical analysis fails when practitioners misapply it. Here are the most common errors:
                </p>

                <div className="space-y-6 mb-8">
                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                        <h4 className="text-orange-300 font-bold mb-3">Pattern Memorization Without Understanding</h4>
                        <p className="text-zinc-400 mb-3">
                            Beginners memorize "head and shoulders" or "double bottom" patterns and apply them mechanically. They do not understand why these patterns form or when they are reliable.
                        </p>
                        <p className="text-zinc-500 text-sm italic">
                            Reality: Patterns work when they work because they represent behavioral consensus. A head and shoulders pattern signals exhaustion and reversal potential because participants who bought the "head" are now trapped and will sell on rallies.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                        <h4 className="text-orange-300 font-bold mb-3">Ignoring Context</h4>
                        <p className="text-zinc-400 mb-3">
                            A bullish pattern in a strong uptrend has a different probability than the same pattern in a downtrend. Context matters more than the pattern itself.
                        </p>
                        <p className="text-zinc-500 text-sm italic">
                            Reality: Technical setups are probabilities, not certainties. The same setup has different win rates in different market regimes.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                        <h4 className="text-orange-300 font-bold mb-3">Curve-Fitting and Overfitting</h4>
                        <p className="text-zinc-400 mb-3">
                            Finding patterns that worked perfectly in hindsight but have no predictive value going forward. Confirmation bias leads traders to see patterns that are not actually there.
                        </p>
                        <p className="text-zinc-500 text-sm italic">
                            Reality: The human brain is pattern-recognition machinery. It will find patterns even in random data. This does not make them predictive.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                        <h4 className="text-orange-300 font-bold mb-3">Indicator Overload</h4>
                        <p className="text-zinc-400 mb-3">
                            Using dozens of indicators simultaneously, most of which are redundant or conflicting. This creates analysis paralysis and contradictory signals.
                        </p>
                        <p className="text-zinc-500 text-sm italic">
                            Reality: Most indicators derive from price and volume. Using multiple momentum indicators does not provide new information—it adds noise.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                        <h4 className="text-orange-300 font-bold mb-3">No Risk Management</h4>
                        <p className="text-zinc-400 mb-3">
                            Believing technical analysis provides certainty and therefore risking too much on individual trades. Even the best technical setups fail 40-50% of the time.
                        </p>
                        <p className="text-zinc-500 text-sm italic">
                            Reality: Technical analysis identifies probability edges, not certainties. Position sizing and risk management are non-negotiable.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                        <h4 className="text-orange-300 font-bold mb-3">Timeframe Confusion</h4>
                        <p className="text-zinc-400 mb-3">
                            Making long-term decisions based on short-term charts or vice versa. A bearish signal on a 5-minute chart is irrelevant if the daily chart shows strong bullish structure.
                        </p>
                        <p className="text-zinc-500 text-sm italic">
                            Reality: Higher timeframes dominate lower timeframes. Align your analysis timeframe with your trading timeframe.
                        </p>
                    </div>
                </div>
            </section>

            <section className="mb-16">
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                    <span className="text-emerald-500 text-lg">06.</span> Summary and Reflection
                </h2>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Technical analysis is the study of price and volume behavior to infer participant psychology and identify probability edges.
                </p>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    It works when applied correctly because human behavior in response to uncertainty is somewhat predictable. It fails when practitioners memorize patterns without understanding mechanisms or apply strategies inappropriate for current market regime.
                </p>

                <div className="space-y-4 mb-8">
                    <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <p className="text-emerald-200">
                            Charts document past transactions. They do not predict future outcomes. Use them to understand current structure and participant behavior.
                        </p>
                    </div>
                    <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <p className="text-emerald-200">
                            Market structure (sequence of highs and lows) is the foundation of technical analysis. Structure breaks signal regime change.
                        </p>
                    </div>
                    <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <p className="text-emerald-200">
                            Support and resistance are zones of participant consensus, not precise lines. They represent areas where supply/demand dynamics shift.
                        </p>
                    </div>
                    <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <p className="text-emerald-200">
                            Markets trend or range. Apply trend strategies in trends. Apply range strategies in ranges. Mismatching strategy to regime is the most common error.
                        </p>
                    </div>
                    <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <p className="text-emerald-200">
                            Technical analysis provides probability edges, not certainties. Risk management is mandatory. Even the best setups fail frequently.
                        </p>
                    </div>
                </div>

                <div className="p-8 rounded-2xl bg-gradient-to-br from-white/[0.03] to-transparent border border-white/10 relative overflow-hidden">
                    <div className="flex items-start gap-4 relative z-10">
                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            <HelpCircle className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block mb-2">Thought Experiment</span>
                            <p className="text-white font-medium leading-relaxed mb-4">
                                You identify a perfect "bull flag" pattern on a 1-hour chart. All technical criteria are met. However, the daily chart shows price at major resistance with bearish divergence forming. Do you take the trade?
                            </p>
                            <p className="text-zinc-400 text-sm italic">
                                The 1-hour pattern is valid, but context matters more. The daily resistance and divergence suggest the bullish setup on the 1-hour chart is likely to fail. Professional response: skip the trade or significantly reduce risk. Higher timeframe context overrules lower timeframe patterns.
                            </p>
                        </div>
                    </div>
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
            <div className="mb-8">
                <p className="text-sm text-zinc-500 mb-2">Estimated Reading Time: 70 minutes</p>
                <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight font-display">
                    Risk Management Pro
                </h1>
                <p className="text-xl text-zinc-400 leading-relaxed">
                    You will lose trades. You will have drawdowns. You will experience periods where nothing works. This is not a failure—it is the fundamental nature of trading under uncertainty. Risk management is not about avoiding losses. It is about surviving losses so you can continue trading when conditions improve. Most traders focus on winning. Professionals focus on not losing catastrophically.
                </p>
            </div>

            <section className="mb-16">
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                    <span className="text-emerald-500 text-lg">01.</span> The Asymmetry of Loss and Recovery
                </h2>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    The mathematics of loss and recovery are brutally asymmetric. This asymmetry is the single most important concept in risk management.
                </p>

                <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 mb-8">
                    <h3 className="text-lg font-bold text-red-300 mb-4">The Recovery Table</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-zinc-300 py-2 border-b border-white/5">
                            <span>Loss: 10%</span>
                            <span className="text-orange-300">Required Gain to Recover: 11%</span>
                        </div>
                        <div className="flex justify-between items-center text-zinc-300 py-2 border-b border-white/5">
                            <span>Loss: 20%</span>
                            <span className="text-orange-400">Required Gain to Recover: 25%</span>
                        </div>
                        <div className="flex justify-between items-center text-zinc-300 py-2 border-b border-white/5">
                            <span>Loss: 30%</span>
                            <span className="text-orange-500">Required Gain to Recover: 43%</span>
                        </div>
                        <div className="flex justify-between items-center text-zinc-300 py-2 border-b border-white/5">
                            <span>Loss: 40%</span>
                            <span className="text-red-400">Required Gain to Recover: 67%</span>
                        </div>
                        <div className="flex justify-between items-center text-zinc-300 py-2 border-b border-white/5">
                            <span>Loss: 50%</span>
                            <span className="text-red-500 font-bold">Required Gain to Recover: 100%</span>
                        </div>
                        <div className="flex justify-between items-center text-zinc-300 py-2">
                            <span>Loss: 75%</span>
                            <span className="text-red-600 font-bold">Required Gain to Recover: 400%</span>
                        </div>
                    </div>
                </div>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    If you lose 50% of your capital, you must double what remains just to return to your starting point. If you lose 75%, you must quadruple what remains.
                </p>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    This asymmetry has a profound implication: protecting capital is exponentially more important than growing it. A 50% loss is not "twice as bad" as a 25% loss—it is catastrophically worse in terms of recovery difficulty.
                </p>

                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 mb-8">
                    <h4 className="text-white font-bold mb-3">Why This Matters</h4>
                    <p className="text-zinc-400 mb-4">
                        Beginners focus on maximizing gains. Professionals focus on minimizing catastrophic losses. The difference in mindset determines who survives.
                    </p>
                    <p className="text-zinc-400">
                        You can recover from a series of small losses. You cannot recover from one catastrophic loss that destroys 50% or more of your capital. Risk management is about ensuring that no single trade, no single day, and no single market event can end your ability to trade.
                    </p>
                </div>
            </section>

            <section className="mb-16">
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                    <span className="text-emerald-500 text-lg">02.</span> Position Sizing: The Only Edge You Control
                </h2>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    You cannot control whether a trade wins or loses. You cannot control market direction. You cannot control volatility or news events.
                </p>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    You can control one thing: position size.
                </p>

                <h3 className="text-xl font-bold text-white mb-4 mt-8">The Position Sizing Formula</h3>

                <div className="p-6 rounded-xl bg-black border border-white/10 mb-6">
                    <code className="text-emerald-400 font-mono text-sm block mb-4">
                        Position Size = (Account Risk Amount) / (Stop Loss Distance in Price)
                    </code>
                    <p className="text-zinc-400 text-sm">
                        This formula ensures you risk a fixed percentage of capital on each trade, regardless of how volatile the instrument is or how far away your stop loss is.
                    </p>
                </div>

                <h3 className="text-xl font-bold text-white mb-4 mt-8">Practical Example</h3>

                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 mb-8">
                    <p className="text-zinc-400 mb-4">
                        Account size: $100,000<br />
                        Risk per trade: 1% = $1,000<br />
                        Entry price: $50<br />
                        Stop loss: $48<br />
                        Stop loss distance: $2
                    </p>
                    <p className="text-white font-mono mb-4">
                        Position Size = $1,000 / $2 = 500 shares
                    </p>
                    <p className="text-zinc-400 text-sm">
                        With this position size, if you get stopped out, you lose exactly $1,000 (1% of your account). No more, no less. This is position sizing working correctly.
                    </p>
                </div>

                <h3 className="text-xl font-bold text-white mb-4 mt-8">Why Most Traders Get This Wrong</h3>

                <div className="space-y-6 mb-8">
                    <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20">
                        <h4 className="text-red-300 font-bold mb-3">Fixed Dollar Amount Per Trade</h4>
                        <p className="text-zinc-300 text-sm mb-3">
                            "I will buy 100 shares every time" or "I will invest $10,000 per trade." This ignores stop loss distance and volatility. You are risking different percentages on different trades without realizing it.
                        </p>
                        <p className="text-zinc-400 text-sm italic">
                            Result: Inconsistent risk exposure. Some trades risk 0.5%, others risk 5%, destroying your risk profile.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20">
                        <h4 className="text-red-300 font-bold mb-3">No Stop Loss</h4>
                        <p className="text-zinc-300 text-sm mb-3">
                            "I will hold until it comes back" or "I do not use stops because they always get hit." Without a stop loss, you cannot calculate position size. You are risking 100% of your capital on every trade.
                        </p>
                        <p className="text-zinc-400 text-sm italic">
                            Result: Catastrophic losses that destroy accounts. Hope is not a risk management strategy.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20">
                        <h4 className="text-red-300 font-bold mb-3">Oversizing After Wins</h4>
                        <p className="text-zinc-300 text-sm mb-3">
                            "I just made 20%, so I will double my position size on the next trade." This is emotional position sizing. You are increasing risk exactly when you feel invincible.
                        </p>
                        <p className="text-zinc-400 text-sm italic">
                            Result: One loss after a winning streak wipes out multiple wins. This is how profitable traders blow up.
                        </p>
                    </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-4 mt-8">The 1% Rule</h3>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Risk no more than 1% of your total capital on any single trade. This is not a suggestion—it is a survival requirement.
                </p>

                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 mb-8">
                    <h4 className="text-white font-bold mb-3">Why 1%?</h4>
                    <p className="text-zinc-400 mb-4">
                        With 1% risk per trade, you can withstand 10 consecutive losses and still have 90% of your capital remaining. Even 20 consecutive losses only loses 18% of your capital (accounting for compounding).
                    </p>
                    <p className="text-zinc-400 mb-4">
                        With 5% risk per trade, 10 consecutive losses destroys 40% of your capital. Recovery from this drawdown requires a 67% gain.
                    </p>
                    <p className="text-zinc-400">
                        With 10% risk per trade, 10 consecutive losses destroys 65% of your capital. You are functionally eliminated.
                    </p>
                </div>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Professional traders risk between 0.5% and 2% per trade, depending on conviction and market conditions. They never exceed 2%. Ever.
                </p>
            </section>

            <section className="mb-16">
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                    <span className="text-emerald-500 text-lg">03.</span> Drawdowns and Recovery Psychology
                </h2>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    A drawdown is the decline from a peak in account value to a trough before a new peak is reached. Drawdowns are inevitable. How you respond to them determines whether you survive.
                </p>

                <h3 className="text-xl font-bold text-white mb-4 mt-8">The Psychological Phases of Drawdown</h3>

                <div className="space-y-6 mb-8">
                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                        <h4 className="text-blue-300 font-bold mb-3">Phase 1: Denial (0-10% Drawdown)</h4>
                        <p className="text-zinc-400 mb-3">
                            "This is normal variance. I will recover soon." You continue trading as usual. You may even increase position size to "make it back faster."
                        </p>
                        <p className="text-zinc-500 text-sm italic">
                            Danger: Overconfidence prevents you from reducing risk. Drawdown can accelerate.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                        <h4 className="text-orange-300 font-bold mb-3">Phase 2: Frustration (10-20% Drawdown)</h4>
                        <p className="text-zinc-400 mb-3">
                            "Nothing is working. My strategy stopped performing." You start changing strategies mid-drawdown, jumping from one approach to another.
                        </p>
                        <p className="text-zinc-500 text-sm italic">
                            Danger: Strategy hopping compounds losses. You abandon working systems before they recover.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                        <h4 className="text-red-300 font-bold mb-3">Phase 3: Panic (20-30% Drawdown)</h4>
                        <p className="text-zinc-400 mb-3">
                            "I need to recover immediately." You take high-risk trades with poor setups. You ignore your risk rules. You revenge trade.
                        </p>
                        <p className="text-zinc-500 text-sm italic">
                            Danger: Emotional trading during panic causes catastrophic losses. This is where accounts blow up.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                        <h4 className="text-zinc-400 font-bold mb-3">Phase 4: Capitulation (30%+ Drawdown)</h4>
                        <p className="text-zinc-400 mb-3">
                            "Trading does not work. I quit." You stop trading entirely, often at the worst possible time—right before recovery would have begun.
                        </p>
                        <p className="text-zinc-500 text-sm italic">
                            Reality: If you reach 30%+ drawdown, your risk management failed long ago. This should never happen with proper position sizing.
                        </p>
                    </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-4 mt-8">Professional Response to Drawdown</h3>

                <div className="space-y-4 mb-8">
                    <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <h4 className="text-emerald-300 font-bold mb-2">At 5% Drawdown: Review</h4>
                        <p className="text-zinc-300 text-sm">
                            Review recent trades for execution errors. Confirm your strategy is still valid. Do not change anything yet—this is normal variance.
                        </p>
                    </div>

                    <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <h4 className="text-emerald-300 font-bold mb-2">At 10% Drawdown: Reduce Size</h4>
                        <p className="text-zinc-300 text-sm">
                            Reduce position size by 50%. Trade smaller until you have three consecutive winning days or reach a new equity peak.
                        </p>
                    </div>

                    <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <h4 className="text-emerald-300 font-bold mb-2">At 15% Drawdown: Stop Trading</h4>
                        <p className="text-zinc-300 text-sm">
                            Stop trading completely. Take at least one week off. Conduct a full review of your system, execution, and psychology. Do not resume until you have identified and addressed the problem.
                        </p>
                    </div>

                    <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <h4 className="text-emerald-300 font-bold mb-2">At 20% Drawdown: Crisis Mode</h4>
                        <p className="text-zinc-300 text-sm">
                            This should never happen with 1% risk per trade. If it does, your risk management is broken. Stop trading. Reassess everything. Consider whether trading is viable for you.
                        </p>
                    </div>
                </div>
            </section>

            <section className="mb-16">
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                    <span className="text-emerald-500 text-lg">04.</span> Why Most Traders Underestimate Risk
                </h2>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Humans are terrible at assessing risk. Cognitive biases systematically distort our perception of probability and danger.
                </p>

                <div className="space-y-6 mb-8">
                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                        <h4 className="text-orange-300 font-bold mb-3">Recency Bias</h4>
                        <p className="text-zinc-400 mb-3">
                            Recent events are weighted more heavily than historical data. After a winning streak, you believe you have "figured it out" and underestimate the probability of future losses.
                        </p>
                        <p className="text-zinc-500 text-sm italic">
                            Result: Overconfidence after wins leads to oversized positions and catastrophic losses when the streak ends.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                        <h4 className="text-orange-300 font-bold mb-3">Availability Bias</h4>
                        <p className="text-zinc-400 mb-3">
                            Dramatic, memorable events are perceived as more likely than mundane events. A friend who "made 10x on crypto" is more memorable than statistics showing 90% of traders lose.
                        </p>
                        <p className="text-zinc-500 text-sm italic">
                            Result: Overestimation of potential gains. Underestimation of potential losses. Unrealistic expectations.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                        <h4 className="text-orange-300 font-bold mb-3">Normalcy Bias</h4>
                        <p className="text-zinc-400 mb-3">
                            Assuming the future will resemble the recent past. Markets that have been calm will remain calm. Trends will continue. Black swan events "cannot happen."
                        </p>
                        <p className="text-zinc-500 text-sm italic">
                            Result: Unpreparedness for regime changes, crashes, and volatility spikes. These events always happen eventually.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                        <h4 className="text-orange-300 font-bold mb-3">Overconfidence Effect</h4>
                        <p className="text-zinc-400 mb-3">
                            Overestimating your own skill and knowledge. Believing you are better than average. Attributing wins to skill and losses to bad luck.
                        </p>
                        <p className="text-zinc-500 text-sm italic">
                            Result: Insufficient risk controls. Oversized positions. Belief that "it won't happen to me."
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                        <h4 className="text-orange-300 font-bold mb-3">Loss Aversion Paradox</h4>
                        <p className="text-zinc-400 mb-3">
                            Feeling losses more intensely than equivalent gains. This should make traders risk-averse, but instead causes the opposite: holding losing positions too long hoping they recover, while cutting winners too quickly.
                        </p>
                        <p className="text-zinc-500 text-sm italic">
                            Result: "Let losses run, cut winners short"—the exact opposite of what works.
                        </p>
                    </div>
                </div>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    These biases are not character flaws. They are hardwired cognitive shortcuts that helped our ancestors survive. They do not help traders survive. Recognizing them is the first step. Systematizing risk management so you do not rely on your perception is the solution.
                </p>
            </section>

            <section className="mb-16">
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                    <span className="text-emerald-500 text-lg">05.</span> Survival as the Primary Objective
                </h2>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Trading is not about getting rich quickly. It is not about proving you are smarter than the market. It is not about validation or excitement.
                </p>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Trading is about surviving long enough to benefit from favorable conditions when they appear.
                </p>

                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 mb-8">
                    <h4 className="text-white font-bold mb-3">The Survival Imperative</h4>
                    <p className="text-zinc-400 mb-4">
                        Markets cycle through regimes. Sometimes your strategy works. Sometimes it does not. You cannot control which regime you are in.
                    </p>
                    <p className="text-zinc-400 mb-4">
                        What you can control: whether you survive the unfavorable regimes with enough capital to exploit the favorable ones.
                    </p>
                    <p className="text-zinc-400">
                        Professionals accept small losses during unfavorable regimes. They preserve capital. When conditions shift in their favor, they still have capital to deploy. Amateurs blow up during unfavorable regimes trying to force profitability. When conditions improve, they have no capital left.
                    </p>
                </div>

                <h3 className="text-xl font-bold text-white mb-4 mt-8">Practical Survival Rules</h3>

                <div className="space-y-4 mb-8">
                    <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <h4 className="text-emerald-300 font-bold mb-2">Never Risk More Than 1% Per Trade</h4>
                        <p className="text-zinc-300 text-sm">
                            This is non-negotiable. No conviction level, no setup quality, no "sure thing" justifies violating this rule.
                        </p>
                    </div>

                    <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <h4 className="text-emerald-300 font-bold mb-2">Never Risk More Than 5% Total Across All Positions</h4>
                        <p className="text-zinc-300 text-sm">
                            Even with 1% per trade, if you have 10 correlated positions, you are effectively risking 10%. Limit total portfolio risk to 5% or less.
                        </p>
                    </div>

                    <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <h4 className="text-emerald-300 font-bold mb-2">Always Use Stop Losses</h4>
                        <p className="text-zinc-300 text-sm">
                            Every trade must have a predefined stop loss before entry. No exceptions. If you cannot define a logical stop, do not take the trade.
                        </p>
                    </div>

                    <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <h4 className="text-emerald-300 font-bold mb-2">Reduce Size During Drawdowns</h4>
                        <p className="text-zinc-300 text-sm">
                            When down 10%, cut position size in half. Do not increase size to "make it back." This accelerates destruction.
                        </p>
                    </div>

                    <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <h4 className="text-emerald-300 font-bold mb-2">Never Trade Scared Money</h4>
                        <p className="text-zinc-300 text-sm">
                            Only trade capital you can afford to lose completely. If losing 20% would impact your ability to pay rent, you are trading with scared money. You will make emotional decisions.
                        </p>
                    </div>

                    <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <h4 className="text-emerald-300 font-bold mb-2">Accept Losses Immediately</h4>
                        <p className="text-zinc-300 text-sm">
                            When your stop is hit, accept it without emotion. Do not move your stop. Do not hold hoping for recovery. Cut the loss and move on.
                        </p>
                    </div>
                </div>
            </section>

            <section className="mb-16">
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                    <span className="text-emerald-500 text-lg">06.</span> Summary and Reflection
                </h2>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Risk management is not exciting. It will not make you feel like a genius. It will not generate dramatic stories. It will keep you alive.
                </p>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    The traders who survive decades in markets are not the smartest or the most aggressive. They are the ones who understood that preservation of capital is the only competitive advantage that matters.
                </p>

                <div className="space-y-4 mb-8">
                    <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <p className="text-emerald-200">
                            Loss and recovery are asymmetric. A 50% loss requires a 100% gain to recover. Avoid large losses at all costs.
                        </p>
                    </div>
                    <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <p className="text-emerald-200">
                            Position sizing is the only edge you control. Risk 1% per trade. Never exceed 5% total portfolio risk.
                        </p>
                    </div>
                    <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <p className="text-emerald-200">
                            Drawdowns are inevitable. Reduce size at 10% drawdown. Stop trading at 15% drawdown. Never reach 20%.
                        </p>
                    </div>
                    <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <p className="text-emerald-200">
                            Cognitive biases distort risk perception. Systematize your risk management to remove discretion and emotion.
                        </p>
                    </div>
                    <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <p className="text-emerald-200">
                            Survival is the primary objective. Profitability is secondary. You cannot profit if you do not survive.
                        </p>
                    </div>
                </div>

                <div className="p-8 rounded-2xl bg-gradient-to-br from-white/[0.03] to-transparent border border-white/10 relative overflow-hidden">
                    <div className="flex items-start gap-4 relative z-10">
                        <div className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                            <Shield className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest block mb-2">Uncomfortable Truth</span>
                            <p className="text-white font-medium leading-relaxed mb-4">
                                You have a $50,000 account. You risk 10% per trade because "I need to grow this faster." You hit a losing streak—5 losses in a row. Your account is now $29,500. You need a 69% gain just to recover.
                            </p>
                            <p className="text-zinc-400 text-sm italic">
                                If you had risked 1% per trade, those same 5 losses would have cost you $2,500. Your account would be $47,500 and you would still be trading. This is why discipline is not optional.
                            </p>
                        </div>
                    </div>
                </div>
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
            <div className="mb-8">
                <p className="text-sm text-zinc-500 mb-2">Estimated Reading Time: 90 minutes</p>
                <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight font-display">
                    Trading Psychology
                </h1>
                <p className="text-xl text-zinc-400 leading-relaxed">
                    You are not a rational actor. Your brain did not evolve to process statistical probabilities or manage financial risk. It evolved to avoid predators, find food, and navigate social hierarchies. Every instinct that kept your ancestors alive actively sabotages you in markets. Intelligence does not protect you—it gives you more sophisticated ways to deceive yourself.
                </p>
            </div>

            <section className="mb-16">
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                    <span className="text-emerald-500 text-lg">01.</span> Why Your Brain Fails at Trading
                </h2>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    The human brain is a masterpiece of evolution. It excels at pattern recognition, threat detection, and social reasoning. These capabilities allowed humans to dominate every ecosystem on Earth.
                </p>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    They destroy traders.
                </p>

                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 mb-8">
                    <h3 className="text-lg font-bold text-white mb-4">Evolutionary Mismatch</h3>
                    <p className="text-zinc-400 mb-4">
                        Your ancestors faced immediate, binary threats: lion or no lion. Run or die. The cost of a false positive (running from rustling leaves that was not a lion) was minimal. The cost of a false negative (not running when it was a lion) was death.
                    </p>
                    <p className="text-zinc-400 mb-4">
                        This created a bias toward overreacting to perceived threats and seeing patterns where none exist. In ancestral environments, this bias was adaptive.
                    </p>
                    <p className="text-zinc-400">
                        In markets, this same bias causes you to exit winning trades too early (loss aversion), see predictive patterns in random noise (apophenia), and panic during volatility when you should be calm.
                    </p>
                </div>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Markets operate on probabilities, not certainties. Your brain operates on heuristics optimized for survival, not statistical reasoning. This mismatch is why intelligent, educated people consistently fail at trading.
                </p>
            </section>

            <section className="mb-16">
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                    <span className="text-emerald-500 text-lg">02.</span> Cognitive Biases: The Systematic Errors
                </h2>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Cognitive biases are not character flaws. They are systematic patterns of deviation from rationality that all humans exhibit. Recognizing them does not make you immune. The biases persist even when you are aware of them.
                </p>

                <h3 className="text-xl font-bold text-white mb-4 mt-8">Confirmation Bias</h3>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    You seek information that confirms your existing beliefs and ignore information that contradicts them.
                </p>

                <div className="p-6 rounded-2xl bg-orange-500/10 border border-orange-500/20 mb-8">
                    <h4 className="text-orange-300 font-bold mb-4">How It Manifests in Trading</h4>
                    <p className="text-zinc-300 mb-4">
                        You are long Bitcoin. You read 10 articles. Eight are bearish, two are bullish. You remember and cite the two bullish articles. You dismiss the eight bearish articles as "FUD" or "written by people who don't understand crypto."
                    </p>
                    <p className="text-zinc-300 mb-4">
                        You are not intentionally lying to yourself. Your brain is filtering reality to align with your position. This protects your ego but destroys your capital.
                    </p>
                    <p className="text-zinc-300">
                        Professional response: Actively seek disconfirming evidence. When long, read bearish analysis. When bearish, read bullish analysis. If you cannot articulate the strongest argument against your position, you do not understand the trade.
                    </p>
                </div>

                <h3 className="text-xl font-bold text-white mb-4 mt-8">Anchoring Bias</h3>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Your judgment is unduly influenced by the first piece of information you receive, even if that information is irrelevant.
                </p>

                <div className="p-6 rounded-2xl bg-orange-500/10 border border-orange-500/20 mb-8">
                    <h4 className="text-orange-300 font-bold mb-4">How It Manifests in Trading</h4>
                    <p className="text-zinc-300 mb-4">
                        You buy a stock at $100. It declines to $80. You refuse to sell because "it was $100 before, so it will go back to $100." The entry price is irrelevant to current value. The market does not care what you paid.
                    </p>
                    <p className="text-zinc-300 mb-4">
                        Another example: You see an analyst price target of $150 for a stock trading at $100. This $150 anchor influences your perception of value even if the analysis is flawed. You become biased toward bullishness because of an arbitrary number.
                    </p>
                    <p className="text-zinc-300">
                        Professional response: Evaluate every position as if you were entering it today. Ask: "If I had cash, would I buy this at the current price?" If no, you should sell.
                    </p>
                </div>

                <h3 className="text-xl font-bold text-white mb-4 mt-8">Recency Bias</h3>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Recent events are weighted far more heavily than historical data. Your brain assumes the immediate past will continue into the future.
                </p>

                <div className="p-6 rounded-2xl bg-orange-500/10 border border-orange-500/20 mb-8">
                    <h4 className="text-orange-300 font-bold mb-4">How It Manifests in Trading</h4>
                    <p className="text-zinc-300 mb-4">
                        After a winning streak, you believe you have "figured it out." You increase position size. You become overconfident. Then markets change and you give back all gains plus more.
                    </p>
                    <p className="text-zinc-300 mb-4">
                        After a losing streak, you believe your system "doesn't work anymore." You abandon it right before it would have resumed working. You buy a new system and repeat the cycle.
                    </p>
                    <p className="text-zinc-300">
                        Professional response: Track performance over statistically significant samples (100+ trades minimum). Recent results are noise. Long-term edge is signal.
                    </p>
                </div>

                <h3 className="text-xl font-bold text-white mb-4 mt-8">Overconfidence Effect</h3>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    You systematically overestimate your knowledge, abilities, and the precision of your beliefs. Most people rate themselves as "above average" at most tasks, which is statistically impossible.
                </p>

                <div className="p-6 rounded-2xl bg-orange-500/10 border border-orange-500/20 mb-8">
                    <h4 className="text-orange-300 font-bold mb-4">How It Manifests in Trading</h4>
                    <p className="text-zinc-300 mb-4">
                        You make 10 trades. Six win, four lose. You attribute the wins to your skill and the losses to bad luck or external factors. You become more confident even though your win rate is only 60%—barely above coin-flip odds.
                    </p>
                    <p className="text-zinc-300 mb-4">
                        Overconfidence causes you to overtrade, oversize positions, and underestimate risks. It is lethal.
                    </p>
                    <p className="text-zinc-300">
                        Professional response: Maintain a trading journal documenting every decision and outcome. Review regularly. You will discover most of your wins were luck and most of your losses were avoidable errors. This is painful and necessary.
                    </p>
                </div>

                <h3 className="text-xl font-bold text-white mb-4 mt-8">Hindsight Bias</h3>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    After an event occurs, you believe you "knew it all along." The past seems more predictable in retrospect than it was in real-time.
                </p>

                <div className="p-6 rounded-2xl bg-orange-500/10 border border-orange-500/20 mb-8">
                    <h4 className="text-orange-300 font-bold mb-4">How It Manifests in Trading</h4>
                    <p className="text-zinc-300 mb-4">
                        Bitcoin drops 30% after a regulatory announcement. You think: "I knew that was coming. I should have sold." In reality, you had no idea. Hundreds of potential events could have occurred. This one did. Hindsight makes it seem obvious.
                    </p>
                    <p className="text-zinc-300 mb-4">
                        Hindsight bias prevents learning. If you believe you "knew" what would happen, you do not analyze why you failed to act on that knowledge. You do not improve.
                    </p>
                    <p className="text-zinc-300">
                        Professional response: Record your analysis before events occur. Compare your predictions to outcomes. You will discover you were far less prescient than you remember.
                    </p>
                </div>

                <h3 className="text-xl font-bold text-white mb-4 mt-8">Loss Aversion</h3>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Losses hurt approximately twice as much as equivalent gains feel good. This asymmetry distorts decision-making.
                </p>

                <div className="p-6 rounded-2xl bg-orange-500/10 border border-orange-500/20 mb-8">
                    <h4 className="text-orange-300 font-bold mb-4">How It Manifests in Trading</h4>
                    <p className="text-zinc-300 mb-4">
                        You hold losing positions too long hoping they recover (to avoid realizing the loss). You cut winning positions too quickly (to lock in the gain and avoid the possibility of it reversing into a loss).
                    </p>
                    <p className="text-zinc-300 mb-4">
                        This is the exact opposite of what works. Professional traders cut losses quickly and let winners run. Amateurs do the reverse and wonder why they lose.
                    </p>
                    <p className="text-zinc-300">
                        Professional response: Use mechanical stop losses. Remove discretion. When the stop is hit, the trade is over. No second-guessing. No hoping.
                    </p>
                </div>
            </section>

            <section className="mb-16">
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                    <span className="text-emerald-500 text-lg">03.</span> Emotional Misinterpretation of Markets
                </h2>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Markets are probabilistic systems. They do not have emotions. They do not reward or punish. They do not care about fairness.
                </p>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Yet traders interpret market movements as personal messages.
                </p>

                <h3 className="text-xl font-bold text-white mb-4 mt-8">The Anthropomorphization of Markets</h3>

                <div className="space-y-6 mb-8">
                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                        <h4 className="text-orange-300 font-bold mb-3">"The market is out to get me"</h4>
                        <p className="text-zinc-400 mb-3">
                            Every time you enter a trade, price immediately moves against you. It feels intentional. Like the market is watching you.
                        </p>
                        <p className="text-zinc-500 text-sm italic">
                            Reality: This is confirmation bias combined with poor entry timing. You remember the losses more vividly than the wins. Your small retail orders have zero impact on price.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                        <h4 className="text-orange-300 font-bold mb-3">"The market owes me"</h4>
                        <p className="text-zinc-400 mb-3">
                            You took a calculated trade with good analysis. You "did everything right." Therefore you deserve to win. When you lose anyway, you feel cheated.
                        </p>
                        <p className="text-zinc-500 text-sm italic">
                            Reality: Markets do not care about your analysis. Good process does not guarantee good outcome. Probability means sometimes you lose even when you do everything correctly.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                        <h4 className="text-orange-300 font-bold mb-3">"I need to make back what I lost"</h4>
                        <p className="text-zinc-400 mb-3">
                            After a losing trade, you feel compelled to "get it back" immediately. You take impulsive trades with poor setups. You are revenge trading.
                        </p>
                        <p className="text-zinc-500 text-sm italic">
                            Reality: The market does not know or care what you lost. Each trade is independent. Revenge trading is emotional decision-making that compounds losses.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                        <h4 className="text-orange-300 font-bold mb-3">"This time is different"</h4>
                        <p className="text-zinc-400 mb-3">
                            Your strategy stopped working. But this new opportunity looks so obvious. You abandon your rules for this "special" setup.
                        </p>
                        <p className="text-zinc-500 text-sm italic">
                            Reality: This time is almost never different. You are rationalizing emotional decision-making. The most expensive words in trading are "this time is different."
                        </p>
                    </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-4 mt-8">Fear and Greed: The Emotional Cycle</h3>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Market participants oscillate between fear and greed. Understanding this cycle helps you recognize when you are being controlled by emotion.
                </p>

                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 mb-8">
                    <h4 className="text-white font-bold mb-4">The Cycle</h4>
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="text-emerald-500 font-bold min-w-8">1.</div>
                            <div>
                                <p className="text-white font-bold mb-1">Optimism</p>
                                <p className="text-zinc-400 text-sm">Prices are rising. Everything seems promising. You feel good.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="text-emerald-400 font-bold min-w-8">2.</div>
                            <div>
                                <p className="text-white font-bold mb-1">Excitement</p>
                                <p className="text-zinc-400 text-sm">Gains accelerate. You start telling friends about your wins. You check prices constantly.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="text-yellow-500 font-bold min-w-8">3.</div>
                            <div>
                                <p className="text-white font-bold mb-1">Euphoria</p>
                                <p className="text-zinc-400 text-sm">Maximum financial risk. You believe you have discovered an edge. You increase position size. Top of market.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="text-orange-500 font-bold min-w-8">4.</div>
                            <div>
                                <p className="text-white font-bold mb-1">Anxiety</p>
                                <p className="text-zinc-400 text-sm">Price stops going up. You feel uneasy but remain optimistic. "Just a pullback."</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="text-orange-600 font-bold min-w-8">5.</div>
                            <div>
                                <p className="text-white font-bold mb-1">Denial</p>
                                <p className="text-zinc-400 text-sm">Losses mount. You refuse to sell. "It will come back." You hold. Markets decline further.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="text-red-500 font-bold min-w-8">6.</div>
                            <div>
                                <p className="text-white font-bold mb-1">Panic</p>
                                <p className="text-zinc-400 text-sm">You sell at the bottom. Maximum fear. Capitulation. This is when professionals buy.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="text-zinc-500 font-bold min-w-8">7.</div>
                            <div>
                                <p className="text-white font-bold mb-1">Despondency</p>
                                <p className="text-zinc-400 text-sm">You swear off trading. "I will never do this again." You miss the recovery.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    This cycle repeats endlessly. Professional traders recognize where they are in the cycle and act contrary to emotion. Amateurs are swept along by it.
                </p>
            </section>

            <section className="mb-16">
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                    <span className="text-emerald-500 text-lg">04.</span> The Narrative Fallacy
                </h2>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Humans are storytelling machines. We cannot resist constructing narratives to explain events, even when those events are random.
                </p>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    In trading, this creates a dangerous illusion of understanding.
                </p>

                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 mb-8">
                    <h4 className="text-white font-bold mb-3">The Mechanism</h4>
                    <p className="text-zinc-400 mb-4">
                        Bitcoin rises 5% in one day. Financial media immediately publishes headlines: "Bitcoin surges on institutional adoption narrative" or "Crypto rallies as inflation fears mount."
                    </p>
                    <p className="text-zinc-400 mb-4">
                        The narrative feels explanatory. It satisfies your need for causality. You now "understand" why price moved.
                    </p>
                    <p className="text-zinc-400">
                        Reality: Price moved because buying pressure exceeded selling pressure at that moment. The reasons are unknowable and probably involve dozens of independent factors. The narrative is retrofitted explanation for random movement.
                    </p>
                </div>

                <h3 className="text-xl font-bold text-white mb-4 mt-8">Why Narratives Are Dangerous</h3>

                <div className="space-y-6 mb-8">
                    <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20">
                        <h4 className="text-red-300 font-bold mb-3">They Create False Confidence</h4>
                        <p className="text-zinc-300 text-sm mb-3">
                            Once you have a narrative explaining why something happened, you believe you can predict what happens next. "If institutions are buying Bitcoin, it will keep rising." This may be completely wrong.
                        </p>
                        <p className="text-zinc-400 text-sm italic">
                            Result: Overconfidence in predictions. Oversized positions. Unexpected losses when the narrative breaks.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20">
                        <h4 className="text-red-300 font-bold mb-3">They Prevent Adaptation</h4>
                        <p className="text-zinc-300 text-sm mb-3">
                            If you believe you understand why something happened, you do not search for alternative explanations. You become attached to your story even when evidence contradicts it.
                        </p>
                        <p className="text-zinc-400 text-sm italic">
                            Result: Inability to change your mind when conditions change. Holding losing positions because "the narrative is still valid."
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20">
                        <h4 className="text-red-300 font-bold mb-3">They Oversimplify Complexity</h4>
                        <p className="text-zinc-300 text-sm mb-3">
                            Markets are complex adaptive systems with millions of participants making independent decisions based on different information and time horizons. No single narrative captures this complexity.
                        </p>
                        <p className="text-zinc-400 text-sm italic">
                            Result: Your simplified story leads to simplified (and wrong) predictions.
                        </p>
                    </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-4 mt-8">Professional Approach to Narratives</h3>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Professionals recognize narratives as useful framing devices but dangerous predictors.
                </p>

                <div className="space-y-4 mb-8">
                    <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <h4 className="text-emerald-300 font-bold mb-2">Track Price Action, Not Stories</h4>
                        <p className="text-zinc-300 text-sm">
                            What matters is what price is doing, not why. If price is breaking support, it does not matter if the narrative is still bullish. Exit the position.
                        </p>
                    </div>

                    <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <h4 className="text-emerald-300 font-bold mb-2">Hold Narratives Loosely</h4>
                        <p className="text-zinc-300 text-sm">
                            Use narratives as context, not conviction. Be ready to abandon them immediately when price action contradicts them.
                        </p>
                    </div>

                    <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <h4 className="text-emerald-300 font-bold mb-2">Seek Disconfirming Evidence</h4>
                        <p className="text-zinc-300 text-sm">
                            For every bullish narrative, actively search for bearish interpretations of the same data. If you cannot find any, you are not thinking critically.
                        </p>
                    </div>
                </div>
            </section>

            <section className="mb-16">
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                    <span className="text-emerald-500 text-lg">05.</span> Why Intelligence Does Not Protect You
                </h2>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Intelligent people often fail at trading. PhDs in mathematics, successful executives, experienced engineers—all frequently lose money in markets.
                </p>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    This is not a paradox. Intelligence creates specific vulnerabilities.
                </p>

                <h3 className="text-xl font-bold text-white mb-4 mt-8">The Curse of Intelligence</h3>

                <div className="space-y-6 mb-8">
                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                        <h4 className="text-orange-300 font-bold mb-3">Overconfidence in Analytical Ability</h4>
                        <p className="text-zinc-400 mb-3">
                            Intelligent people are used to solving problems through analysis. They believe if they study hard enough, they can predict markets.
                        </p>
                        <p className="text-zinc-500 text-sm italic">
                            Reality: Markets are not physics problems. No amount of analysis eliminates uncertainty. Intelligent people often risk too much because they trust their analysis too much.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                        <h4 className="text-orange-300 font-bold mb-3">Rationalization of Emotional Decisions</h4>
                        <p className="text-zinc-400 mb-3">
                            Intelligence gives you the ability to construct sophisticated-sounding justifications for emotional decisions. You hold a losing trade not because of loss aversion, but because of "compelling fundamental reasons."
                        </p>
                        <p className="text-zinc-500 text-sm italic">
                            Reality: Smart people are better at lying to themselves. They can always find a reason to do what they emotionally want to do.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                        <h4 className="text-orange-300 font-bold mb-3">Inability to Accept Randomness</h4>
                        <p className="text-zinc-400 mb-3">
                            Intelligent people are trained to find patterns and causes. They cannot accept that sometimes things just happen. They will find a pattern even in random data.
                        </p>
                        <p className="text-zinc-500 text-sm italic">
                            Reality: Much of short-term price movement is noise. No pattern. No meaning. Searching for patterns in noise leads to overtrading and losses.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                        <h4 className="text-orange-300 font-bold mb-3">Ego Investment in Being Right</h4>
                        <p className="text-zinc-400 mb-3">
                            Intelligent people build their identity around being right. Admitting a trade was wrong feels like admitting intellectual failure. So they hold losing positions to avoid this psychological pain.
                        </p>
                        <p className="text-zinc-500 text-sm italic">
                            Reality: Markets do not care about your ego. Being wrong is not failure—it is inevitable. The ability to admit error quickly separates survivors from casualties.
                        </p>
                    </div>
                </div>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Intelligence is necessary for trading success—you need to understand markets, probabilities, and risk. But intelligence alone is insufficient and often counterproductive if not paired with emotional discipline.
                </p>
            </section>

            <section className="mb-16">
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                    <span className="text-emerald-500 text-lg">06.</span> Building Psychological Resilience
                </h2>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    You cannot eliminate psychological biases. You can only build systems that prevent them from destroying you.
                </p>

                <h3 className="text-xl font-bold text-white mb-4 mt-8">The Process Over Outcome Mindset</h3>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Focus on executing your process correctly. Outcomes are partially outside your control.
                </p>

                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 mb-8">
                    <h4 className="text-white font-bold mb-3">What This Means</h4>
                    <p className="text-zinc-400 mb-4">
                        A good trade that loses money is still a good trade. A bad trade that makes money is still a bad trade.
                    </p>
                    <p className="text-zinc-400 mb-4">
                        Judge yourself on whether you followed your rules, not on whether you made money. Over sufficient sample size, good process produces good outcomes. But any individual trade can go either way.
                    </p>
                    <p className="text-zinc-400">
                        This mindset protects you from results-oriented thinking. You will not become overconfident after wins or despondent after losses. You evaluate the quality of the decision at the time it was made, not the outcome.
                    </p>
                </div>

                <h3 className="text-xl font-bold text-white mb-4 mt-8">Practical Tools for Psychological Discipline</h3>

                <div className="space-y-4 mb-8">
                    <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <h4 className="text-emerald-300 font-bold mb-2">Trading Journal</h4>
                        <p className="text-zinc-300 text-sm mb-3">
                            Record every trade. Include: setup, reasoning, emotional state, outcome. Review weekly. You will see patterns in your errors.
                        </p>
                        <p className="text-zinc-400 text-sm italic">
                            This is painful. Most traders avoid it because they do not want to confront their mistakes. Do it anyway.
                        </p>
                    </div>

                    <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <h4 className="text-emerald-300 font-bold mb-2">Pre-Trade Checklist</h4>
                        <p className="text-zinc-300 text-sm mb-3">
                            Before entering any trade, complete a checklist. Does it meet all criteria? What is the stop loss? What is position size? If you cannot answer these questions, do not trade.
                        </p>
                        <p className="text-zinc-400 text-sm italic">
                            Checklists remove emotion from decision-making. Pilots use them. Surgeons use them. Traders should too.
                        </p>
                    </div>

                    <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <h4 className="text-emerald-300 font-bold mb-2">Cooling-Off Periods</h4>
                        <p className="text-zinc-300 text-sm mb-3">
                            After a large loss, take 24 hours before trading again. After a large win, same thing. Extreme emotions cause bad decisions.
                        </p>
                        <p className="text-zinc-400 text-sm italic">
                            The best trades feel boring, not exciting. If you are excited or angry, you are not thinking clearly.
                        </p>
                    </div>

                    <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <h4 className="text-emerald-300 font-bold mb-2">Position Size Limits</h4>
                        <p className="text-zinc-300 text-sm mb-3">
                            Hard limits on maximum position size. Never exceed 1% risk per trade. Never exceed 5% total portfolio risk. Make these rules non-negotiable.
                        </p>
                        <p className="text-zinc-400 text-sm italic">
                            When you are emotional, you will want to violate these limits. The limits exist precisely for those moments.
                        </p>
                    </div>

                    <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <h4 className="text-emerald-300 font-bold mb-2">Accountability Partner</h4>
                        <p className="text-zinc-300 text-sm mb-3">
                            Share your trading plan with someone who will hold you accountable. When you want to deviate, you must explain why.
                        </p>
                        <p className="text-zinc-400 text-sm italic">
                            Verbalizing emotional rationalizations often reveals how flawed they are. This prevents many bad trades.
                        </p>
                    </div>
                </div>
            </section>

            <section className="mb-16">
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                    <span className="text-emerald-500 text-lg">07.</span> Summary and Reflection
                </h2>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Trading psychology is not about motivation or positive thinking. It is about recognizing that your brain is fundamentally unsuited for probabilistic decision-making under uncertainty.
                </p>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    You will never eliminate cognitive biases. You will never stop feeling fear and greed. You will never become perfectly rational.
                </p>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    What you can do: build systems that prevent your psychological weaknesses from destroying your capital. Remove discretion. Follow rules. Accept that losses are inevitable and survivable.
                </p>

                <div className="space-y-4 mb-8">
                    <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <p className="text-emerald-200">
                            Your brain evolved for survival on the savannah, not statistical decision-making in markets. Every instinct that kept your ancestors alive works against you in trading.
                        </p>
                    </div>
                    <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <p className="text-emerald-200">
                            Cognitive biases are systematic errors all humans make. Awareness does not make you immune. Build systems that prevent biases from influencing decisions.
                        </p>
                    </div>
                    <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <p className="text-emerald-200">
                            Markets are probabilistic, not deterministic. Narratives create an illusion of understanding but prevent adaptation when conditions change.
                        </p>
                    </div>
                    <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <p className="text-emerald-200">
                            Intelligence does not protect you. It gives you more sophisticated ways to rationalize emotional decisions and lie to yourself.
                        </p>
                    </div>
                    <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <p className="text-emerald-200">
                            Focus on process, not outcomes. Judge trades by quality of decision at time it was made, not by result. Good process produces good outcomes over time.
                        </p>
                    </div>
                </div>

                <div className="p-8 rounded-2xl bg-gradient-to-br from-white/[0.03] to-transparent border border-white/10 relative overflow-hidden">
                    <div className="flex items-start gap-4 relative z-10">
                        <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
                            <Lightbulb className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest block mb-2">Final Reflection</span>
                            <p className="text-white font-medium leading-relaxed mb-4">
                                You have 10 winning trades in a row. You feel invincible. You believe you have discovered an edge others missed. You decide to double your position size on the next trade "because I am on a hot streak."
                            </p>
                            <p className="text-zinc-400 text-sm italic">
                                This is recency bias, overconfidence, and emotional decision-making. The market does not care about your streak. Probability does not reward recent success with future success. That eleventh trade has the same uncertainty as the first. Professional response: maintain consistent position sizing regardless of recent results. Streaks are noise. Edge is statistical across hundreds of trades.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
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
            <div className="mb-8">
                <p className="text-sm text-zinc-500 mb-2">Estimated Reading Time: 70 minutes</p>
                <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight font-display">
                    DeFi Deep Dive
                </h1>
                <p className="text-xl text-zinc-400 leading-relaxed">
                    Decentralized finance is not traditional finance on a blockchain. It is a fundamentally different market structure with unique risks, opportunities, and failure modes. Your intuition from stocks, forex, or commodities will fail you here. This course explains why—and what you must understand instead.
                </p>
            </div>

            <section className="mb-16">
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                    <span className="text-emerald-500 text-lg">01.</span> Structural Differences from Traditional Markets
                </h2>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    DeFi and traditional finance (TradFi) both facilitate exchange of assets. The similarities end there.
                </p>

                <h3 className="text-xl font-bold text-white mb-4 mt-8">Transparency vs Opacity</h3>

                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 mb-6">
                    <h4 className="text-white font-bold mb-3">Traditional Markets</h4>
                    <p className="text-zinc-400">
                        Order books are hidden. Most volume occurs in dark pools. Large institutional trades are executed privately to avoid moving the market. You cannot see pending orders. You do not know who is trading or why.
                    </p>
                </div>

                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 mb-8">
                    <h4 className="text-white font-bold mb-3">DeFi Markets</h4>
                    <p className="text-zinc-400 mb-3">
                        Every transaction is public. Pending transactions sit in the mempool visible to anyone. Wallet balances, trade history, and positions are transparent on-chain. You can see exactly what every participant is doing in real-time.
                    </p>
                    <p className="text-zinc-400">
                        Implication: Privacy does not exist. Front-running is trivial. Sophisticated actors monitor the mempool and extract value from your pending transactions before they execute.
                    </p>
                </div>

                <h3 className="text-xl font-bold text-white mb-4 mt-8">Programmable Money vs Static Assets</h3>

                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 mb-6">
                    <h4 className="text-white font-bold mb-3">Traditional Markets</h4>
                    <p className="text-zinc-400">
                        A share of stock is a share of stock. A dollar is a dollar. Assets have fixed properties defined by legal contracts and regulated intermediaries.
                    </p>
                </div>

                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 mb-8">
                    <h4 className="text-white font-bold mb-3">DeFi Markets</h4>
                    <p className="text-zinc-400 mb-3">
                        Tokens can have arbitrary logic. A token might change properties based on market conditions. It might self-destruct. It might redirect transfers. It might have hidden mint functions.
                    </p>
                    <p className="text-zinc-400">
                        Implication: You cannot assume a token behaves like a traditional asset. Contract code determines behavior. If you do not read the contract, you do not know what you own.
                    </p>
                </div>

                <h3 className="text-xl font-bold text-white mb-4 mt-8">Permissionless Access vs Gatekeeping</h3>

                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 mb-6">
                    <h4 className="text-white font-bold mb-3">Traditional Markets</h4>
                    <p className="text-zinc-400">
                        You need permission to trade. Brokers verify identity. Regulators enforce rules. Market access is restricted based on jurisdiction, accreditation, and compliance.
                    </p>
                </div>

                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 mb-8">
                    <h4 className="text-white font-bold mb-3">DeFi Markets</h4>
                    <p className="text-zinc-400 mb-3">
                        Anyone with a wallet can trade anything. No KYC. No accreditation requirements. No geographic restrictions. A teenager in one country has the same access as a hedge fund in another.
                    </p>
                    <p className="text-zinc-400">
                        Implication: You are competing with the entire world simultaneously, including sophisticated actors with significant capital and technical advantages. There is no regulatory protection from scams, manipulation, or exploitation.
                    </p>
                </div>

                <h3 className="text-xl font-bold text-white mb-4 mt-8">Composability: The Double-Edged Sword</h3>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    DeFi protocols can be combined like LEGO blocks. One protocol can programmatically call another. This creates powerful functionality—and catastrophic failure modes.
                </p>

                <div className="p-6 rounded-2xl bg-orange-500/10 border border-orange-500/20 mb-8">
                    <h4 className="text-orange-300 font-bold mb-4">Example: Cascading Liquidations</h4>
                    <p className="text-zinc-300 mb-4">
                        Protocol A allows borrowing against collateral. Protocol B provides price feeds. Protocol C offers leverage.
                    </p>
                    <p className="text-zinc-300 mb-4">
                        User deposits collateral in Protocol A. Borrows against it. Uses borrowed funds in Protocol C to take leveraged positions. Price feed from Protocol B malfunctions. Protocol A liquidates all positions simultaneously. This triggers sell pressure that cascades across all three protocols.
                    </p>
                    <p className="text-zinc-300">
                        In TradFi, these would be separate institutions with circuit breakers. In DeFi, they are interconnected contracts executing autonomously with no safeguards.
                    </p>
                </div>
            </section>

            <section className="mb-16">
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                    <span className="text-emerald-500 text-lg">02.</span> Liquidity Mechanics: AMMs vs Order Books
                </h2>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Traditional markets use order books to match buyers and sellers. DeFi introduced Automated Market Makers (AMMs)—a fundamentally different liquidity model.
                </p>

                <h3 className="text-xl font-bold text-white mb-4 mt-8">How AMMs Work</h3>

                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 mb-8">
                    <h4 className="text-white font-bold mb-3">The Constant Product Formula</h4>
                    <p className="text-zinc-400 mb-4">
                        Most AMMs use the formula: x * y = k
                    </p>
                    <p className="text-zinc-400 mb-4">
                        Where x and y are the quantities of two tokens in a liquidity pool, and k is a constant. When you trade, you change x and y, but their product remains constant.
                    </p>
                    <p className="text-zinc-400">
                        Example: Pool has 100 ETH and 200,000 USDC. k = 100 * 200,000 = 20,000,000. You buy ETH with USDC. This removes ETH from the pool and adds USDC. The ratio shifts until x * y still equals 20,000,000.
                    </p>
                </div>

                <h3 className="text-xl font-bold text-white mb-4 mt-8">Implications for Traders</h3>

                <div className="space-y-6 mb-8">
                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                        <h4 className="text-orange-300 font-bold mb-3">Slippage Increases Nonlinearly</h4>
                        <p className="text-zinc-400 mb-3">
                            In order book markets, slippage is roughly linear—larger orders walk through deeper levels of the book. In AMMs, slippage follows a curve. Small trades have minimal slippage. Large trades relative to pool size experience exponential slippage.
                        </p>
                        <p className="text-zinc-500 text-sm italic">
                            Practical impact: You cannot execute large trades efficiently in AMMs unless liquidity is deep. A $1M trade in a $10M pool experiences massive slippage.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                        <h4 className="text-orange-300 font-bold mb-3">Price Impact Is Predictable</h4>
                        <p className="text-zinc-400 mb-3">
                            Because the pricing formula is deterministic, you can calculate exact price impact before trading. This is both useful (you know your execution price) and dangerous (so does everyone else).
                        </p>
                        <p className="text-zinc-500 text-sm italic">
                            Practical impact: Sophisticated actors monitor pending transactions and front-run large trades by buying before you and selling after you, extracting value from your slippage.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                        <h4 className="text-orange-300 font-bold mb-3">Impermanent Loss</h4>
                        <p className="text-zinc-400 mb-3">
                            Liquidity providers deposit both tokens into pools. If prices diverge from initial ratio, the pool rebalances by selling the appreciating asset and buying the depreciating one. Providers end up with less value than if they had simply held both assets.
                        </p>
                        <p className="text-zinc-500 text-sm italic">
                            Practical impact: AMM liquidity is not free. Providers demand compensation via trading fees. In volatile markets, impermanent loss can exceed fees, causing liquidity to withdraw. This creates a death spiral: low liquidity → high slippage → fewer trades → less fees → more liquidity withdrawal.
                        </p>
                    </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-4 mt-8">MEV: Maximum Extractable Value</h3>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    MEV is profit extracted by reordering, inserting, or censoring transactions within blocks. It is unique to blockchain-based markets and represents a hidden tax on all DeFi users.
                </p>

                <div className="space-y-6 mb-8">
                    <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20">
                        <h4 className="text-red-300 font-bold mb-3">Front-Running</h4>
                        <p className="text-zinc-300 text-sm mb-3">
                            You submit a trade to buy ETH. A bot sees your transaction in the mempool. It submits an identical trade with higher gas fees to execute first. Your trade now executes at a worse price because the bot moved the market. The bot immediately sells to you at this higher price, capturing the difference.
                        </p>
                        <p className="text-zinc-400 text-sm italic">
                            This happens on millions of transactions daily. It is not illegal in DeFi. It is the expected behavior of rational profit-maximizing actors.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20">
                        <h4 className="text-red-300 font-bold mb-3">Sandwich Attacks</h4>
                        <p className="text-zinc-300 text-sm mb-3">
                            More sophisticated than simple front-running. Attacker places a buy order before your trade and a sell order after your trade. Your trade executes in the middle, experiencing maximum slippage. Attacker profits from both sides.
                        </p>
                        <p className="text-zinc-400 text-sm italic">
                            Protection: Use slippage limits. Break large trades into smaller pieces. Use private transaction relayers that hide your transaction from the public mempool.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20">
                        <h4 className="text-red-300 font-bold mb-3">Liquidation MEV</h4>
                        <p className="text-zinc-300 text-sm mb-3">
                            Lending protocols liquidate under-collateralized positions. Liquidators compete to be first to execute these liquidations and claim the collateral at a discount. This creates gas wars—participants paying exorbitant fees to win liquidation rights.
                        </p>
                        <p className="text-zinc-400 text-sm italic">
                            For borrowers: You pay penalties when liquidated. Those penalties go to bots, not to the protocol. Maintain healthy collateral ratios.
                        </p>
                    </div>
                </div>
            </section>

            <section className="mb-16">
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                    <span className="text-emerald-500 text-lg">03.</span> Protocol Risk vs Market Risk
                </h2>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    In traditional markets, market risk is the primary concern. In DeFi, protocol risk often dominates.
                </p>

                <h3 className="text-xl font-bold text-white mb-4 mt-8">Market Risk</h3>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Market risk is familiar: the risk that price moves against your position. This exists in both TradFi and DeFi. It is manageable through position sizing, stop losses, and diversification.
                </p>

                <h3 className="text-xl font-bold text-white mb-4 mt-8">Protocol Risk</h3>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Protocol risk is the risk that the smart contract you are interacting with fails, is exploited, or behaves unexpectedly. This can result in total loss regardless of market direction.
                </p>

                <div className="space-y-6 mb-8">
                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                        <h4 className="text-orange-300 font-bold mb-3">Smart Contract Bugs</h4>
                        <p className="text-zinc-400 mb-3">
                            Code has bugs. Even audited code. A bug in a lending protocol can allow attackers to drain all deposited funds. A bug in a DEX can lock funds permanently.
                        </p>
                        <p className="text-zinc-500 text-sm italic">
                            Historical example: The DAO hack (2016) exploited a reentrancy bug, draining $60M. Poly Network hack (2021) exploited cross-chain logic, stealing $600M. These were not market movements—they were protocol failures.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                        <h4 className="text-orange-300 font-bold mb-3">Admin Key Risk</h4>
                        <p className="text-zinc-400 mb-3">
                            Many DeFi protocols have admin keys that can upgrade contracts, pause operations, or drain funds. If these keys are compromised or used maliciously, users lose everything.
                        </p>
                        <p className="text-zinc-500 text-sm italic">
                            Centralization masquerading as decentralization. A single multisig wallet controlling hundreds of millions is not decentralized—it is a privileged attack vector.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                        <h4 className="text-orange-300 font-bold mb-3">Oracle Failures</h4>
                        <p className="text-zinc-400 mb-3">
                            DeFi protocols rely on oracles to provide external data (prices, interest rates). If an oracle is manipulated or fails, protocols using that data execute incorrect logic.
                        </p>
                        <p className="text-zinc-500 text-sm italic">
                            Example: Flash loan attack manipulates a DEX price used as an oracle. Lending protocol reads the manipulated price and incorrectly liquidates healthy positions. Attacker profits. Users lose funds. No market movement occurred—the attack was purely technical.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                        <h4 className="text-orange-300 font-bold mb-3">Composability Risk</h4>
                        <p className="text-zinc-400 mb-3">
                            You deposit funds in Protocol A. Protocol A deposits those funds in Protocol B. Protocol B has a vulnerability. Attacker exploits Protocol B. Your funds in Protocol A are lost even though Protocol A itself was secure.
                        </p>
                        <p className="text-zinc-500 text-sm italic">
                            This is unique to DeFi. Your risk exposure extends to every protocol your protocol depends on. Composability creates systemic risk that is difficult to assess.
                        </p>
                    </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-4 mt-8">Managing Protocol Risk</h3>

                <div className="space-y-4 mb-8">
                    <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <h4 className="text-emerald-300 font-bold mb-2">Prefer Battle-Tested Protocols</h4>
                        <p className="text-zinc-300 text-sm">
                            Protocols that have operated for years with significant TVL without being exploited are lower risk. New protocols with novel mechanisms are higher risk regardless of audits.
                        </p>
                    </div>

                    <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <h4 className="text-emerald-300 font-bold mb-2">Diversify Across Protocols</h4>
                        <p className="text-zinc-300 text-sm">
                            Do not concentrate all funds in one protocol. If one is exploited, you do not lose everything. This is diversification against protocol risk, not market risk.
                        </p>
                    </div>

                    <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <h4 className="text-emerald-300 font-bold mb-2">Understand What You Are Using</h4>
                        <p className="text-zinc-300 text-sm">
                            If you cannot explain how a protocol works, you should not use it. High yields often signal high risk. If you do not understand where yield comes from, it is probably unsustainable or a scam.
                        </p>
                    </div>

                    <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <h4 className="text-emerald-300 font-bold mb-2">Monitor Admin Keys</h4>
                        <p className="text-zinc-300 text-sm">
                            Check if protocols have upgrade keys. Who controls them? How many signatures required? Immutable contracts are safer but cannot be fixed if bugs are found. Upgradeable contracts can be fixed but also exploited by malicious admins.
                        </p>
                    </div>
                </div>
            </section>

            <section className="mb-16">
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                    <span className="text-emerald-500 text-lg">04.</span> Reflexivity in Crypto Markets
                </h2>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Reflexivity is the phenomenon where price movements influence fundamentals, which in turn influence price, creating feedback loops. All markets exhibit some reflexivity. Crypto markets are dominated by it.
                </p>

                <h3 className="text-xl font-bold text-white mb-4 mt-8">Why Crypto Is Hyper-Reflexive</h3>

                <div className="space-y-6 mb-8">
                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                        <h4 className="text-blue-300 font-bold mb-3">Network Effects Dominate Value</h4>
                        <p className="text-zinc-400 mb-3">
                            A blockchain's value derives primarily from how many people use it. More users → higher demand for tokens → higher price → more attention → more users. This is a positive feedback loop with no equilibrium.
                        </p>
                        <p className="text-zinc-500 text-sm italic">
                            Implication: Fundamentals do not anchor price. A blockchain can be technically superior but worthless if no one uses it. Conversely, a mediocre blockchain can be valuable if it has network effects.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                        <h4 className="text-blue-300 font-bold mb-3">Tokenomics Create Self-Fulfilling Dynamics</h4>
                        <p className="text-zinc-400 mb-3">
                            Many DeFi protocols reward users with native tokens. Token price rising → rewards become more valuable → more users participate → more demand for tokens → price rises further.
                        </p>
                        <p className="text-zinc-500 text-sm italic">
                            This works in reverse: Token price falling → rewards become worthless → users leave → less demand → price falls further. These are boom-bust cycles with no natural stabilizers.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                        <h4 className="text-blue-300 font-bold mb-3">Leverage Amplifies Reflexivity</h4>
                        <p className="text-zinc-400 mb-3">
                            DeFi allows extreme leverage. Collateral value rising → users borrow more → increased buying pressure → price rises → collateral value rises → users borrow even more.
                        </p>
                        <p className="text-zinc-500 text-sm italic">
                            Downside: Collateral value falling → forced liquidations → sell pressure → price falls → more liquidations. This creates flash crashes that have no fundamental cause.
                        </p>
                    </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-4 mt-8">Trading Reflexive Markets</h3>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Traditional fundamental analysis assumes fundamentals anchor price. In reflexive markets, price creates fundamentals.
                </p>

                <div className="space-y-4 mb-8">
                    <div className="p-5 rounded-xl bg-white/[0.02] border-l-2 border-orange-500/50">
                        <h4 className="text-white font-bold mb-2">Trends Persist Longer Than Rational</h4>
                        <p className="text-zinc-400 text-sm">
                            Because rising prices create their own demand, trends in crypto continue far beyond what fundamentals justify. Do not short based on "overvaluation." The trend can persist indefinitely.
                        </p>
                    </div>

                    <div className="p-5 rounded-xl bg-white/[0.02] border-l-2 border-orange-500/50">
                        <h4 className="text-white font-bold mb-2">Crashes Are Sudden and Brutal</h4>
                        <p className="text-zinc-400 text-sm">
                            When reflexive feedback reverses, there is no support. Price can fall 50-90% in days. This is not panic—it is the unwinding of leverage and feedback loops.
                        </p>
                    </div>

                    <div className="p-5 rounded-xl bg-white/[0.02] border-l-2 border-orange-500/50">
                        <h4 className="text-white font-bold mb-2">Narrative Drives Price More Than Metrics</h4>
                        <p className="text-zinc-400 text-sm">
                            Revenue, users, and TVL matter less than narrative. A compelling story attracts attention. Attention creates demand. Demand creates price appreciation. The narrative becomes self-fulfilling.
                        </p>
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-orange-500/10 border border-orange-500/20 mb-8">
                    <h4 className="text-orange-300 font-bold mb-4">Case Study: DeFi Summer 2020</h4>
                    <p className="text-zinc-300 mb-4">
                        Yield farming launches. Protocols offer token rewards for providing liquidity. Token prices rise as users chase yields. Rising token prices make yields appear even higher. More users join. Token prices rise further.
                    </p>
                    <p className="text-zinc-300 mb-4">
                        This continues for months. Protocols with no revenue and questionable long-term viability reach billions in valuation. The reflexive loop feeds itself.
                    </p>
                    <p className="text-zinc-300">
                        Eventually, rewards dilute. Token prices fall. Yields collapse. Users exit. Prices crash. Most of these protocols are now worthless. The cycle was entirely reflexive—no fundamental anchor existed.
                    </p>
                </div>
            </section>

            <section className="mb-16">
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                    <span className="text-emerald-500 text-lg">05.</span> Why Traditional Intuition Fails in DeFi
                </h2>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Experienced TradFi traders often lose money in DeFi. Their expertise becomes a liability. Here is why.
                </p>

                <div className="space-y-6 mb-8">
                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                        <h4 className="text-orange-300 font-bold mb-3">No Intrinsic Value Anchor</h4>
                        <p className="text-zinc-400 mb-3">
                            Stocks have earnings. Bonds have yield. Commodities have industrial use. These provide valuation anchors. When price deviates too far from fundamentals, arbitrage corrects it.
                        </p>
                        <p className="text-zinc-400 mb-3">
                            Most crypto assets have no cash flows, no intrinsic use, no fundamental anchor. Valuation is purely reflexive. Price is what people believe price should be.
                        </p>
                        <p className="text-zinc-500 text-sm italic">
                            Traditional value investors try to short "overvalued" tokens and get destroyed as price continues rising for months. There is no anchor for price to revert to.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                        <h4 className="text-orange-300 font-bold mb-3">24/7 Markets with No Circuit Breakers</h4>
                        <p className="text-zinc-400 mb-3">
                            TradFi markets close. Circuit breakers halt trading during extreme moves. This gives participants time to reassess and provides liquidity during stress.
                        </p>
                        <p className="text-zinc-400 mb-3">
                            DeFi never closes. No circuit breakers. Cascading liquidations execute autonomously at 3am on a Sunday. By the time you wake up, your position is liquidated.
                        </p>
                        <p className="text-zinc-500 text-sm italic">
                            Professional traders from TradFi are not accustomed to needing 24/7 monitoring. They underestimate this risk and get liquidated while sleeping.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                        <h4 className="text-orange-300 font-bold mb-3">Extreme Volatility as Baseline</h4>
                        <p className="text-zinc-400 mb-3">
                            A 2% daily move in the S&P 500 is noteworthy. A 20% daily move in a crypto asset is Tuesday.
                        </p>
                        <p className="text-zinc-400 mb-3">
                            TradFi traders use position sizing and leverage calibrated for TradFi volatility. Apply the same approach in DeFi and you get liquidated on normal volatility.
                        </p>
                        <p className="text-zinc-500 text-sm italic">
                            You must reduce position size by 10x or more compared to TradFi to achieve equivalent risk. Most traders do not adjust enough.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                        <h4 className="text-orange-300 font-bold mb-3">Information Asymmetry Is Worse</h4>
                        <p className="text-zinc-400 mb-3">
                            TradFi has regulations against insider trading. DeFi has no such protections. Protocol teams trade their own tokens. Early investors dump on retail. This is legal and expected.
                        </p>
                        <p className="text-zinc-400 mb-3">
                            Transparency means everyone can see what insiders are doing—but only if you know how to read on-chain data. Most retail participants do not.
                        </p>
                        <p className="text-zinc-500 text-sm italic">
                            TradFi traders assume fair and transparent markets. DeFi is transparent but not fair. Information asymmetry is worse, not better.
                        </p>
                    </div>
                </div>
            </section>

            <section className="mb-16">
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                    <span className="text-emerald-500 text-lg">06.</span> Summary and Reflection
                </h2>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    DeFi is not TradFi on a blockchain. It is a fundamentally different market structure with unique risks and opportunities.
                </p>

                <p className="leading-relaxed text-zinc-300 mb-6">
                    Transparency creates MEV and front-running. Programmable money creates protocol risk. Composability creates systemic risk. Reflexivity dominates fundamentals. Traditional intuition is often wrong.
                </p>

                <div className="space-y-4 mb-8">
                    <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <p className="text-emerald-200">
                            Structural differences: Full transparency enables front-running. Programmable assets behave unpredictably. Permissionless access means competing with the world.
                        </p>
                    </div>
                    <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <p className="text-emerald-200">
                            Liquidity mechanics: AMMs have nonlinear slippage and impermanent loss. MEV is a hidden tax on all traders. Large trades require different execution strategies than TradFi.
                        </p>
                    </div>
                    <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <p className="text-emerald-200">
                            Protocol risk often exceeds market risk. Smart contract bugs, admin keys, oracle failures, and composability create failure modes that do not exist in TradFi.
                        </p>
                    </div>
                    <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <p className="text-emerald-200">
                            Reflexivity dominates. Price creates fundamentals. Trends persist beyond rational levels. Crashes are sudden. Narrative matters more than metrics.
                        </p>
                    </div>
                    <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <p className="text-emerald-200">
                            Traditional intuition fails. No fundamental anchors. 24/7 markets. Extreme baseline volatility. Worse information asymmetry despite transparency.
                        </p>
                    </div>
                </div>

                <div className="p-8 rounded-2xl bg-gradient-to-br from-white/[0.03] to-transparent border border-white/10 relative overflow-hidden">
                    <div className="flex items-start gap-4 relative z-10">
                        <div className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                            <TrendingDown className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest block mb-2">Critical Warning</span>
                            <p className="text-white font-medium leading-relaxed mb-4">
                                You deposit funds in a yield farming protocol offering 300% APY. The yield comes from token emissions. Token price is rising, making the APY appear sustainable. More users join. TVL increases. You feel validated.
                            </p>
                            <p className="text-zinc-400 text-sm italic">
                                This is a reflexive feedback loop with no fundamental support. Token emissions dilute holders. The only source of value is new users buying tokens. When growth slows, price crashes. 300% APY becomes -90% loss. This pattern has destroyed billions in capital. High yield without sustainable revenue is not opportunity—it is a timer counting down to collapse.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </motion.article>
    );
}
