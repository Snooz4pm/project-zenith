import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { COURSES, getCourseById } from '@/lib/learning-content';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Clock, CheckCircle, Lock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface PageProps {
    params: {
        moduleId: string;
    };
}

export default async function ModulePage({ params }: PageProps) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        redirect('/auth/login');
    }

    const { moduleId } = params;
    const course = getCourseById(moduleId);

    if (!course) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <h1 className="text-3xl font-bold mb-4">Module Not Found</h1>
                <p className="text-gray-400 mb-6">The requested learning module "{moduleId}" does not exist.</p>
                <Link href="/learning" className="text-cyan-400 hover:underline">
                    Return to Learning Center
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-12">
            <div className="max-w-4xl mx-auto">
                <Link href="/learning" className="flex items-center gap-2 text-sm text-gray-500 hover:text-cyan-400 mb-8 transition-colors">
                    <ArrowLeft size={16} /> Back to Learning Center
                </Link>

                {/* Header */}
                <div className="mb-12 border-b border-white/10 pb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="px-3 py-1 bg-cyan-500/10 text-cyan-400 text-xs font-bold uppercase tracking-wider rounded-full border border-cyan-500/20">
                            {course.difficulty} Level
                        </span>
                        <span className="flex items-center gap-1 text-gray-400 text-xs">
                            <Clock size={14} /> {course.duration}
                        </span>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-bold font-display mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                        {course.title}
                    </h1>
                    <p className="text-xl text-gray-400 leading-relaxed max-w-2xl">
                        {course.description}
                    </p>
                </div>

                {/* Content */}
                <div className="space-y-12">
                    {course.parts.map((part, partIdx) => (
                        <div key={partIdx} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                            <div className="p-6 border-b border-white/5 bg-white/5">
                                <h2 className="text-xl font-bold text-gray-200">
                                    Part {partIdx + 1}: {part.title}
                                </h2>
                            </div>

                            <div className="divide-y divide-white/5">
                                {part.chapters.map((chapter, chapIdx) => (
                                    <div key={chapIdx} className="p-6 hover:bg-white/5 transition-colors group">
                                        <div className="flex items-start justify-between gap-4 mb-4">
                                            <div>
                                                <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                                                    <span className="w-8 h-8 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-sm font-mono border border-cyan-500/20">
                                                        {(partIdx + 1)}.{chapIdx + 1}
                                                    </span>
                                                    {chapter.title}
                                                </h3>
                                            </div>
                                            {/* Placeholder for progress status */}
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="px-4 py-2 bg-cyan-500 text-black text-sm font-bold rounded-lg hover:bg-cyan-400 transition-colors">
                                                    Start Lesson
                                                </button>
                                            </div>
                                        </div>

                                        <div className="prose prose-invert prose-sm text-gray-400 max-w-none pl-12">
                                            <ReactMarkdown>{chapter.content}</ReactMarkdown>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer Evaluation */}
                <div className="mt-16 p-8 rounded-2xl bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border border-cyan-500/30 text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">Ready to Verify Your Skills?</h2>
                    <p className="text-gray-400 mb-8 max-w-lg mx-auto">
                        Complete this module's certification quiz to earn XP and unlock the next stage of your career path.
                    </p>
                    <button className="px-8 py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors shadow-lg shadow-cyan-500/10">
                        Take Certification Quiz
                    </button>
                </div>
            </div>
        </div>
    );
}
