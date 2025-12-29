'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Clock, Award, AlertTriangle, CheckCircle2, XCircle,
    ChevronRight, ChevronLeft, Play, RotateCcw
} from 'lucide-react';
import { FINAL_EXAMS, FinalExamConfig, FinalExamQuestion } from '@/lib/final-exams';

interface FinalExamProps {
    pathId: string;
    onComplete?: (passed: boolean, score: number) => void;
}

type ExamState = 'intro' | 'in-progress' | 'review' | 'complete';

export default function FinalExam({ pathId, onComplete }: FinalExamProps) {
    const examConfig = FINAL_EXAMS[pathId];

    const [state, setState] = useState<ExamState>('intro');
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [score, setScore] = useState<{ correct: number; total: number; percentage: number } | null>(null);
    const [showExplanation, setShowExplanation] = useState(false);

    // Timer
    useEffect(() => {
        if (state !== 'in-progress' || timeRemaining <= 0) return;

        const timer = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev <= 1) {
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [state, timeRemaining]);

    const handleStartExam = () => {
        if (!examConfig) return;
        setTimeRemaining(examConfig.timeLimit * 60);
        setAnswers({});
        setCurrentQuestion(0);
        setState('in-progress');
    };

    const handleSelectAnswer = (questionId: string, answer: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: answer }));
    };

    const handleSubmit = useCallback(() => {
        if (!examConfig) return;

        let correct = 0;
        examConfig.questions.forEach(q => {
            if (answers[q.id] === q.correctAnswer) {
                correct++;
            }
        });

        const percentage = Math.round((correct / examConfig.questions.length) * 100);
        setScore({ correct, total: examConfig.questions.length, percentage });
        setState('complete');

        onComplete?.(percentage >= examConfig.passingScore, percentage);
    }, [examConfig, answers, onComplete]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!examConfig) {
        return (
            <div className="p-6 bg-white/5 border border-white/10 rounded-xl text-center">
                <p className="text-zinc-400">No exam available for this path yet.</p>
            </div>
        );
    }

    const question = examConfig.questions[currentQuestion];
    const passed = score ? score.percentage >= examConfig.passingScore : false;

    // Intro Screen
    if (state === 'intro') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#0c0c10] border border-[var(--accent-mint)]/20 rounded-2xl p-8"
            >
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-[var(--accent-mint)]/10 rounded-xl">
                        <Award size={28} className="text-[var(--accent-mint)]" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">{examConfig.pathName} Final Exam</h2>
                        <p className="text-zinc-400 text-sm">{examConfig.description}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-center">
                        <div className="text-2xl font-bold text-white">{examConfig.totalQuestions}</div>
                        <div className="text-xs text-zinc-500 uppercase">Questions</div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-center">
                        <div className="text-2xl font-bold text-white">{examConfig.timeLimit} min</div>
                        <div className="text-xs text-zinc-500 uppercase">Time Limit</div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-center">
                        <div className="text-2xl font-bold text-white">{examConfig.passingScore}%</div>
                        <div className="text-xs text-zinc-500 uppercase">Pass Score</div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-center">
                        <div className="text-2xl font-bold text-white">{examConfig.examFormat}</div>
                        <div className="text-xs text-zinc-500 uppercase">Format</div>
                    </div>
                </div>

                <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl mb-6">
                    <div className="flex items-start gap-3">
                        <AlertTriangle size={18} className="text-amber-400 mt-0.5" />
                        <div className="text-sm text-amber-200">
                            <strong>Important:</strong> Once started, the timer cannot be paused.
                            You must complete all questions within the time limit.
                            Failed attempts have a {examConfig.cooldownPeriod}-hour cooldown before retry.
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleStartExam}
                    className="w-full py-4 bg-[var(--accent-mint)] text-black font-bold rounded-xl hover:bg-[var(--accent-mint)]/90 transition-colors flex items-center justify-center gap-2"
                >
                    <Play size={20} />
                    Start Final Exam
                </button>
            </motion.div>
        );
    }

    // In Progress
    if (state === 'in-progress' && question) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-[#0c0c10] border border-white/10 rounded-2xl overflow-hidden"
            >
                {/* Header with Timer */}
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-zinc-400">
                            Question {currentQuestion + 1} of {examConfig.questions.length}
                        </span>
                        <span className="px-2 py-0.5 bg-white/10 rounded text-xs text-zinc-400">
                            {question.skillArea}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs ${question.difficulty === 'hard'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-amber-500/20 text-amber-400'
                            }`}>
                            {question.difficulty.toUpperCase()}
                        </span>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${timeRemaining < 300 ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white'
                        }`}>
                        <Clock size={16} />
                        <span className="font-mono font-bold">{formatTime(timeRemaining)}</span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="h-1 bg-white/5">
                    <div
                        className="h-full bg-[var(--accent-mint)] transition-all duration-300"
                        style={{ width: `${((currentQuestion + 1) / examConfig.questions.length) * 100}%` }}
                    />
                </div>

                {/* Question */}
                <div className="p-6">
                    <h3 className="text-lg text-white leading-relaxed mb-6">
                        {question.question}
                    </h3>

                    <div className="space-y-3">
                        {question.options.map((option, idx) => {
                            const letter = String.fromCharCode(97 + idx); // a, b, c, d
                            const isSelected = answers[question.id] === letter;

                            return (
                                <button
                                    key={idx}
                                    onClick={() => handleSelectAnswer(question.id, letter)}
                                    className={`w-full p-4 text-left rounded-xl border transition-all ${isSelected
                                        ? 'bg-[var(--accent-mint)]/10 border-[var(--accent-mint)]/50 text-white'
                                        : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 hover:border-white/20'
                                        }`}
                                >
                                    <span className="font-mono text-sm text-zinc-500 mr-3">{letter.toUpperCase()}.</span>
                                    {option.replace(/^[a-d]\)\s*/, '')}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between p-4 border-t border-white/10 bg-white/5">
                    <button
                        onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                        disabled={currentQuestion === 0}
                        className="px-4 py-2 flex items-center gap-2 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft size={18} />
                        Previous
                    </button>

                    <div className="hidden md:flex items-center gap-2">
                        {examConfig.questions.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentQuestion(idx)}
                                className={`w-3 h-3 rounded-full transition-colors ${answers[examConfig.questions[idx].id]
                                    ? 'bg-[var(--accent-mint)]'
                                    : idx === currentQuestion
                                        ? 'bg-white'
                                        : 'bg-white/20'
                                    }`}
                            />
                        ))}
                    </div>

                    {currentQuestion < examConfig.questions.length - 1 ? (
                        <button
                            onClick={() => setCurrentQuestion(prev => prev + 1)}
                            className="px-4 py-2 flex items-center gap-2 text-white hover:text-[var(--accent-mint)] transition-colors"
                        >
                            Next
                            <ChevronRight size={18} />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            className="px-6 py-2 bg-[var(--accent-mint)] text-black font-bold rounded-lg hover:bg-[var(--accent-mint)]/90 transition-colors"
                        >
                            Submit Exam
                        </button>
                    )}
                </div>
            </motion.div>
        );
    }

    // Complete Screen
    if (state === 'complete' && score) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#0c0c10] border border-white/10 rounded-2xl p-8 text-center"
            >
                <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${passed ? 'bg-emerald-500/20' : 'bg-red-500/20'
                    }`}>
                    {passed ? (
                        <CheckCircle2 size={48} className="text-emerald-400" />
                    ) : (
                        <XCircle size={48} className="text-red-400" />
                    )}
                </div>

                <h2 className={`text-3xl font-bold mb-2 ${passed ? 'text-emerald-400' : 'text-red-400'}`}>
                    {passed ? 'Congratulations!' : 'Not Quite There'}
                </h2>

                <p className="text-zinc-400 mb-6">
                    {passed
                        ? `You've passed the ${examConfig.pathName} Final Exam!`
                        : `You need ${examConfig.passingScore}% to pass. Try again after ${examConfig.cooldownPeriod} hours.`
                    }
                </p>

                <div className="flex items-center justify-center gap-8 mb-8">
                    <div className="text-center">
                        <div className="text-4xl font-bold text-white">{score.percentage}%</div>
                        <div className="text-xs text-zinc-500 uppercase mt-1">Your Score</div>
                    </div>
                    <div className="h-12 w-px bg-white/10" />
                    <div className="text-center">
                        <div className="text-4xl font-bold text-white">{score.correct}/{score.total}</div>
                        <div className="text-xs text-zinc-500 uppercase mt-1">Correct</div>
                    </div>
                </div>

                <div className="flex gap-4 justify-center">
                    <button
                        onClick={() => {
                            setShowExplanation(true);
                            setState('review');
                            setCurrentQuestion(0);
                        }}
                        className="px-6 py-3 bg-white/10 border border-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
                    >
                        Review Answers
                    </button>
                    {!passed && (
                        <button
                            onClick={() => setState('intro')}
                            className="px-6 py-3 bg-white/10 border border-white/10 text-white rounded-xl hover:bg-white/20 transition-colors flex items-center gap-2"
                        >
                            <RotateCcw size={16} />
                            Try Again
                        </button>
                    )}
                </div>
            </motion.div>
        );
    }

    // Review Mode
    if (state === 'review') {
        const reviewQuestion = examConfig.questions[currentQuestion];
        const userAnswer = answers[reviewQuestion.id];
        const isCorrect = userAnswer === reviewQuestion.correctAnswer;

        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-[#0c0c10] border border-white/10 rounded-2xl overflow-hidden"
            >
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
                    <span className="text-sm text-zinc-400">
                        Review: Question {currentQuestion + 1} of {examConfig.questions.length}
                    </span>
                    <button
                        onClick={() => setState('complete')}
                        className="text-sm text-zinc-400 hover:text-white"
                    >
                        Back to Results
                    </button>
                </div>

                <div className="p-6">
                    <h3 className="text-lg text-white leading-relaxed mb-6">
                        {reviewQuestion.question}
                    </h3>

                    <div className="space-y-3 mb-6">
                        {reviewQuestion.options.map((option, idx) => {
                            const letter = String.fromCharCode(97 + idx);
                            const isUserAnswer = userAnswer === letter;
                            const isCorrectAnswer = reviewQuestion.correctAnswer === letter;

                            return (
                                <div
                                    key={idx}
                                    className={`p-4 rounded-xl border ${isCorrectAnswer
                                        ? 'bg-emerald-500/10 border-emerald-500/50'
                                        : isUserAnswer && !isCorrect
                                            ? 'bg-red-500/10 border-red-500/50'
                                            : 'bg-white/5 border-white/10'
                                        }`}
                                >
                                    <span className="font-mono text-sm text-zinc-500 mr-3">{letter.toUpperCase()}.</span>
                                    {option.replace(/^[a-d]\)\s*/, '')}
                                    {isCorrectAnswer && <CheckCircle2 size={16} className="inline ml-2 text-emerald-400" />}
                                    {isUserAnswer && !isCorrect && <XCircle size={16} className="inline ml-2 text-red-400" />}
                                </div>
                            );
                        })}
                    </div>

                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                        <div className="text-sm font-medium text-blue-400 mb-2">Explanation:</div>
                        <p className="text-sm text-zinc-300">{reviewQuestion.explanation}</p>
                        {reviewQuestion.calculation && (
                            <div className="mt-2 font-mono text-xs text-zinc-500">
                                {reviewQuestion.calculation}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between p-4 border-t border-white/10 bg-white/5">
                    <button
                        onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                        disabled={currentQuestion === 0}
                        className="px-4 py-2 flex items-center gap-2 text-zinc-400 hover:text-white disabled:opacity-30 transition-colors"
                    >
                        <ChevronLeft size={18} />
                        Previous
                    </button>
                    <button
                        onClick={() => setCurrentQuestion(prev => Math.min(examConfig.questions.length - 1, prev + 1))}
                        disabled={currentQuestion === examConfig.questions.length - 1}
                        className="px-4 py-2 flex items-center gap-2 text-white hover:text-[var(--accent-mint)] disabled:opacity-30 transition-colors"
                    >
                        Next
                        <ChevronRight size={18} />
                    </button>
                </div>
            </motion.div>
        );
    }

    return null;
}
