'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    ArrowLeft, BookOpen, TrendingUp, Lightbulb, Target, Shield,
    ChevronRight, Play, CheckCircle, Lock, Star, Zap, Award, Clock,
    Trophy, GraduationCap, BarChart3
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import AcademyQuiz from '@/components/AcademyQuiz';

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

// Course data - mapped to learning-content.ts course IDs
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

export default function LearningHubPage() {
    const { data: session } = useSession();
    const [activeTab, setActiveTab] = useState<'courses' | 'quizzes'>('courses');
    const [activeFilter, setActiveFilter] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');
    const [tipIndex, setTipIndex] = useState(0);
    const [activeQuiz, setActiveQuiz] = useState<{ moduleId: string, difficulty: 'easy' | 'medium' | 'hard', title: string } | null>(null);
    const [quizProgress, setQuizProgress] = useState<any[]>([]);
    const [isLoadingProgress, setIsLoadingProgress] = useState(false);

    // Fetch progress when session is available
    useEffect(() => {
        if (session?.user?.email) {
            fetchProgress();
        }
    }, [session]);

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

    const filteredCourses = COURSES.filter(course =>
        activeFilter === 'all' || course.difficulty === activeFilter
    );

    const totalProgress = Math.round(
        COURSES.filter(c => !c.locked).reduce((sum, c) => sum + c.progress, 0) /
        COURSES.filter(c => !c.locked).length
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
            {/* Header */}
            <div className="sticky top-14 md:top-16 z-30 bg-black/80 backdrop-blur-xl border-b border-white/10">
                <div className="container mx-auto px-4 md:px-6 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                                <ArrowLeft size={20} />
                            </Link>
                            <div>
                                <h1 className="text-xl font-bold flex items-center gap-2">
                                    📚 Learning Hub
                                </h1>
                                <p className="text-xs text-gray-500">Master trading with structured courses</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="text-right">
                                <div className="text-xs text-gray-500">Overall Progress</div>
                                <div className="text-lg font-bold text-cyan-400">
                                    {activeTab === 'courses' ? totalProgress : Math.round((quizProgress.filter(p => p.passed).length / 18) * 100)}%
                                </div>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                                <Award size={20} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 md:px-6 py-6 md:py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Primary Tabs */}
                        <div className="flex border-b border-white/10 mb-6">
                            <button
                                onClick={() => setActiveTab('courses')}
                                className={`px-6 py-3 font-bold text-sm transition-all border-b-2 ${activeTab === 'courses' ? 'border-cyan-500 text-white' : 'border-transparent text-gray-500 hover:text-white'}`}
                            >
                                <div className="flex items-center gap-2">
                                    <BookOpen size={16} /> Structured Courses
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('quizzes')}
                                className={`px-6 py-3 font-bold text-sm transition-all border-b-2 ${activeTab === 'quizzes' ? 'border-cyan-500 text-white' : 'border-transparent text-gray-500 hover:text-white'}`}
                            >
                                <div className="flex items-center gap-2">
                                    <Trophy size={16} /> Certification Exams
                                </div>
                            </button>
                        </div>

                        {activeQuiz ? (
                            <div className="bg-black/50 border border-white/10 rounded-2xl p-4">
                                <AcademyQuiz
                                    moduleId={activeQuiz.moduleId}
                                    difficulty={activeQuiz.difficulty}
                                    courseTitle={activeQuiz.title}
                                    onClose={() => setActiveQuiz(null)}
                                    onComplete={() => {
                                        fetchProgress();
                                    }}
                                />
                            </div>
                        ) : activeTab === 'courses' ? (
                            <>
                                {/* Filter Tabs */}
                                <div className="flex gap-2 flex-wrap">
                                    {(['all', 'beginner', 'intermediate', 'advanced'] as const).map(filter => (
                                        <button
                                            key={filter}
                                            onClick={() => setActiveFilter(filter)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeFilter === filter
                                                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                                                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                                }`}
                                        >
                                            {filter.charAt(0).toUpperCase() + filter.slice(1)}
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
                                                ? 'border-white/5 opacity-60'
                                                : 'border-white/10 hover:border-white/20'
                                                } bg-gradient-to-br from-gray-900/80 to-black transition-all group`}
                                        >
                                            {/* Gradient Top Bar */}
                                            <div className={`h-1 bg-gradient-to-r ${course.color}`} />

                                            <div className="p-5">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className={`p-2 rounded-lg bg-gradient-to-br ${course.color} bg-opacity-20`}>
                                                        {course.icon}
                                                    </div>
                                                    {course.locked ? (
                                                        <Lock size={16} className="text-gray-500" />
                                                    ) : course.progress === 100 ? (
                                                        <CheckCircle size={16} className="text-emerald-400" />
                                                    ) : null}
                                                </div>

                                                <h3 className="text-lg font-bold text-white mb-1">{course.title}</h3>
                                                <p className="text-sm text-gray-400 mb-4 line-clamp-2">{course.description}</p>

                                                <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                                                    <span className="flex items-center gap-1">
                                                        <Clock size={12} /> {course.duration}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <BookOpen size={12} /> {course.lessons} lessons
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${course.difficulty === 'beginner' ? 'bg-emerald-500/20 text-emerald-400' :
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
                                                            <span className="text-gray-500">Progress</span>
                                                            <span className="text-white font-medium">{course.progress}%</span>
                                                        </div>
                                                        <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${course.progress}%` }}
                                                                transition={{ duration: 1, delay: 0.5 }}
                                                                className={`h-full rounded-full bg-gradient-to-r ${course.color}`}
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* CTA Button - Links to dedicated learning page */}
                                                <Link
                                                    href={course.locked ? '#' : `/learn/${course.id}`}
                                                    onClick={(e) => course.locked && e.preventDefault()}
                                                    className={`mt-4 w-full py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${course.locked
                                                        ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                                                        : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:opacity-90'
                                                        }`}
                                                >
                                                    {course.locked ? (
                                                        <>
                                                            <Lock size={14} /> Unlock with Pro
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Play size={14} /> Start Learning
                                                        </>
                                                    )}
                                                </Link>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="space-y-6">
                                <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-white/10 rounded-2xl p-6 mb-8">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="p-3 bg-indigo-500/20 rounded-xl">
                                            <Award size={24} className="text-indigo-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-white">Zenith Pro Certification</h2>
                                            <p className="text-sm text-gray-400">Battle-test your knowledge and unlock your professional badge.</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="bg-black/40 p-3 rounded-lg border border-white/5">
                                            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Modules</div>
                                            <div className="text-lg font-bold text-white">06</div>
                                        </div>
                                        <div className="bg-black/40 p-3 rounded-lg border border-white/5">
                                            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Levels</div>
                                            <div className="text-lg font-bold text-white">18</div>
                                        </div>
                                        <div className="bg-black/40 p-3 rounded-lg border border-white/5">
                                            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Completion</div>
                                            <div className="text-lg font-bold text-cyan-400">
                                                {Math.round((quizProgress.filter(p => p.passed).length / 18) * 100)}%
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {COURSES.map((course) => (
                                        <div key={course.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                                            <div className="p-4 flex items-center justify-between border-b border-white/5">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg bg-gradient-to-br ${course.color} bg-opacity-20`}>
                                                        {course.icon}
                                                    </div>
                                                    <h3 className="font-bold text-white">{course.title}</h3>
                                                </div>
                                                <div className="flex gap-1">
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
                                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5
                                                                    ${passed ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' :
                                                                        available ? 'bg-white/5 text-white hover:bg-white/10 border border-white/10' :
                                                                            'bg-black/40 text-gray-600 border border-white/5 cursor-not-allowed'}
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
                            className="bg-gradient-to-br from-cyan-900/30 to-blue-900/30 border border-cyan-500/20 rounded-xl p-5"
                        >
                            <h3 className="text-sm font-bold text-cyan-400 mb-3 flex items-center gap-2">
                                <Lightbulb size={16} /> Tip of the Day
                            </h3>
                            <p className="text-white font-medium mb-2">{QUICK_TIPS[tipIndex].title}</p>
                            <span className="text-xs text-gray-500">{QUICK_TIPS[tipIndex].category}</span>
                            <button
                                onClick={() => setTipIndex((tipIndex + 1) % QUICK_TIPS.length)}
                                className="mt-3 text-xs text-cyan-400 hover:underline flex items-center gap-1"
                            >
                                Next Tip <ChevronRight size={12} />
                            </button>
                        </motion.div>

                        {/* Skills Progress */}
                        <div className="bg-gradient-to-br from-gray-900/80 to-black border border-white/10 rounded-xl p-5">
                            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                <Star size={16} className="text-yellow-400" /> Your Skills
                            </h3>
                            <div className="space-y-3">
                                {[
                                    { skill: 'Technical Analysis', level: 65, color: 'bg-purple-500' },
                                    { skill: 'Risk Management', level: 40, color: 'bg-orange-500' },
                                    { skill: 'Zenith Scoring', level: 30, color: 'bg-emerald-500' },
                                    { skill: 'Psychology', level: 20, color: 'bg-yellow-500' },
                                ].map(skill => (
                                    <div key={skill.skill}>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-gray-400">{skill.skill}</span>
                                            <span className="text-white">{skill.level}%</span>
                                        </div>
                                        <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
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
                        <div className="bg-gradient-to-br from-gray-900/80 to-black border border-white/10 rounded-xl p-5">
                            <h3 className="text-sm font-bold text-white mb-4">Quick Access</h3>
                            <div className="space-y-2">
                                <Link href="/trading" className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                                    <div className="p-2 rounded-lg bg-emerald-500/20">
                                        <TrendingUp size={16} className="text-emerald-400" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-white">Paper Trading</div>
                                        <div className="text-xs text-gray-500">Practice risk-free</div>
                                    </div>
                                </Link>
                                <Link href="/coach" className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                                    <div className="p-2 rounded-lg bg-purple-500/20">
                                        <Zap size={16} className="text-purple-400" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-white">AI Coach</div>
                                        <div className="text-xs text-gray-500">Get trade analysis</div>
                                    </div>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
