'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
    ArrowLeft, ChevronRight, ChevronLeft, CheckCircle, Circle,
    BookOpen, Clock, BarChart2, Zap, Menu, X, Trophy, Star
} from 'lucide-react';
import { getCourseById, type ModuleContent, type Part, type Chapter } from '@/lib/learning-content';

// Simple markdown renderer for our content
function renderMarkdown(content: string): React.ReactNode[] {
    // Split into lines
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeContent: string[] = [];
    let codeLanguage = '';
    let inTable = false;
    let tableRows: string[] = [];
    let listItems: string[] = [];
    let listType: 'ul' | 'ol' | null = null;

    const flushList = () => {
        if (listItems.length > 0 && listType) {
            const ListTag = listType === 'ol' ? 'ol' : 'ul';
            elements.push(
                <ListTag key={`list-${elements.length}`} className={`my-4 space-y-2 ${listType === 'ol' ? 'list-decimal' : 'list-disc'} list-inside text-gray-300`}>
                    {listItems.map((item, i) => (
                        <li key={i} dangerouslySetInnerHTML={{ __html: parseInline(item) }} />
                    ))}
                </ListTag>
            );
            listItems = [];
            listType = null;
        }
    };

    const flushTable = () => {
        if (tableRows.length > 0) {
            const headerRow = tableRows[0].split('|').filter(c => c.trim());
            const dataRows = tableRows.slice(2).map(row => row.split('|').filter(c => c.trim()));
            elements.push(
                <div key={`table-${elements.length}`} className="my-6 overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-cyan-500/30">
                                {headerRow.map((cell, i) => (
                                    <th key={i} className="px-4 py-3 text-left text-cyan-400 font-semibold">{cell.trim()}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {dataRows.map((row, i) => (
                                <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                                    {row.map((cell, j) => (
                                        <td key={j} className="px-4 py-3 text-gray-300" dangerouslySetInnerHTML={{ __html: parseInline(cell.trim()) }} />
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
            tableRows = [];
            inTable = false;
        }
    };

    const parseInline = (text: string) => {
        return text
            .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
            .replace(/\*(.+?)\*/g, '<em class="text-cyan-300">$1</em>')
            .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 bg-cyan-500/10 text-cyan-400 rounded text-sm font-mono">$1</code>')
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-cyan-400 hover:underline">$1</a>');
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Code blocks
        if (line.startsWith('```')) {
            if (!inCodeBlock) {
                flushList();
                flushTable();
                inCodeBlock = true;
                codeLanguage = line.slice(3).trim();
                codeContent = [];
            } else {
                elements.push(
                    <pre key={`code-${elements.length}`} className="my-4 p-4 bg-black/50 border border-cyan-500/20 rounded-xl overflow-x-auto">
                        <code className="text-sm font-mono text-gray-300">{codeContent.join('\n')}</code>
                    </pre>
                );
                inCodeBlock = false;
            }
            continue;
        }

        if (inCodeBlock) {
            codeContent.push(line);
            continue;
        }

        // Tables
        if (line.includes('|') && line.trim().startsWith('|')) {
            flushList();
            inTable = true;
            tableRows.push(line);
            continue;
        } else if (inTable) {
            flushTable();
        }

        // Headers
        if (line.startsWith('### ')) {
            flushList();
            elements.push(
                <h3 key={`h3-${elements.length}`} className="text-xl font-bold text-white mt-8 mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-gradient-to-b from-cyan-400 to-purple-500 rounded-full" />
                    {line.slice(4)}
                </h3>
            );
            continue;
        }

        if (line.startsWith('## ')) {
            flushList();
            elements.push(
                <h2 key={`h2-${elements.length}`} className="text-2xl font-bold text-white mt-10 mb-6">
                    {line.slice(3)}
                </h2>
            );
            continue;
        }

        // Blockquotes
        if (line.startsWith('> ')) {
            flushList();
            const content = line.slice(2);
            const isWarning = content.includes('⚠️');
            const isTip = content.includes('💡') || content.includes('🎯');
            elements.push(
                <blockquote
                    key={`quote-${elements.length}`}
                    className={`my-4 p-4 rounded-xl border-l-4 ${isWarning
                        ? 'bg-orange-500/10 border-orange-500 text-orange-200'
                        : isTip
                            ? 'bg-cyan-500/10 border-cyan-500 text-cyan-200'
                            : 'bg-purple-500/10 border-purple-500 text-purple-200'
                        }`}
                    dangerouslySetInnerHTML={{ __html: parseInline(content) }}
                />
            );
            continue;
        }

        // Horizontal rule
        if (line.trim() === '---') {
            flushList();
            elements.push(<hr key={`hr-${elements.length}`} className="my-8 border-white/10" />);
            continue;
        }

        // Lists
        const ulMatch = line.match(/^[\-\*]\s+(.+)/);
        const olMatch = line.match(/^\d+\.\s+(.+)/);

        if (ulMatch) {
            if (listType !== 'ul') {
                flushList();
                listType = 'ul';
            }
            listItems.push(ulMatch[1]);
            continue;
        }

        if (olMatch) {
            if (listType !== 'ol') {
                flushList();
                listType = 'ol';
            }
            listItems.push(olMatch[1]);
            continue;
        }

        // Regular paragraph
        if (line.trim()) {
            flushList();
            elements.push(
                <p
                    key={`p-${elements.length}`}
                    className="my-3 text-gray-300 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: parseInline(line) }}
                />
            );
        }
    }

    flushList();
    flushTable();

    return elements;
}

export default function LearnModulePage() {
    const params = useParams();
    const router = useRouter();
    const courseId = params?.courseId as string;

    const [course, setCourse] = useState<ModuleContent | null>(null);
    const [currentPartIndex, setCurrentPartIndex] = useState(0);
    const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
    const [completedChapters, setCompletedChapters] = useState<Set<string>>(new Set());
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [showCompletionModal, setShowCompletionModal] = useState(false);

    useEffect(() => {
        if (courseId) {
            const foundCourse = getCourseById(courseId);
            if (foundCourse) {
                setCourse(foundCourse);
            } else {
                router.push('/learning');
            }
        }

        // Load progress from localStorage
        const saved = localStorage.getItem(`learning_progress_${courseId}`);
        if (saved) {
            const { completed, partIndex, chapterIndex } = JSON.parse(saved);
            setCompletedChapters(new Set(completed));
            setCurrentPartIndex(partIndex || 0);
            setCurrentChapterIndex(chapterIndex || 0);
        }
    }, [courseId, router]);

    // Save progress
    useEffect(() => {
        if (courseId && completedChapters.size > 0) {
            localStorage.setItem(`learning_progress_${courseId}`, JSON.stringify({
                completed: Array.from(completedChapters),
                partIndex: currentPartIndex,
                chapterIndex: currentChapterIndex
            }));
        }
    }, [courseId, completedChapters, currentPartIndex, currentChapterIndex]);

    const currentPart = course?.parts[currentPartIndex];
    const currentChapter = currentPart?.chapters[currentChapterIndex];
    const currentChapterId = `${currentPart?.id}-${currentChapter?.id}`;

    // Calculate progress
    const totalChapters = course?.parts.reduce((sum, p) => sum + p.chapters.length, 0) || 0;
    const progressPercent = (completedChapters.size / totalChapters) * 100;

    const markComplete = () => {
        if (currentChapterId) {
            setCompletedChapters(prev => new Set([...prev, currentChapterId]));
        }
    };

    const goToNext = () => {
        markComplete();
        if (currentPart && currentChapterIndex < currentPart.chapters.length - 1) {
            setCurrentChapterIndex(prev => prev + 1);
        } else if (course && currentPartIndex < course.parts.length - 1) {
            setCurrentPartIndex(prev => prev + 1);
            setCurrentChapterIndex(0);
        }
        window.scrollTo(0, 0);
    };

    const goToPrev = () => {
        if (currentChapterIndex > 0) {
            setCurrentChapterIndex(prev => prev - 1);
        } else if (currentPartIndex > 0) {
            setCurrentPartIndex(prev => prev - 1);
            const prevPart = course?.parts[currentPartIndex - 1];
            setCurrentChapterIndex((prevPart?.chapters.length || 1) - 1);
        }
        window.scrollTo(0, 0);
    };

    const isFirstChapter = currentPartIndex === 0 && currentChapterIndex === 0;
    const isLastChapter = currentPartIndex === (course?.parts.length || 1) - 1 &&
        currentChapterIndex === (currentPart?.chapters.length || 1) - 1;

    const handleFinishCourse = () => {
        markComplete();
        setShowCompletionModal(true);
    };

    if (!course) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-white">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Top Navigation Bar */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/10">
                <div className="flex items-center justify-between px-4 h-16">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors lg:hidden"
                        >
                            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                        <Link
                            href="/learning"
                            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft size={20} />
                            <span className="hidden sm:inline">Back to Courses</span>
                        </Link>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{course.icon}</span>
                        <div className="hidden sm:block">
                            <h1 className="font-bold text-white">{course.title}</h1>
                            <p className="text-xs text-gray-400">{course.subtitle}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Progress */}
                        <div className="hidden md:flex items-center gap-2">
                            <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressPercent}%` }}
                                />
                            </div>
                            <span className="text-sm text-gray-400">{Math.round(progressPercent)}%</span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="pt-16 flex">
                {/* Sidebar */}
                <AnimatePresence>
                    {sidebarOpen && (
                        <motion.aside
                            initial={{ x: -300, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -300, opacity: 0 }}
                            className="fixed lg:sticky top-16 left-0 w-80 h-[calc(100vh-4rem)] bg-[#0a0a0f] border-r border-white/10 overflow-y-auto z-40"
                        >
                            <div className="p-4">
                                {/* Course Info */}
                                <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 mb-6">
                                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                                        <Clock size={14} />
                                        {course.estimatedTime}
                                        <span className="mx-2">•</span>
                                        <BarChart2 size={14} />
                                        {course.difficulty}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Trophy size={16} className="text-yellow-400" />
                                        <span className="text-sm text-gray-300">
                                            {completedChapters.size} / {totalChapters} completed
                                        </span>
                                    </div>
                                </div>

                                {/* Course Contents */}
                                <h3 className="text-sm font-semibold text-gray-400 uppercase mb-4">Course Contents</h3>

                                <div className="space-y-4">
                                    {course.parts.map((part, pIndex) => (
                                        <div key={part.id}>
                                            <div className="flex items-center gap-2 text-sm font-semibold text-white mb-2">
                                                <span className="text-cyan-400">Part {pIndex + 1}</span>
                                                <span className="text-gray-500">•</span>
                                                <span className="text-gray-300 text-xs">{part.estimatedTime}</span>
                                            </div>
                                            <h4 className="text-white font-medium mb-2">{part.title}</h4>

                                            <div className="space-y-1 ml-2">
                                                {part.chapters.map((chapter, cIndex) => {
                                                    const chapterId = `${part.id}-${chapter.id}`;
                                                    const isActive = currentPartIndex === pIndex && currentChapterIndex === cIndex;
                                                    const isCompleted = completedChapters.has(chapterId);

                                                    return (
                                                        <button
                                                            key={chapter.id}
                                                            onClick={() => {
                                                                setCurrentPartIndex(pIndex);
                                                                setCurrentChapterIndex(cIndex);
                                                                window.scrollTo(0, 0);
                                                            }}
                                                            className={`w-full text-left p-2 rounded-lg flex items-center gap-2 transition-all ${isActive
                                                                ? 'bg-cyan-500/20 text-cyan-400'
                                                                : 'hover:bg-white/5 text-gray-400 hover:text-white'
                                                                }`}
                                                        >
                                                            {isCompleted ? (
                                                                <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
                                                            ) : (
                                                                <Circle size={16} className="flex-shrink-0" />
                                                            )}
                                                            <span className="text-sm truncate">{chapter.title}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>

                {/* Main Content */}
                <main className={`flex-1 min-h-[calc(100vh-4rem)] pb-24 ${sidebarOpen ? 'lg:ml-0' : ''}`}>
                    <div className="max-w-3xl mx-auto px-4 py-8 lg:px-8 lg:py-12">
                        {/* Chapter Header */}
                        <motion.div
                            key={currentChapterId}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-8"
                        >
                            <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                                <span className="text-cyan-400">Part {currentPartIndex + 1}</span>
                                <ChevronRight size={14} />
                                <span>Chapter {currentChapterIndex + 1}</span>
                            </div>
                            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                                {currentChapter?.title}
                            </h1>
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                                <span className="flex items-center gap-1">
                                    <BookOpen size={14} />
                                    {currentPart?.title}
                                </span>
                            </div>
                        </motion.div>

                        {/* Chapter Content */}
                        <motion.article
                            key={currentChapterId}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="prose prose-invert max-w-none"
                        >
                            {currentChapter && renderMarkdown(currentChapter.content)}
                        </motion.article>

                        {/* Navigation Buttons */}
                        <div className="mt-12 flex items-center justify-between gap-4 pt-8 border-t border-white/10">
                            <button
                                onClick={goToPrev}
                                disabled={isFirstChapter}
                                className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all ${isFirstChapter
                                    ? 'text-gray-600 cursor-not-allowed'
                                    : 'bg-white/5 hover:bg-white/10 text-white'
                                    }`}
                            >
                                <ChevronLeft size={20} />
                                Previous
                            </button>

                            {completedChapters.has(currentChapterId!) ? (
                                <div className="flex items-center gap-2 text-green-400">
                                    <CheckCircle size={20} />
                                    <span>Completed</span>
                                </div>
                            ) : (
                                <button
                                    onClick={markComplete}
                                    className="px-4 py-2 rounded-lg border border-green-500/30 text-green-400 hover:bg-green-500/10 transition-colors"
                                >
                                    Mark as Complete
                                </button>
                            )}

                            {isLastChapter ? (
                                <button
                                    onClick={handleFinishCourse}
                                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-emerald-500/20"
                                >
                                    <Trophy size={20} />
                                    Finish Course
                                </button>
                            ) : (
                                <button
                                    onClick={goToNext}
                                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold hover:opacity-90 transition-opacity"
                                >
                                    Next Chapter
                                    <ChevronRight size={20} />
                                </button>
                            )}
                        </div>
                    </div>
                </main>
            </div>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Completion Modal */}
            <AnimatePresence>
                {showCompletionModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-lg bg-[#0a0a0f] border border-white/10 rounded-2xl p-8 text-center shadow-2xl overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-emerald-500" />

                            {/* Confetti-like decor */}
                            <div className="absolute -top-12 -left-12 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl" />
                            <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl" />

                            <div className="mb-6 inline-flex p-4 rounded-full bg-yellow-400/10 border border-yellow-400/20">
                                <Trophy size={48} className="text-yellow-400" />
                            </div>

                            <h2 className="text-3xl font-black text-white mb-2">COURSE COMPLETE!</h2>
                            <p className="text-gray-400 mb-8">
                                Congratulations! You've successfully mastered <span className="text-white font-semibold">"{course.title}"</span>. Your Zenith trading skills have significantly leveled up.
                            </p>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                    <div className="text-2xl font-bold text-cyan-400">+{totalChapters * 10}</div>
                                    <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">XP Earned</div>
                                </div>
                                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                    <div className="text-2xl font-bold text-emerald-400">Master</div>
                                    <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Rank Achieved</div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => router.push('/learning')}
                                    className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold hover:opacity-90 transition-opacity"
                                >
                                    Explore More Courses
                                </button>
                                <button
                                    onClick={() => router.push('/trading')}
                                    className="w-full py-4 rounded-xl bg-white/5 text-white font-bold hover:bg-white/10 transition-colors border border-white/10"
                                >
                                    Practice with Paper Trading
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
