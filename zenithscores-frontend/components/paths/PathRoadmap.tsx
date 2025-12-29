'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    ArrowLeft, CheckCircle2, BookOpen, GraduationCap,
    Briefcase, BrainCircuit, Lock, Award
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PATHS_CONTENT, PathContent } from '@/lib/paths-content';
import FinalExam from './FinalExam';

interface PathRoadmapProps {
    pathId: string;
}

export default function PathRoadmap({ pathId }: PathRoadmapProps) {
    const [showExam, setShowExam] = useState(false);
    const [examPassed, setExamPassed] = useState(false);

    const handleExamComplete = (passed: boolean, score: number) => {
        if (passed) {
            setExamPassed(true);
            // In a real app, we would save the result to the database here
        }
    };

    if (!content) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <h1 className="text-2xl font-bold text-white mb-4">Path Not Found</h1>
                <button
                    onClick={() => router.push('/learn/paths')}
                    className="px-6 py-2 bg-white/10 rounded-lg text-white hover:bg-white/20"
                >
                    Return to Dashboard
                </button>
            </div>
        );
    }

    const Icon = content.icon;

    if (showExam) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <button
                    onClick={() => setShowExam(false)}
                    className="flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors"
                >
                    <ArrowLeft size={18} />
                    <span>Back to Roadmap</span>
                </button>
                <FinalExam
                    pathId={pathId}
                    onComplete={handleExamComplete}
                />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            {/* Header */}
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
            >
                <ArrowLeft size={18} />
                <span>Back to Dashboard</span>
            </button>

            <div className={`rounded-3xl p-8 md:p-12 mb-12 bg-gradient-to-br ${content.startColor} ${content.endColor} relative overflow-hidden`}>
                <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
                    <div className="p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                        <Icon size={48} className="text-white" />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-white/80 uppercase tracking-widest mb-2">Career Roadmap</div>
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{content.name}</h1>
                        <p className="text-xl text-white/90 max-w-2xl leading-relaxed">{content.tagline}</p>

                        {examPassed && (
                            <div className="mt-6 flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-lg w-fit">
                                <Award className="text-yellow-300" size={20} />
                                <span className="font-bold text-white">Path Certified</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white blur-[100px] rounded-full mix-blend-overlay" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Roles & Jobs */}
                <div className="lg:col-span-2 space-y-12">

                    {/* Career Roles section */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <Briefcase className="text-cyan-400" />
                            <h2 className="text-2xl font-bold text-white">Target Career Roles</h2>
                        </div>
                        <div className="grid gap-4">
                            {content.deepDive.roles.map((role, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors group"
                                >
                                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                                        {role.title}
                                    </h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        {role.description}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    </section>

                    {/* Skill Matrix */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <BrainCircuit className="text-purple-400" />
                            <h2 className="text-2xl font-bold text-white">Skill Acquisition Matrix</h2>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                            <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 bg-white/5 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                <div className="col-span-4">Required Skill</div>
                                <div className="col-span-6">Training Component</div>
                                <div className="col-span-2 text-center">Status</div>
                            </div>

                            {content.deepDive.skills.map((skill, idx) => (
                                <div key={idx} className="grid grid-cols-12 gap-4 p-5 border-b border-white/5 items-center hover:bg-white/5 transition-colors">
                                    <div className="col-span-4 font-medium text-white">
                                        {skill.name}
                                    </div>
                                    <div className="col-span-6 flex items-center gap-2">
                                        <BookOpen size={14} className="text-gray-500" />
                                        <span className="text-sm text-gray-300">{skill.module}</span>
                                    </div>
                                    <div className="col-span-2 flex justify-center">
                                        {/* Placeholder status - would be connected to real user progress later */}
                                        <Lock size={16} className="text-gray-600" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Right Column: Execution Plan */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24 p-6 bg-white/5 border border-white/10 rounded-2xl">
                        <div className="flex items-center gap-3 mb-6">
                            <GraduationCap className="text-emerald-400" />
                            <h3 className="text-xl font-bold text-white">Your Execution Plan</h3>
                        </div>

                        <div className="space-y-8 relative mb-8">
                            {/* Connector Line */}
                            <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-white/10" />

                            {[
                                { title: "Foundations", desc: "Master the core mechanics." },
                                { title: "Tooling", desc: `Build the weapon set for ${content.name}.` },
                                { title: "Simulation", desc: "Validate edge in paper trading." },
                                { title: "Live Proof", desc: "Demonstrate consistency > 3 mos." }
                            ].map((step, idx) => (
                                <div key={idx} className="relative pl-10">
                                    <div className="absolute left-0 top-1 w-8 h-8 bg-black border border-white/20 rounded-full flex items-center justify-center text-xs font-bold text-gray-500 z-10">
                                        {idx + 1}
                                    </div>
                                    <h4 className="text-white font-bold mb-1">{step.title}</h4>
                                    <p className="text-sm text-gray-400">{step.desc}</p>
                                </div>
                            ))}
                        </div>

                        <button className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors mb-3">
                            Start Module 1
                        </button>

                        <button
                            onClick={() => setShowExam(true)}
                            className="w-full py-3 bg-[var(--accent-mint)]/10 text-[var(--accent-mint)] font-bold rounded-xl border border-[var(--accent-mint)]/20 hover:bg-[var(--accent-mint)]/20 transition-colors flex items-center justify-center gap-2"
                        >
                            <Award size={18} />
                            Take Final Exam
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
