'use client';

import { motion } from 'framer-motion';
import { Database, Activity, Server, Clock } from 'lucide-react';

const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
};

export default function DataPage() {
    return (
        <div className="min-h-screen bg-black text-white pt-24 pb-20">
            <div className="container mx-auto px-6 max-w-5xl">

                {/* Header */}
                <motion.div
                    initial="initial" animate="animate" variants={fadeInUp}
                    className="mb-20"
                >
                    <h1 className="text-5xl font-bold mb-6">Data Sources & Transparency</h1>
                    <p className="text-xl text-zinc-400 font-light max-w-2xl">
                        We believe traders deserve raw data. We do not sanitize spikes or smooth out volatility.
                    </p>
                </motion.div>

                {/* Commitment */}
                <section className="mb-24">
                    <motion.div
                        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                        className="bg-zinc-900/30 border border-white/5 rounded-3xl p-10"
                    >
                        <Quote className="mb-6 text-emerald-500 opacity-50" />
                        <h2 className="text-3xl font-bold mb-6">The Truth, Even When It's Volatile.</h2>
                        <p className="text-zinc-400 leading-relaxed text-lg">
                            If the market is chaotic, you will see chaos. We prioritize data fidelity over aesthetic smoothness.
                            Our charts reflect the raw feed from our institutional partners.
                        </p>
                    </motion.div>
                </section>

                {/* Data Partners Grid */}
                <section className="mb-24">
                    <h3 className="text-sm font-mono text-zinc-500 uppercase tracking-widest mb-8">Official Data Partners</h3>
                    <div className="grid md:grid-cols-3 gap-6">

                        {/* DexScreener */}
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="p-8 rounded-2xl bg-black border border-white/10"
                        >
                            <Activity className="text-emerald-500 mb-6" size={32} />
                            <h3 className="text-xl font-bold mb-3">DexScreener</h3>
                            <p className="text-zinc-500 text-sm leading-relaxed">
                                Real-time on-chain pricing and liquidity data for decentralized assets.
                                Direct feed from AMM pools.
                            </p>
                        </motion.div>

                        {/* Finnhub */}
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="p-8 rounded-2xl bg-black border border-white/10"
                        >
                            <Database className="text-cyan-500 mb-6" size={32} />
                            <h3 className="text-xl font-bold mb-3">Finnhub</h3>
                            <p className="text-zinc-500 text-sm leading-relaxed">
                                Institutional-grade stock market data, financial statements, and
                                economic calendar events.
                            </p>
                        </motion.div>

                        {/* Alpha Vantage */}
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="p-8 rounded-2xl bg-black border border-white/10"
                        >
                            <Server className="text-purple-500 mb-6" size={32} />
                            <h3 className="text-xl font-bold mb-3">Alpha Vantage</h3>
                            <p className="text-zinc-500 text-sm leading-relaxed">
                                Global forex exchange rates, technical indicators, and
                                digital currency monthly performance.
                            </p>
                        </motion.div>

                    </div>
                </section>

                {/* Latency Section */}
                <section>
                    <motion.div
                        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                        className="flex gap-6 items-start p-8 rounded-2xl bg-emerald-500/5 border border-emerald-500/10"
                    >
                        <Clock className="text-emerald-500 shrink-0" size={24} />
                        <div>
                            <h3 className="font-bold mb-2">Understanding Real-Time & Latency</h3>
                            <p className="text-zinc-400 text-sm leading-relaxed">
                                While we strife for zero-latency, network conditions and API limits can introduce minor delays.
                                Status indicators in the dashboard always reflect the current data health using a traffic-light system.
                            </p>
                        </div>
                    </motion.div>
                </section>

            </div>
        </div>
    );
}

function Quote(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
            <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
        </svg>
    )
}
