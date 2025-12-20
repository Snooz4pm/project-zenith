import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PATHS_CONTENT } from '@/lib/paths-content';
import { BrainCircuit, BookOpen, Clock, Trophy, ChevronRight, Lock } from 'lucide-react';
import Link from 'next/link';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface PageProps {
    params: {
        pathId: string;
    };
}

async function getPathProgress(userId: string, pathId: string) {
    // Determine if path is unlocked (e.g. is it the primary path or did they pay?)
    // For now, check if they have a score entry
    const scoreEntry = await prisma.userPathScore.findUnique({
        where: {
            user_id_path_id: {
                user_id: userId,
                path_id: pathId
            }
        }
    });

    return {
        isUnlocked: !!scoreEntry, // Simplistic unlock logic
        score: scoreEntry?.score || 0
    };
}

export default async function PathDetailPage({ params }: PageProps) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        redirect('/auth/login');
    }

    const { pathId } = params;
    const pathContent = PATHS_CONTENT[pathId];

    if (!pathContent) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <h1 className="text-2xl text-red-400">Path Not Found</h1>
            </div>
        );
    }

    const progress = await getPathProgress(session.user.email, pathId);

    // Filter deepDive skills if present
    const skills = pathContent.deepDive?.skills || [];

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-12">

            {/* Header */}
            <div className="max-w-5xl mx-auto mb-12">
                <Link href="/learning" className="text-sm text-gray-500 hover:text-cyan-400 mb-4 inline-block transition-colors">
                    ← Back to Learning Center
                </Link>

                <div className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="p-6 bg-cyan-900/20 rounded-2xl border border-cyan-500/30">
                        <BrainCircuit size={64} className="text-cyan-400" />
                    </div>

                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 bg-cyan-500/10 text-cyan-400 text-xs font-bold uppercase tracking-wider rounded-full border border-cyan-500/20">
                                Career Track
                            </span>
                            {progress.isUnlocked ? (
                                <span className="flex items-center gap-1 text-green-400 text-xs font-bold">
                                    <Trophy size={14} /> Unlocked
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-gray-500 text-xs font-bold">
                                    <Lock size={14} /> Locked
                                </span>
                            )}
                        </div>

                        <h1 className="text-4xl font-bold font-display mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                            {pathContent.name}
                        </h1>
                        <p className="text-xl text-gray-400 leading-relaxed mb-6">
                            {pathContent.tagline}
                        </p>

                        <div className="flex gap-6 text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                                <Clock size={16} />
                                <span>~40 Hours Content</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <BookOpen size={16} />
                                <span>{skills.length} Core Modules</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="max-w-5xl mx-auto">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <BrainCircuit className="text-cyan-400" />
                    Curriculum Map
                </h2>

                <div className="grid gap-4">
                    {skills.map((skill, idx) => (
                        <div key={idx} className="group relative bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:bg-white/10 transition-all duration-300">
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 to-cyan-500/0 group-hover:from-cyan-500/5 group-hover:to-transparent transition-all" />

                            <div className="p-6 flex items-center gap-6">
                                <div className="text-gray-500 font-mono text-xl opacity-50">
                                    {(idx + 1).toString().padStart(2, '0')}
                                </div>

                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-gray-200 group-hover:text-white mb-1 transition-colors">
                                        {skill.module}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        Mastering {skill.name}
                                    </p>
                                </div>

                                <Link
                                    href={`/learning/module/${skill.moduleId || 'coming-soon'}`}
                                    className="p-3 rounded-full bg-white/5 group-hover:bg-cyan-500 text-gray-400 group-hover:text-black transition-all transform group-hover:translate-x-1"
                                >
                                    <ChevronRight size={20} />
                                </Link>
                            </div>
                        </div>
                    ))}

                    {skills.length === 0 && (
                        <div className="p-8 text-center bg-white/5 rounded-xl border border-white/10 border-dashed">
                            <p className="text-gray-500">Curriculum details coming soon.</p>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}
