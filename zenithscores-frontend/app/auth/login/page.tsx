"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Loader2, Mail, Lock, ArrowRight, BarChart3, Shield, Zap, TrendingUp } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    const handleCredentialsLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        try {
            const res = await signIn("credentials", {
                email,
                password,
                redirect: false,
            })

            if (res?.error) {
                setError("Invalid email or password")
            } else {
                window.location.href = "/command-center"
            }
        } catch (err) {
            setError("An error occurred. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleGoogleLogin = () => {
        signIn("google", { callbackUrl: "/command-center" })
    }

    return (
        <div className="min-h-screen bg-[var(--void)] flex relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[radial-gradient(circle,_rgba(0,212,255,0.15),_transparent_70%)] animate-pulse" style={{ animationDuration: '4s' }} />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[radial-gradient(circle,_rgba(20,241,149,0.1),_transparent_70%)]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-[radial-gradient(circle,_rgba(20,241,149,0.03),_transparent_50%)] animate-pulse" style={{ animationDuration: '6s' }} />
                {/* Grid Pattern */}
                <div className="absolute inset-0 opacity-[0.02]" style={{
                    backgroundImage: `linear-gradient(rgba(20,241,149,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(20,241,149,0.5) 1px, transparent 1px)`,
                    backgroundSize: '50px 50px'
                }} />
                {/* Noise */}
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }} />
            </div>

            {/* Left Panel - Branding */}
            <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative z-10 flex-col justify-center px-12 xl:px-20"
            >
                <Link href="/" className="absolute top-8 left-8 xl:left-12 flex items-center gap-3 group">
                    <div className="relative w-12 h-12 flex items-center justify-center">
                        <div
                            className="absolute inset-0 bg-[var(--accent-mint)] opacity-20 group-hover:opacity-30 transition-opacity duration-300"
                            style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                        />
                        <div
                            className="absolute inset-[2px] bg-[var(--void)]"
                            style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                        />
                        <span className="relative text-[var(--accent-mint)] font-bold text-2xl" style={{ fontFamily: "var(--font-display)" }}>Z</span>
                    </div>
                    <span className="text-xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>ZenithScores</span>
                </Link>

                <div className="max-w-xl">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        className="text-5xl xl:text-6xl font-bold text-white mb-6 leading-tight"
                        style={{ fontFamily: "var(--font-display)" }}
                    >
                        Intelligence<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-mint)] to-[var(--accent-cyan)]">
                            Dashboard
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        className="text-lg text-[var(--text-secondary)] mb-12 leading-relaxed"
                    >
                        Advanced market analytics, real-time data, and AI-powered insights for professional traders.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.6 }}
                        className="grid grid-cols-2 gap-6"
                    >
                        {[
                            { icon: BarChart3, title: "Live Analytics", desc: "Real-time market data" },
                            { icon: Shield, title: "Secure Access", desc: "Bank-level encryption" },
                            { icon: Zap, title: "Fast Execution", desc: "Lightning-fast trades" },
                            { icon: TrendingUp, title: "AI Insights", desc: "Predictive analytics" }
                        ].map((feature, i) => (
                            <div key={i} className="flex items-start gap-3 group">
                                <div className="w-10 h-10 rounded-lg bg-[rgba(20,241,149,0.1)] border border-[rgba(20,241,149,0.2)] flex items-center justify-center group-hover:bg-[rgba(20,241,149,0.15)] transition-colors">
                                    <feature.icon className="w-5 h-5 text-[var(--accent-mint)]" />
                                </div>
                                <div>
                                    <div className="text-white font-semibold text-sm mb-1">{feature.title}</div>
                                    <div className="text-[var(--text-muted)] text-xs">{feature.desc}</div>
                                </div>
                            </div>
                        ))}
                    </motion.div>

                    {/* Floating Stats */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.6 }}
                        className="mt-16 flex gap-8"
                    >
                        {[
                            { value: "10K+", label: "Active Traders" },
                            { value: "$2.5B+", label: "Trading Volume" },
                            { value: "99.9%", label: "Uptime" }
                        ].map((stat, i) => (
                            <div key={i}>
                                <div className="text-3xl font-bold text-[var(--accent-mint)] mb-1" style={{ fontFamily: "var(--font-display)" }}>
                                    {stat.value}
                                </div>
                                <div className="text-[var(--text-muted)] text-sm">{stat.label}</div>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </motion.div>

            {/* Right Panel - Login Form */}
            <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full lg:w-1/2 xl:w-[45%] relative z-10 flex items-center justify-center p-8"
            >
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-8">
                        <Link href="/" className="inline-flex items-center gap-3 group justify-center mb-6">
                            <div className="relative w-12 h-12 flex items-center justify-center">
                                <div
                                    className="absolute inset-0 bg-[var(--accent-mint)] opacity-20 group-hover:opacity-30 transition-opacity duration-300"
                                    style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                                />
                                <div
                                    className="absolute inset-[2px] bg-[var(--void)]"
                                    style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                                />
                                <span className="relative text-[var(--accent-mint)] font-bold text-2xl" style={{ fontFamily: "var(--font-display)" }}>Z</span>
                            </div>
                        </Link>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                    >
                        <h2 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "var(--font-display)" }}>
                            Welcome Back
                        </h2>
                        <p className="text-[var(--text-secondary)] mb-8">Access your intelligence dashboard</p>

                        {/* Login Card */}
                        <div className="bg-[rgba(10,10,15,0.4)] backdrop-blur-xl border border-[rgba(255,255,255,0.08)] rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                            {/* Top Accent Line */}
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[var(--accent-mint)] via-[var(--accent-cyan)] to-[var(--accent-mint)] opacity-60" />

                            {/* Glow Effect */}
                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-[var(--accent-mint)] opacity-[0.03] rounded-full blur-3xl" />

                            <div className="relative space-y-6">
                                {/* Google Login */}
                                <button
                                    type="button"
                                    onClick={handleGoogleLogin}
                                    className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-semibold py-3.5 rounded-xl hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] group"
                                >
                                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    Continue with Google
                                </button>

                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-[rgba(255,255,255,0.1)]" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-[rgba(10,10,15,0.4)] px-3 text-[var(--text-muted)]">or continue with email</span>
                                    </div>
                                </div>

                                {/* Email/Password Form */}
                                <form onSubmit={handleCredentialsLogin} className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-[var(--text-secondary)]">Email</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)] group-focus-within:text-[var(--accent-mint)] transition-colors" />
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="trader@zenith.com"
                                                className="w-full pl-12 pr-4 py-3.5 bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.1)] rounded-xl text-white placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-mint)] focus:border-transparent transition-all"
                                                style={{ fontFamily: "var(--font-body)" }}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label className="text-sm font-medium text-[var(--text-secondary)]">Password</label>
                                            <Link href="/auth/forgot-password" className="text-xs text-[var(--accent-mint)] hover:text-[var(--accent-cyan)] transition-colors">Forgot?</Link>
                                        </div>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)] group-focus-within:text-[var(--accent-mint)] transition-colors" />
                                            <input
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className="w-full pl-12 pr-4 py-3.5 bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.1)] rounded-xl text-white placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-mint)] focus:border-transparent transition-all"
                                                style={{ fontFamily: "var(--font-body)" }}
                                                required
                                            />
                                        </div>
                                    </div>

                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="p-3 rounded-lg bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] text-[var(--accent-danger)] text-sm"
                                        >
                                            {error}
                                        </motion.div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full py-3.5 bg-[var(--accent-mint)] text-[var(--void)] font-bold rounded-xl hover:shadow-[0_0_40px_rgba(20,241,149,0.4)] hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 relative overflow-hidden group"
                                        style={{ fontFamily: "var(--font-body)" }}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transition-opacity transform -skew-x-12 group-hover:translate-x-full duration-1000" />
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Authenticating...
                                            </>
                                        ) : (
                                            <>
                                                Access Terminal
                                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                </form>

                                <p className="text-center text-sm text-[var(--text-secondary)] pt-2">
                                    No access?{" "}
                                    <Link href="/auth/register" className="text-[var(--accent-mint)] hover:text-[var(--accent-cyan)] transition-colors font-semibold">
                                        Initialize Account
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    )
}
