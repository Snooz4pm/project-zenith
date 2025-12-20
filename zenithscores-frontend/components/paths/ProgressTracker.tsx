'use client';

import { useState, useEffect } from 'react';
import { Lock, CheckCircle, BookOpen } from 'lucide-react';
import { PATHS_CONTENT, PathSkill } from '@/lib/paths-content';

interface ProgressTrackerProps {
    userId: string;
}

interface PathProgress {
    pathId: string;
    completedModules: string[];
    totalModules: number;
    percentComplete: number;
}

export default function ProgressTracker({ userId }: ProgressTrackerProps) {
    const [progress, setProgress] = useState<PathProgress[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // For now, initialize with empty progress
        // TODO: Fetch real progress from API
        const pathProgress = Object.entries(PATHS_CONTENT).map(([pathId, content]) => ({
            pathId,
            completedModules: [],
            totalModules: content.deepDive?.skills?.length || 0,
            percentComplete: 0
        }));

        setProgress(pathProgress);
        setLoading(false);
    }, [userId]);

    if (loading) {
        return (
            <div className="animate-pulse space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 bg-white/5 rounded-xl" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {progress.map((pathProgress) => {
                const pathContent = PATHS_CONTENT[pathProgress.pathId];
                if (!pathContent) return null;

                const skills = pathContent.deepDive?.skills || [];

                return (
                    <div key={pathProgress.pathId} className="border border-white/10 rounded-xl p-6 bg-white/5">
                        <div className="flex justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <BookOpen className="text-cyan-400" size={20} />
                                <span className="font-bold text-white">{pathContent.name}</span>
                            </div>
                            <span className="text-sm text-gray-400">
                                {pathProgress.percentComplete}% complete
                            </span>
                        </div>

                        {/* Progress bar */}
                        <div className="h-2 bg-white/10 rounded-full mb-4 overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all"
                                style={{ width: `${pathProgress.percentComplete}%` }}
                            />
                        </div>

                        {/* Skills grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {skills.slice(0, 4).map((skill: PathSkill) => {
                                const isCompleted = pathProgress.completedModules.includes(skill.moduleId);

                                return (
                                    <div
                                        key={skill.moduleId}
                                        className="flex flex-col items-center text-center p-3 rounded-lg bg-white/5"
                                    >
                                        <div className={`h-10 w-10 rounded-full flex items-center justify-center mb-2 ${isCompleted
                                                ? 'bg-green-500/20 text-green-400'
                                                : 'bg-gray-500/20 text-gray-500'
                                            }`}>
                                            {isCompleted ? (
                                                <CheckCircle size={20} />
                                            ) : (
                                                <Lock size={16} />
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-400 line-clamp-2">
                                            {skill.name}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
