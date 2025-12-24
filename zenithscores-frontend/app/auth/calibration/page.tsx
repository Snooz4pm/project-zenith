'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Target, TrendingUp, Clock, Brain, Zap, Shield,
    ArrowRight, ArrowLeft, CheckCircle, Sparkles, User
} from 'lucide-react';
import { useSession } from 'next-auth/react';

interface CalibrationQuestion {
    id: string;
    question: string;
    description: string;
    icon: React.ReactNode;
    options: {
        value: number;
        label: string;
        description?: string;
    }[];
}

const calibrationQuestions: CalibrationQuestion[] = [
    {
        id: 'riskTolerance',
        question: 'How much risk are you comfortable with?',
        description: 'This helps us filter signals that match your risk appetite.',
        icon: <Shield size={24} className="text-blue-400" />,
        options: [
            { value: 2, label: 'Conservative', description: 'I prefer steady, lower-risk opportunities' },
            { value: 5, label: 'Moderate', description: 'Balanced approach to risk and reward' },
            { value: 8, label: 'Aggressive', description: 'High risk for potentially higher returns' },
            { value: 10, label: 'Extreme', description: 'Maximum exposure, maximum potential' }
        ]
    },
    {
        id: 'timeHorizon',
        question: 'What\'s your typical holding period?',
        description: 'We\'ll highlight signals that match your trading timeframe.',
        icon: <Clock size={24} className="text-purple-400" />,
        options: [
            { value: 1, label: 'Scalper', description: 'Minutes to hours' },
            { value: 2, label: 'Day Trader', description: 'Same day, no overnight' },
            { value: 3, label: 'Swing Trader', description: 'Days to weeks' },
            { value: 4, label: 'Position Trader', description: 'Weeks to months' }
        ]
    },
    {
        id: 'analysisStyle',
        question: 'How do you prefer to analyze markets?',
        description: 'This affects how we present information to you.',
        icon: <Brain size={24} className="text-green-400" />,
        options: [
            { value: 1, label: 'Technical Only', description: 'Charts, patterns, indicators' },
            { value: 2, label: 'Mostly Technical', description: 'Charts first, news second' },
            { value: 3, label: 'Balanced', description: 'Equal weight to technicals and fundamentals' },
            { value: 4, label: 'Fundamental Focus', description: 'News, earnings, macro events' }
        ]
    },
    {
        id: 'patienceLevel',
        question: 'How patient are you with trades?',
        description: 'This helps us understand your trading psychology.',
        icon: <Target size={24} className="text-yellow-400" />,
        options: [
            { value: 2, label: 'Quick Trigger', description: 'I take profits fast and cut losses quick' },
            { value: 5, label: 'Moderate', description: 'I give trades reasonable time to work' },
            { value: 8, label: 'Patient', description: 'I wait for my thesis to play out' },
            { value: 10, label: 'Very Patient', description: 'Long-term conviction holder' }
        ]
    }
];

const archetypes = [
    { name: 'Market Analyst', icon: '📊', description: 'Data-driven, methodical approach' },
    { name: 'Momentum Trader', icon: '🚀', description: 'Ride trends, quick decisions' },
    { name: 'Value Hunter', icon: '💎', description: 'Patient, contrarian mindset' },
    { name: 'Risk Manager', icon: '🛡️', description: 'Capital preservation first' }
];

export default function CalibrationPage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [selectedArchetype, setSelectedArchetype] = useState<string | null>(null);

    const totalSteps = calibrationQuestions.length + 1; // +1 for archetype selection
    const progress = ((currentStep + 1) / totalSteps) * 100;

    const handleAnswer = (questionId: string, value: number) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const handleNext = () => {
        if (currentStep < totalSteps - 1) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleSubmit = async () => {
        if (!session?.user?.email) {
            router.push('/auth/login?callbackUrl=/auth/calibration');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch('/api/user/calibration', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...answers,
                    userArchetype: selectedArchetype
                })
            });

            if (response.ok) {
                setIsComplete(true);
                setTimeout(() => {
                    router.push('/dashboard');
                }, 2500);
            }
        } catch (error) {
            console.error('Calibration failed:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const currentQuestion = calibrationQuestions[currentStep];
    const isLastQuestion = currentStep === calibrationQuestions.length;
    const canProceed = isLastQuestion
        ? !!selectedArchetype
        : !!answers[currentQuestion?.id];

    // Require authentication
    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
                <div className="text-white animate-pulse">Loading...</div>
            </div>
        );
    }

    if (status === 'unauthenticated') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center max-w-md"
                >
                    <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <User size={32} className="text-cyan-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-3">Sign In to Calibrate</h1>
                    <p className="text-gray-400 mb-8">
                        Calibration saves your preferences to your account so we can personalize your experience.
                    </p>
                    <button
                        onClick={() => router.push('/auth/login?callbackUrl=/auth/calibration')}
                        className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl transition-colors"
                    >
                        Sign In to Continue
                    </button>
                </motion.div>
            </div>
        );
    }

    // Completion screen
    if (isComplete) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center px-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center max-w-md"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: 0.2 }}
                        className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
                    >
                        <CheckCircle size={40} className="text-green-400" />
                    </motion.div>
                    <h1 className="text-3xl font-bold text-white mb-3">Calibration Complete! 🎉</h1>
                    <p className="text-gray-400 mb-4">
                        ZenithScore is now personalized to your trading style.
                    </p>
                    <div className="flex items-center justify-center gap-2 text-sm text-cyan-400">
                        <Sparkles size={16} />
                        Redirecting to your dashboard...
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white pt-20 md:pt-24">
            <div className="container mx-auto px-4 py-8 max-w-2xl">
                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-gray-500 uppercase tracking-wider">
                            Step {currentStep + 1} of {totalSteps}
                        </span>
                        <span className="text-xs text-cyan-400 font-medium">
                            {Math.round(progress)}% Complete
                        </span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>
                </div>

                {/* Question Card */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.3 }}
                        className="glass-panel rounded-2xl p-8"
                    >
                        {!isLastQuestion ? (
                            // Regular questions
                            <>
                                <div className="flex items-center gap-3 mb-6">
                                    {currentQuestion.icon}
                                    <div>
                                        <h2 className="text-xl font-bold">{currentQuestion.question}</h2>
                                        <p className="text-sm text-gray-400">{currentQuestion.description}</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {currentQuestion.options.map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => handleAnswer(currentQuestion.id, option.value)}
                                            className={`w-full p-4 rounded-xl text-left transition-all border ${answers[currentQuestion.id] === option.value
                                                    ? 'bg-cyan-500/20 border-cyan-500/50'
                                                    : 'bg-gray-800/50 border-gray-700/50 hover:border-gray-600'
                                                }`}
                                        >
                                            <div className="font-semibold">{option.label}</div>
                                            {option.description && (
                                                <div className="text-sm text-gray-400 mt-1">{option.description}</div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </>
                        ) : (
                            // Archetype selection
                            <>
                                <div className="flex items-center gap-3 mb-6">
                                    <Zap size={24} className="text-yellow-400" />
                                    <div>
                                        <h2 className="text-xl font-bold">Choose Your Trading Archetype</h2>
                                        <p className="text-sm text-gray-400">This defines your overall trading identity</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {archetypes.map((archetype) => (
                                        <button
                                            key={archetype.name}
                                            onClick={() => setSelectedArchetype(archetype.name)}
                                            className={`p-6 rounded-xl text-center transition-all border ${selectedArchetype === archetype.name
                                                    ? 'bg-cyan-500/20 border-cyan-500/50'
                                                    : 'bg-gray-800/50 border-gray-700/50 hover:border-gray-600'
                                                }`}
                                        >
                                            <div className="text-3xl mb-2">{archetype.icon}</div>
                                            <div className="font-bold text-sm">{archetype.name}</div>
                                            <div className="text-xs text-gray-400 mt-1">{archetype.description}</div>
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-8">
                    <button
                        onClick={handleBack}
                        disabled={currentStep === 0}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${currentStep === 0
                                ? 'text-gray-600 cursor-not-allowed'
                                : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        <ArrowLeft size={16} />
                        Back
                    </button>

                    {isLastQuestion ? (
                        <button
                            onClick={handleSubmit}
                            disabled={!canProceed || isSubmitting}
                            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-semibold transition-all ${canProceed && !isSubmitting
                                    ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:opacity-90'
                                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            {isSubmitting ? 'Saving...' : 'Complete Calibration'}
                            {!isSubmitting && <Sparkles size={16} />}
                        </button>
                    ) : (
                        <button
                            onClick={handleNext}
                            disabled={!canProceed}
                            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-semibold transition-all ${canProceed
                                    ? 'bg-white text-black hover:bg-gray-200'
                                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            Next
                            <ArrowRight size={16} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
