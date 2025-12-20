'use client';

import Link from 'next/link';
import { Loader2 } from 'lucide-react';

interface CalibrationPromptProps {
    calibrationPercent: number;
}

export default function CalibrationPrompt({ calibrationPercent = 0 }: CalibrationPromptProps) {
    return (
        <div className="max-w-2xl mx-auto p-8 bg-gradient-to-br from-yellow-900/20 to-orange-900/20 border border-yellow-500/30 rounded-2xl">
            <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-6 bg-yellow-500/10 rounded-full flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
                </div>

                <h2 className="text-2xl font-bold text-white mb-2">
                    Calibrating Your Profile...
                </h2>
                <p className="text-gray-400 mb-6">
                    Complete more quizzes to get accurate career recommendations
                </p>

                {/* Progress Bar */}
                <div className="mb-6">
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-500">Calibration Progress</span>
                        <span className="text-yellow-400 font-bold">{calibrationPercent}%</span>
                    </div>
                    <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-500"
                            style={{ width: `${calibrationPercent}%` }}
                        />
                    </div>
                </div>

                <p className="text-sm text-gray-500 mb-6">
                    {calibrationPercent < 30
                        ? "Take 2-3 more quizzes to unlock your paths"
                        : calibrationPercent < 60
                            ? "Almost there! Complete one more quiz"
                            : "Ready! Your paths will unlock soon"
                    }
                </p>

                <Link
                    href="/learning"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-500 text-black font-bold rounded-xl hover:bg-yellow-400 transition-colors"
                >
                    Take Calibration Quiz
                </Link>
            </div>
        </div>
    );
}
