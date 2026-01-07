'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function ExploreButton() {
    return (
        <Link href="/command-center">
            <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group relative px-8 py-4 bg-emerald-500 text-black font-bold text-lg rounded-full flex items-center gap-3 overflow-hidden"
            >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />

                <span className="relative z-10 flex items-center gap-2">
                    Explore the System
                    <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                    >
                        <ArrowRight size={20} />
                    </motion.div>
                </span>

                {/* Glow effect */}
                <div className="absolute inset-0 rounded-full ring-2 ring-emerald-500/50 group-hover:ring-emerald-400 group-hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all duration-300" />
            </motion.button>
        </Link>
    );
}
