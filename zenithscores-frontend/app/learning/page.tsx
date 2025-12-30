'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import nextDynamic from 'next/dynamic';
import {
    BookOpen, TrendingUp, Lightbulb, Target, Shield,
    ChevronRight, Play, CheckCircle, Lock, Star, Zap, Award, Clock,
    Trophy, BrainCircuit, GraduationCap, Activity
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { getUserProgress } from '@/lib/actions/learning';

// Lazy load heavy components
const AcademyQuiz = nextDynamic(() => import('@/components/AcademyQuiz'), {
    loading: () => <div className="h-64 bg-[rgba(255,255,255,0.05)] rounded-xl animate-pulse" />,
    ssr: false
});

const PathsDashboard = nextDynamic(() => import('@/components/paths/PathsDashboard'), {
    loading: () => <div className="h-96 bg-[rgba(255,255,255,0.05)] rounded-xl animate-pulse" />,
    ssr: false
});

// Learning Module Types
interface LearningModule {
    id: string;
    title: string;
    description: string;
    duration: string;
    lessons: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    icon: React.ReactNode;
    color: string;
    progress: number;
    locked: boolean;
}

// Course data
const COURSES: LearningModule[] = [
    {
        id: 'trading-fundamentals',
        title: 'Trading Fundamentals',
        description: 'Master the basics of market analysis, order types, and risk management.',
        duration: '2h 15m',
        lessons: 8,
        difficulty: 'beginner',
        icon: <BookOpen size={24} />,
        color: 'from-blue-500 to-cyan-500',
        progress: 0,
        locked: false
    },
    {
        id: 'zenith-score-mastery',
        title: 'Zenith Score Mastery',
        description: 'Understand how Zenith Scores work and how to trade with them.',
        duration: '1h 45m',
        lessons: 6,
        difficulty: 'beginner',
        icon: <Target size={24} />,
        color: 'from-emerald-500 to-green-500',
        progress: 0,
        locked: false
    },
    {
        id: 'technical-analysis',
        title: 'Technical Analysis',
        description: 'Learn to read charts, identify patterns, and use key indicators.',
        duration: '3h 50m',
        lessons: 12,
        difficulty: 'intermediate',
        icon: <TrendingUp size={24} />,
        color: 'from-purple-500 to-pink-500',
        progress: 0,
        locked: false
    },
    {
        id: 'risk-management-pro',
        title: 'Risk Management Pro',
        description: 'Position sizing, stop-losses, and portfolio protection strategies.',
        duration: '2h 20m',
        lessons: 7,
        difficulty: 'advanced',
        icon: <Shield size={24} />,
        color: 'from-orange-500 to-red-500',
        progress: 0,
        locked: false
    },
    {
        id: 'trading-psychology',
        title: 'Trading Psychology',
        description: 'Control emotions, avoid FOMO, and develop a winning mindset.',
        duration: '2h 30m',
        lessons: 9,
        difficulty: 'advanced',
        icon: <Lightbulb size={24} />,
        color: 'from-yellow-500 to-orange-500',
        progress: 0,
        locked: false
    },
    {
        id: 'defi-deep-dive',
        title: 'DeFi Deep Dive',
        description: 'Advanced strategies for decentralized finance protocols.',
        duration: '3h 20m',
        lessons: 15,
        difficulty: 'advanced',
        icon: <Zap size={24} />,
        color: 'from-violet-500 to-purple-500',
        progress: 0,
        locked: false
    }
];

// Quick tips
const QUICK_TIPS = [
    { title: 'Never risk more than 2% per trade', category: 'Risk' },
    { title: 'Zenith Score above 80 = strong momentum', category: 'Scoring' },
    { title: 'Volume confirms price movements', category: 'Technical' },
    { title: 'Cut losses quickly, let winners run', category: 'Psychology' },
    { title: 'Paper trade before real money', category: 'Strategy' },
];

export const dynamic = 'force-dynamic';

export default function LearningHubPage() {
    const { data: session } = useSession();
    const [activeTab, setActiveTab] = useState<'courses' | 'quizzes' | 'paths'>('courses');
    const [activeFilter, setActiveFilter] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');
    const [tipIndex, setTipIndex] = useState(0);
    const [activeQuiz, setActiveQuiz] = useState<{ moduleId: string, difficulty: 'easy' | 'medium' | 'hard', title: string } | null>(null);
    const [quizProgress, setQuizProgress] = useState<any[]>([]);
    const [isLoadingProgress, setIsLoadingProgress] = useState(false);

    useEffect(() => {
        if (session?.user?.email) {
            fetchProgress();
        }
        if (session?.user?.id) {
            fetchCourseStats();
        }
    }, [session]);

    const [realCourseProgress, setRealCourseProgress] = useState<Record<string, { progress: number, completed: boolean }>>({});

    const fetchCourseStats = async () => {
        if (!session?.user?.id) return;
        try {
            const data = await getUserProgress(session.user.id);
            const map: Record<string, { progress: number, completed: boolean }> = {};
            data.forEach((p: any) => {
                map[p.courseId] = { progress: p.progress, completed: p.completed };
            });
            setRealCourseProgress(map);
        } catch (e) {
            console.error("Failed to load course stats", e);
        }
    };

    const fetchProgress = async () => {
        setIsLoadingProgress(true);
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://project-zenith-zexd.vercel.app';
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || baseUrl}/api/v1/academy/progress/${session?.user?.email}`);
            const data = await res.json();
            if (data.status === 'success') {
                setQuizProgress(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch progress:', error);
        } finally {
            setIsLoadingProgress(false);
        }
    };

    const isLevelPassed = (moduleId: string, difficulty: string) => {
        return quizProgress.some(p => p.module_id === moduleId && p.difficulty === difficulty && p.passed);
    };

    const isLevelAvailable = (moduleId: string, difficulty: string) => {
        if (difficulty === 'easy') return true;
        if (difficulty === 'medium') return isLevelPassed(moduleId, 'easy');
        if (difficulty === 'hard') return isLevelPassed(moduleId, 'medium');
        return false;
    };

    const filteredCourses = COURSES.map(c => ({
        ...c,
        progress: realCourseProgress[c.id]?.progress || 0,
        isCompleted: realCourseProgress[c.id]?.completed || false
    })).filter(course =>
        activeFilter === 'all' || course.difficulty === activeFilter
    );

    return (
        <div className="min-h-screen bg-[var(--void)] text-[var(--text-primary)] pb-32 pt-24">
            <main className="container mx-auto px-4 md:px-6 py-6 md:py-8">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold flex items-center gap-3 mb-2" style={{ fontFamily: "var(--font-display)" }}>
                        <GraduationCap className="text-[var(--accent-mint)]" size={32} />
                        Zenith Academy
                    </h1>
                    <p className="text-[var(--text-secondary)]">Institutional-grade trading education.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Primary Tabs */}
                        <div className="flex border-b border-[rgba(255,255,255,0.1)] mb-6">
                            <button
                                onClick={() => setActiveTab('courses')}
                                className={`px-6 py-3 font-bold text-sm transition-all border-b-2 ${activeTab === 'courses' ? 'border-[var(--accent-mint)] text-[var(--text-primary)]' : 'border-transparent text-[var(--text-muted)] hover:text-white'}`}
                                style={{ fontFamily: "var(--font-body)" }}
                            >
                                <div className="flex items-center gap-2">
                                    <BookOpen size={16} /> Courses
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('quizzes')}
                                className={`px-6 py-3 font-bold text-sm transition-all border-b-2 ${activeTab === 'quizzes' ? 'border-[var(--accent-mint)] text-[var(--text-primary)]' : 'border-transparent text-[var(--text-muted)] hover:text-white'}`}
                                style={{ fontFamily: "var(--font-body)" }}
                            >
                                <div className="flex items-center gap-2">
                                    <Trophy size={16} /> Exams
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('paths')}
                                className={`px-6 py-3 font-bold text-sm transition-all border-b-2 ${activeTab === 'paths' ? 'border-[var(--accent-mint)] text-[var(--text-primary)]' : 'border-transparent text-[var(--text-muted)] hover:text-white'}`}
                                style={{ fontFamily: "var(--font-body)" }}
                            >
                                <div className="flex items-center gap-2">
                                    <BrainCircuit size={16} /> Paths
                                </div>
                            </button>
                        </div>

                        {activeQuiz ? (
                            <div className="glass-panel p-6 rounded-2xl border border-[rgba(255,255,255,0.05)]">
                                <AcademyQuiz
                                    moduleId={activeQuiz.moduleId}
                                    difficulty={activeQuiz.difficulty}
                                    courseTitle={activeQuiz.title}
                                    onClose={() => setActiveQuiz(null)}
                                    onComplete={() => fetchProgress()}
                                />
                            </div>
                        ) : activeTab === 'courses' ? (
                            <>
                                {/* Filter Tabs */}
                                <div className="flex gap-2 flex-wrap mb-4">
                                    {(['all', 'beginner', 'intermediate', 'advanced'] as const).map(filter => (
                                        <button
                                            key={filter}
                                            onClick={() => setActiveFilter(filter)}
                                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeFilter === filter
                                                ? 'bg-[var(--accent-mint)] text-black'
                                                : 'bg-[rgba(255,255,255,0.05)] text-[var(--text-muted)] hover:bg-[rgba(255,255,255,0.1)]'
                                                }`}
                                            style={{ fontFamily: "var(--font-data)" }}
                                        >
                                            {filter}
                                        </button>
                                    ))}
                                </div>

                                {/* Course Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {filteredCourses.map((course, index) => (
                                        <motion.div
                                            key={course.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className={`relative overflow-hidden rounded-xl border ${course.locked
                                                ? 'border-[rgba(255,255,255,0.05)] opacity-60'
                                                : 'border-[rgba(255,255,255,0.1)] hover:border-[var(--accent-mint)]'
                                                } bg-[rgba(255,255,255,0.02)] transition-all group hover:bg-[rgba(255,255,255,0.04)]`}
                                        >

                                            <div className="p-5">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className={`p-2 rounded-lg bg-gradient-to-br ${course.color} bg-opacity-20`}>
                                                        {course.icon}
                                                    </div>
                                                    {course.locked ? (
                                                        <Lock size={16} className="text-[var(--text-muted)]" />
                                                    ) : (course.progress === 100 || course.isCompleted) ? (
                                                        <CheckCircle size={16} className="text-[var(--accent-mint)]" />
                                                    ) : null}
                                                </div>

                                                <h3 className="text-lg font-bold text-white mb-1" style={{ fontFamily: "var(--font-display)" }}>{course.title}</h3>
                                                <p className="text-sm text-[var(--text-secondary)] mb-4 line-clamp-2">{course.description}</p>

                                                <div className="flex items-center gap-4 text-xs text-[var(--text-muted)] mb-3 font-mono">
                                                    <span className="flex items-center gap-1">
                                                        <Clock size={12} /> {course.duration}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <BookOpen size={12} /> {course.lessons}
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${course.difficulty === 'beginner' ? 'bg-emerald-500/20 text-emerald-400' :
                                                        course.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                                                            'bg-red-500/20 text-red-400'
                                                        }`}>
                                                        {course.difficulty}
                                                    </span>
                                                </div>

                                                {/* Progress Bar */}
                                                {!course.locked && (
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between text-xs">
                                                            <span className="text-[var(--text-muted)]">Progress</span>
                                                            <span className="text-white font-medium">{course.progress}%</span>
                                                        </div>
                                                        <div className="h-1 bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${course.progress}%` }}
                                                                transition={{ duration: 1, delay: 0.5 }}
                                                                className={`h-full rounded-full bg-gradient-to-r ${course.color}`}
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                <Link
                                                    href={course.locked ? '#' : `/learn/${course.id}`}
                                                    onClick={(e) => course.locked && e.preventDefault()}
                                                    className={`mt-4 w-full py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${course.locked
                                                        ? 'bg-[rgba(255,255,255,0.05)] text-[var(--text-muted)] cursor-not-allowed'
                                                        : 'bg-[rgba(255,255,255,0.1)] hover:bg-[var(--accent-mint)] text-white hover:text-black'
                                                        }`}
                                                >
                                                    {course.locked ? (
                                                        <>
                                                            <Lock size={14} /> Locked
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Play size={14} /> Start
                                                        </>
                                                    )}
                                                </Link>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </>
                        ) : activeTab === 'paths' ? (
                            <div className="-mx-4 md:-mx-0">
                                <PathsDashboard />
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="glass-panel border border-[var(--accent-mint)]/20 rounded-2xl p-6 mb-8 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-[var(--accent-mint)]/5 pointer-events-none" />
                                    <div className="flex items-center gap-4 mb-4 relative z-10">
                                        <div className="p-3 bg-[var(--accent-mint)]/20 rounded-xl">
                                            <Award size={24} className="text-[var(--accent-mint)]" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>Zenith Pro Certification</h2>
                                            <p className="text-sm text-[var(--text-secondary)]">Complete all modules to earn your Pro Trader badge.</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3 relative z-10">
                                        <div className="bg-black/40 p-3 rounded-lg border border-[rgba(255,255,255,0.05)]">
                                            <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Modules</div>
                                            <div className="text-lg font-bold text-white font-mono">06</div>
                                        </div>
                                        <div className="bg-black/40 p-3 rounded-lg border border-[rgba(255,255,255,0.05)]">
                                            <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Levels</div>
                                            <div className="text-lg font-bold text-white font-mono">18</div>
                                        </div>
                                        <div className="bg-black/40 p-3 rounded-lg border border-[rgba(255,255,255,0.05)]">
                                            <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Completion</div>
                                            <div className="text-lg font-bold text-[var(--accent-mint)] font-mono">
                                                {Math.round((quizProgress.filter(p => p.passed).length / 18) * 100)}%
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {COURSES.map((course) => (
                                        <div key={course.id} className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-xl overflow-hidden hover:bg-[rgba(255,255,255,0.04)] transition-colors">
                                            <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg bg-gradient-to-br ${course.color} bg-opacity-20`}>
                                                        {course.icon}
                                                    </div>
                                                    <h3 className="font-bold text-white">{course.title}</h3>
                                                </div>
                                                <div className="flex gap-2 self-start md:self-auto overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
                                                    {(['easy', 'medium', 'hard'] as const).map((diff) => {
                                                        const passed = isLevelPassed(course.id, diff);
                                                        const available = isLevelAvailable(course.id, diff);

                                                        return (
                                                            <button
                                                                key={diff}
                                                                onClick={() => available && setActiveQuiz({
                                                                    moduleId: course.id,
                                                                    difficulty: diff,
                                                                    title: course.title
                                                                })}
                                                                disabled={!available}
                                                                className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap
                                                                    ${passed ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' :
                                                                        available ? 'bg-[rgba(255,255,255,0.05)] text-white hover:bg-[var(--accent-mint)] hover:text-black border border-[rgba(255,255,255,0.1)]' :
                                                                            'bg-black/20 text-[var(--text-muted)] border border-transparent cursor-not-allowed opacity-50'}
                                                                `}
                                                            >
                                                                {passed ? <CheckCircle size={10} /> : available ? <Star size={10} /> : <Lock size={10} />}
                                                                {diff.charAt(0).toUpperCase() + diff.slice(1)}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">



                        {/* Daily Tip */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gradient-to-br from-[var(--surface-2)] to-[var(--surface-3)] border border-[rgba(255,255,255,0.05)] rounded-xl p-5 relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-[var(--accent-mint)]/5 pointer-events-none" />
                            <h3 className="text-sm font-bold text-[var(--accent-mint)] mb-3 flex items-center gap-2 relative z-10">
                                <Lightbulb size={16} /> Insight of the Day
                            </h3>
                            <p className="text-white font-medium mb-3 relative z-10 italic">"{QUICK_TIPS[tipIndex].title}"</p>
                            <span className="text-xs text-[var(--text-secondary)] relative z-10 uppercase tracking-widest">{QUICK_TIPS[tipIndex].category}</span>
                            <button
                                onClick={() => setTipIndex((tipIndex + 1) % QUICK_TIPS.length)}
                                className="mt-4 text-xs text-[var(--accent-mint)] hover:underline flex items-center gap-1 relative z-10"
                            >
                                Next Insight <ChevronRight size={12} />
                            </button>
                        </motion.div>

                        {/* Skills Progress */}
                        <div className="glass-panel border border-[rgba(255,255,255,0.05)] rounded-xl p-5">
                            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                <Star size={16} className="text-[var(--accent-gold)]" /> Skill Matrix
                            </h3>
                            <div className="space-y-4">
                                {[
                                    { skill: 'Technical Analysis', level: 65, color: 'bg-purple-500' },
                                    { skill: 'Risk Management', level: 40, color: 'bg-orange-500' },
                                    { skill: 'Zenith Scoring', level: 30, color: 'bg-[var(--accent-mint)]' },
                                    { skill: 'Psychology', level: 20, color: 'bg-yellow-500' },
                                ].map(skill => (
                                    <div key={skill.skill}>
                                        <div className="flex justify-between text-xs mb-1 font-mono">
                                            <span className="text-[var(--text-secondary)]">{skill.skill}</span>
                                            <span className="text-white">{skill.level}%</span>
                                        </div>
                                        <div className="h-1 bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${skill.color}`}
                                                style={{ width: `${skill.level}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div className="glass-panel border border-[rgba(255,255,255,0.05)] rounded-xl p-5">
                            <h3 className="text-sm font-bold text-white mb-4">Quick Access</h3>
                            <div className="space-y-2">
                                <Link href="/trading" className="flex items-center gap-3 p-3 rounded-lg bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.05)] transition-colors border border-[rgba(255,255,255,0.05)]">
                                    <div className="p-2 rounded-lg bg-[var(--accent-mint)]/10 text-[var(--accent-mint)]">
                                        <TrendingUp size={16} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-white">Paper Trading</div>
                                        <div className="text-xs text-[var(--text-muted)]">Practice risk-free</div>
                                    </div>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div >
    );
}
