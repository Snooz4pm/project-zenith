'use client';

import { motion } from 'framer-motion';
import { Shield, Lock, Key } from 'lucide-react';

const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
};

export default function SecurityPage() {
    return (
        <div className="min-h-screen bg-black text-white pt-24 pb-20">
            <div className="container mx-auto px-6 max-w-4xl">

                {/* Header */}
                <motion.div
                    initial="initial" animate="animate" variants={fadeInUp}
                    className="mb-20 text-center"
                >
                    <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-8">
                        <Shield className="text-emerald-500" size={40} />
                    </div>
                    <h1 className="text-5xl font-bold mb-6">Security & Non-Custodial</h1>
                    <p className="text-xl text-zinc-400 font-light">
                        Zero Trust. Zero Custody. Maximum Control.
                    </p>
                </motion.div>

                {/* Architecture Section */}
                <section className="mb-24">
                    <motion.div
                        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                        className="grid gap-8"
                    >
                        <div className="p-10 rounded-2xl bg-zinc-900/30 border border-white/10">
                            <h2 className="text-2xl font-bold mb-4 text-emerald-400">Zero Trust Architecture</h2>
                            <p className="text-zinc-400 leading-relaxed">
                                Zenith is built on a strict non-custodial architecture. We are an interface, not a bank.
                                We do not have servers that store your private keys. We do not have a database of your funds.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="p-6 rounded-2xl bg-black border border-white/10">
                                <span className="text-emerald-500 font-mono text-xl mb-3 block">01</span>
                                <h3 className="font-bold mb-2">Connection</h3>
                                <p className="text-sm text-zinc-500">You connect your wallet locally in your browser.</p>
                            </div>
                            <div className="p-6 rounded-2xl bg-black border border-white/10">
                                <span className="text-emerald-500 font-mono text-xl mb-3 block">02</span>
                                <h3 className="font-bold mb-2">Signing</h3>
                                <p className="text-sm text-zinc-500">Transactions are constructed and signed only by you.</p>
                            </div>
                            <div className="p-6 rounded-2xl bg-black border border-white/10">
                                <span className="text-emerald-500 font-mono text-xl mb-3 block">03</span>
                                <h3 className="font-bold mb-2">Execution</h3>
                                <p className="text-sm text-zinc-500">Broadcasting happens directly to the blockchain.</p>
                            </div>
                        </div>
                    </motion.div>
                </section>

                {/* Responsibility Section */}
                <section>
                    <motion.div
                        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                        className="border-l-2 border-emerald-500 pl-8 py-4"
                    >
                        <h2 className="text-3xl font-bold mb-6">You Are The Custodian.</h2>
                        <p className="text-zinc-400 leading-relaxed mb-6 text-lg">
                            Because we do not hold your funds, we cannot recover lost keys or reverse transactions.
                            You maintain 100% control and 100% responsibility for your assets.
                        </p>
                        <p className="text-emerald-400 font-mono text-sm uppercase tracking-wider">
                            "Not your keys, not your crypto" is not a slogan—it is our engineering standard.
                        </p>
                    </motion.div>
                </section>

            </div>
        </div>
    );
}
