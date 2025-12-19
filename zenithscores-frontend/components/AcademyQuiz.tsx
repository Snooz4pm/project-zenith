'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle2, XCircle, ArrowRight, RotateCcw,
    Award, Trophy, Target, Clock, Shield, Star,
    Zap, Lock, HelpCircle, ChevronRight, BookOpen
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { ACADEMY_QUIZZES, QuizQuestion } from '@/lib/quiz-data';

interface AcademyQuizProps {
    moduleId: string;
    difficulty: 'easy' | 'medium' | 'hard';
    courseTitle: string;
    onClose: () => void;
    onComplete: (score: number, passed: boolean) => void;
}

// Internal interface for individual question performance
interface QuestionSignal {
    timeTaken: number;
    answerChanges: number;
    isCorrect: boolean;
}

export default function AcademyQuiz({ moduleId, difficulty, courseTitle, onClose, onComplete }: AcademyQuizProps) {
    const { data: session } = useSession();
    const [currentStep, setCurrentStep] = useState(0);
    const [score, setScore] = useState(0);
    const [showResults, setShowResults] = useState(false);

    // Interaction State
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isConfirmed, setIsConfirmed] = useState(false); // New: separate selection from confirmation
    const [isCorrect, setIsCorrect] = useState(false);

    // Signal Capture State
    const [startTime, setStartTime] = useState<number>(Date.now());
    const [answerChanges, setAnswerChanges] = useState(0);
    const [signals, setSignals] = useState<QuestionSignal[]>([]);

    const questions = ACADEMY_QUIZZES[moduleId]?.[difficulty] || [];
    const currentQuestion = questions[currentStep];

    // Reset signal timers when question changes
    useEffect(() => {
        setStartTime(Date.now());
        setAnswerChanges(0);
        setSelectedOption(null);
        setIsConfirmed(false);
        setIsCorrect(false);
    }, [currentStep]);

    const getPassingThreshold = () => {
        if (difficulty === 'easy') return 0.7;
        if (difficulty === 'medium') return 0.75;
        return 0.83;
    };

    const handleSelectOption = (option: string) => {
        if (isConfirmed) return; // Locked after confirmation

        if (selectedOption && selectedOption !== option) {
            setAnswerChanges(prev => prev + 1);
        }
        setSelectedOption(option);
    };

    const confirmAnswer = () => {
        if (!selectedOption || isConfirmed) return;

        const timeTaken = Date.now() - startTime;
        const correct = selectedOption.startsWith(currentQuestion.correctAnswer);

        setIsConfirmed(true);
        setIsCorrect(correct);

        if (correct) {
            setScore(prev => prev + 1);
        }

        // Capture signal
        setSignals(prev => [...prev, {
            timeTaken,
            answerChanges,
            isCorrect: correct
        }]);
    };

    const nextQuestion = () => {
        if (currentStep < questions.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            finalizeQuiz();
        }
    };

    const finalizeQuiz = async () => {
        // Prepare final data
        const finalScore = score + (isCorrect ? 1 : 0); // Add current if correct (already handled in confirmAnswer? No, score updates in confirmAnswer)
        // Wait, confirmAnswer updates score. So 'score' is up to date AFTER render. 
        // But finalizeQuiz called from nextQuestion.
        // Let's trace: 
        // confirmAnswer -> updates score -> User clicks Next -> nextQuestion (last) -> finalizeQuiz.
        // Correct.

        const total = questions.length;
        const percentage = score / total; // Use 'score' state directly
        const passed = percentage >= getPassingThreshold();

        setShowResults(true);

        // Aggregate Signals for API
        const totalTime = signals.reduce((acc, curr) => acc + curr.timeTaken, 0);
        const avgTime = totalTime / signals.length || 0;
        const totalChanges = signals.reduce((acc, curr) => acc + curr.answerChanges, 0);

        // Count repeated mistakes? We'd need history. For now send 0 or implement later.
        // Difficulty mapping: Easy=1, Medium=3, Hard=5
        const difficultyScore = difficulty === 'hard' ? 5 : difficulty === 'medium' ? 3 : 1;

        if (session?.user?.email) {
            try {
                const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';

                // 1. Submit existing completion logic
                // Using fetch wrapper or relative path if configured
                await fetch('/api/v1/academy/quiz/submit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user_id: session.user.email, // Using email as ID per convention found
                        module_id: moduleId,
                        difficulty: difficulty,
                        score: score,
                        total_questions: total,
                        passed: passed
                    })
                });

                // 2. Submit Signals to Paths Engine (NEW)
                await fetch('/api/paths/calculate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        accuracy: Math.round(percentage * 100),
                        avgTimePerQuestion: Math.round(avgTime),
                        difficulty: difficultyScore,
                        answerChanges: totalChanges,
                        repeatedMistakes: 0
                    })
                });

            } catch (error) {
                console.error('Failed to save progress or paths:', error);
            }
        }

        onComplete(score, passed);
    };

    if (questions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center">
                <HelpCircle size={48} className="text-gray-600 mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">Quiz Under Construction</h2>
                <p className="text-gray-400 mb-6">This certification level is coming soon to the Zenith Academy.</p>
                <button onClick={onClose} className="px-6 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all">
                    Go Back
                </button>
            </div>
        );
    }

    if (showResults) {
        const percentage = Math.round((score / questions.length) * 100);
        const passed = percentage / 100 >= getPassingThreshold();

        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-8 text-center"
            >
                <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {passed ? <Trophy size={40} /> : <RotateCcw size={40} />}
                </div>

                <h2 className="text-3xl font-bold text-white mb-2">
                    {passed ? 'Certification Earned!' : 'Remediation Required'}
                </h2>
                <p className="text-gray-400 mb-8 max-w-md mx-auto">
                    {passed
                        ? `Congratulations! You've demonstrated professional competence in ${courseTitle} at the ${difficulty} level.`
                        : `You scored ${percentage}%, which is below the ${Math.round(getPassingThreshold() * 100)}% passing threshold for this level.`}
                </p>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Score</div>
                        <div className="text-2xl font-bold text-white">{score}/{questions.length}</div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Percentage</div>
                        <div className="text-2xl font-bold text-cyan-400">{percentage}%</div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    {!passed && (
                        <button
                            onClick={onClose}
                            className="px-8 py-3 bg-white/10 rounded-xl font-bold hover:bg-white/20 transition-all"
                        >
                            Retry Later
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl font-bold hover:opacity-90 transition-all"
                    >
                        {passed ? 'Continue Learning' : 'Try Again'}
                    </button>
                </div>
            </motion.div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto py-8 px-4">
            {/* Progress Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Award size={14} className="text-cyan-400" />
                        <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
                            Professional Certification — {difficulty}
                        </span>
                    </div>
                    <h2 className="text-xl font-bold text-white">{courseTitle}</h2>
                </div>
                <div className="text-right">
                    <div className="text-xs text-gray-500 mb-1">Question {currentStep + 1} of {questions.length}</div>
                    <div className="w-32 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-cyan-500 transition-all duration-300"
                            style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Question Card */}
            <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-xl mb-6 relative"
            >
                <div className="absolute top-4 right-4 text-xs text-gray-600 font-mono flex items-center gap-1">
                    <Clock size={10} />
                    {/* Visual timer could go here, for now simpler */}
                    Recording
                </div>

                <h3 className="text-lg md:text-xl text-white font-medium mb-8 leading-relaxed">
                    {currentQuestion.question}
                </h3>

                <div className="space-y-3">
                    {currentQuestion.options.map((option, idx) => {
                        const optionKey = option.charAt(0);
                        const isSelected = selectedOption === option;
                        const isCorrectOption = optionKey === currentQuestion.correctAnswer;

                        let variant = "default";
                        if (isConfirmed) {
                            if (isCorrectOption) variant = "correct";
                            else if (isSelected) variant = "incorrect";
                        } else if (isSelected) {
                            variant = "selected";
                        }

                        return (
                            <button
                                key={idx}
                                onClick={() => handleSelectOption(option)}
                                disabled={isConfirmed}
                                className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between group
                                    ${variant === 'default' ? 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10' : ''}
                                    ${variant === 'selected' ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-100' : ''}
                                    ${variant === 'correct' ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' : ''}
                                    ${variant === 'incorrect' ? 'border-red-500/50 bg-red-500/10 text-red-400' : ''}
                                `}
                            >
                                <span className="flex-1">{option}</span>
                                {variant === 'correct' && <CheckCircle2 size={20} className="text-emerald-400 flex-shrink-0 ml-3" />}
                                {variant === 'incorrect' && <XCircle size={20} className="text-red-400 flex-shrink-0 ml-3" />}
                            </button>
                        );
                    })}
                </div>

                {/* Explanation */}
                <AnimatePresence>
                    {isConfirmed && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-8 p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20"
                        >
                            <div className="flex gap-3">
                                <HelpCircle size={18} className="text-cyan-400 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-bold text-cyan-400 mb-1">Explanation</p>
                                    <p className="text-sm text-gray-300 leading-relaxed">
                                        {currentQuestion.explanation}
                                    </p>
                                    {currentQuestion.calculation && (
                                        <div className="mt-3 p-3 bg-black/40 rounded-lg font-mono text-xs text-emerald-400">
                                            {currentQuestion.calculation}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Bottom Actions */}
            <div className="flex justify-between items-center">
                <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-white transition-colors text-sm font-medium"
                >
                    Cancel Exam
                </button>

                {/* 
                    Two-step logic:
                    1. If not confirmed, button = "Confirm Answer" (disabled if no selection)
                    2. If confirmed, button = "Next Question" / "Finish"
                */}
                {!isConfirmed ? (
                    <button
                        onClick={confirmAnswer}
                        disabled={!selectedOption}
                        className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all
                            ${selectedOption
                                ? 'bg-white text-black hover:bg-gray-200'
                                : 'bg-white/5 text-gray-500 cursor-not-allowed'}
                        `}
                    >
                        Confirm Answer
                    </button>
                ) : (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={nextQuestion}
                        className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 shadow-lg shadow-cyan-500/20"
                    >
                        {currentStep < questions.length - 1 ? 'Next Question' : 'Finish Exam'}
                        <ArrowRight size={18} />
                    </motion.button>
                )}
            </div>
        </div>
    );
}
