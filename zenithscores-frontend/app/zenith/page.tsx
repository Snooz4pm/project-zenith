'use client';

import { motion } from 'framer-motion';
import { BarChart2, Shield, TrendingUp, Zap } from 'lucide-react';

const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
};

export default function ZenithPlatformPage() {
    return (
        <div className="min-h-screen bg-black text-white pt-24 pb-20">
            <div className="container mx-auto px-6 max-w-5xl">

                {/* Header */}
                <motion.div
                    initial="initial" animate="animate" variants={fadeInUp}
                    className="mb-20 text-center"
                >
                    <h1 className="text-5xl md:text-6xl font-bold mb-6">The Zenith Platform</h1>
                    <p className="text-xl text-zinc-400 font-light max-w-2xl mx-auto">
                        Solana-native discovery and execution. Find tokens, evaluate them, 
                        and swap for real via Jupiter.
                    </p>
                </motion.div>

                {/* Philosophy Section */}
                <section className="mb-24">
                    <motion.div
                        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                        className="bg-zinc-900/50 border border-white/10 rounded-3xl p-10 md:p-16 text-center backdrop-blur-sm"
                    >
                        <h2 className="text-3xl font-bold mb-6">Control Through Clarity.</h2>
                        <p className="text-lg text-zinc-400 leading-relaxed max-w-3xl mx-auto">
                            In an era of noise, Zenith filters for signal. Our platform is built on the belief that
                            better data presentation leads to better decisions. We do not predict the future;
                            we illuminate the present.
                        </p>
                    </motion.div>
                </section>

                {/* Core Capabilities */}
                <div className="grid gap-20">

                    {/* Token Discovery */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        className="flex flex-col md:flex-row gap-10 items-start"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                            <BarChart2 className="text-emerald-500" size={32} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold mb-4">Token Discovery.</h3>
                            <p className="text-zinc-400 leading-relaxed text-lg">
                                Crypto Finds surfaces trending Solana tokens with flow intelligence.
                                See what's moving before the crowd catches on.
                            </p>
                        </div>
                    </motion.div>

                    {/* Real Swaps */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        className="flex flex-col md:flex-row gap-10 items-start"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center shrink-0">
                            <TrendingUp className="text-cyan-500" size={32} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold mb-4">Real Execution.</h3>
                            <p className="text-zinc-400 leading-relaxed text-lg">
                                No simulators. No paper trading. Connect your Phantom wallet and 
                                execute real swaps through Jupiter with best-route aggregation.
                            </p>
                        </div>
                    </motion.div>

                    {/* Wallet Execution */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        className="flex flex-col md:flex-row gap-10 items-start"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center shrink-0">
                            <Zap className="text-purple-500" size={32} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold mb-4">Direct On-Chain Action.</h3>
                            <p className="text-zinc-400 leading-relaxed text-lg">
                                Connect your Phantom wallet and trade directly on Solana.
                                Zenith acts as a sophisticated interface for decentralized exchanges.
                                We route your intent; the blockchain handles the settlement.
                            </p>
                        </div>
                    </motion.div>

                </div>

            </div>
        </div>
    );
}
