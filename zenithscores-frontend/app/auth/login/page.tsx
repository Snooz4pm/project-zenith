"use client"

import { useState, useEffect } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Loader2, Mail, Lock, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [isIdle, setIsIdle] = useState(false)

    // Idle detection for ambient bar
    useEffect(() => {
        let idleTimer: NodeJS.Timeout
        const resetIdle = () => {
            setIsIdle(false)
            clearTimeout(idleTimer)
            idleTimer = setTimeout(() => setIsIdle(true), 15000)
        }
        resetIdle()
        window.addEventListener('mousemove', resetIdle)
        window.addEventListener('keypress', resetIdle)
        return () => {
            clearTimeout(idleTimer)
            window.removeEventListener('mousemove', resetIdle)
            window.removeEventListener('keypress', resetIdle)
        }
    }, [])

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
        <div className="min-h-screen bg-[#0a0a0f] flex relative overflow-hidden">

            {/* Ambient Activity Bar - Left Edge */}
            <div className="fixed left-0 top-0 bottom-0 w-1 z-50 flex items-end">
                <div
                    className="w-full bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-full transition-all ease-in-out"
                    style={{
                        height: isIdle ? '30%' : '40%',
                        animation: isIdle
                            ? 'ambientPulseIdle 6s ease-in-out infinite'
                            : 'ambientPulse 4s ease-in-out infinite',
                        boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)'
                    }}
                />
            </div>

            <style jsx>{`
                @keyframes ambientPulse {
                    0%, 100% { height: 40%; }
                    50% { height: 70%; }
                }
                @keyframes ambientPulseIdle {
                    0%, 100% { height: 30%; }
                    50% { height: 50%; }
                }
            `}</style>

            {/* Desktop: Left Panel - Brand & Value Prop (65%) */}
            <div className="hidden lg:flex lg:w-[65%] flex-col justify-center px-16 xl:px-24 relative">

                {/* Logo */}
                <Link href="/" className="absolute top-8 left-12 flex items-center gap-3">
                    <div className="relative w-10 h-10 flex items-center justify-center">
                        <div
                            className="absolute inset-0 bg-emerald-500 opacity-20"
                            style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                        />
                        <div
                            className="absolute inset-[2px] bg-[#0a0a0f]"
                            style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                        />
                        <span className="relative text-emerald-500 font-bold text-xl">Z</span>
                    </div>
                    <span className="text-lg font-semibold text-white">ZenithScores</span>
                </Link>

                <div className="max-w-lg">
                    <h1 className="text-5xl font-bold text-white mb-6 leading-tight tracking-tight">
                        Market Intelligence,<br />
                        <span className="text-emerald-500">Engineered.</span>
                    </h1>

                    <p className="text-lg text-zinc-400 mb-10 leading-relaxed">
                        Real-time analytics and AI-powered insights for professional traders.
                        Non-custodial. Transparent. Built for precision.
                    </p>

                    <div className="space-y-4 text-zinc-500 text-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>Institutional-grade data from Finnhub & DexScreener</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>Zero custody — your keys, your assets</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>Decision Lab for behavioral optimization</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Desktop: Right Panel - Login Card (35%) */}
            <div className="w-full lg:w-[35%] flex items-center justify-center p-6 lg:p-12 bg-[#0d0d12] lg:border-l border-white/5">
                <div className="w-full max-w-[420px]">

                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-8">
                        <Link href="/" className="inline-flex items-center gap-2 justify-center">
                            <div className="relative w-10 h-10 flex items-center justify-center">
                                <div
                                    className="absolute inset-0 bg-emerald-500 opacity-20"
                                    style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                                />
                                <div
                                    className="absolute inset-[2px] bg-[#0a0a0f]"
                                    style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                                />
                                <span className="relative text-emerald-500 font-bold text-xl">Z</span>
                            </div>
                            <span className="text-lg font-semibold text-white">ZenithScores</span>
                        </Link>
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-2">Welcome back</h2>
                    <p className="text-zinc-500 mb-8">Sign in to access your dashboard</p>

                    {/* Login Card */}
                    <div className="bg-[#111116] border border-white/10 rounded-xl p-6 space-y-6">

                        {/* Google Sign-in */}
                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            className="w-full flex items-center justify-center gap-3 bg-white text-zinc-800 font-medium py-3 rounded-lg hover:bg-zinc-100 transition-colors"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Continue with Google
                        </button>

                        {/* Divider */}
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/10" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-[#111116] px-3 text-zinc-600">or</span>
                            </div>
                        </div>

                        {/* Email/Password Form */}
                        <form onSubmit={handleCredentialsLogin} className="space-y-4">
                            <div>
                                <label className="block text-sm text-zinc-400 mb-2">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        className="w-full pl-10 pr-4 py-3 bg-[#0a0a0f] border border-white/10 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-sm"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-sm text-zinc-400">Password</label>
                                    <Link href="/auth/forgot-password" className="text-xs text-emerald-500 hover:text-emerald-400 transition-colors">
                                        Forgot password?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full pl-10 pr-4 py-3 bg-[#0a0a0f] border border-white/10 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-sm"
                                        required
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3 bg-emerald-500 text-black font-semibold rounded-lg hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Signing in...
                                    </>
                                ) : (
                                    <>
                                        Sign in
                                        <ArrowRight size={16} />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    <p className="text-center text-sm text-zinc-500 mt-6">
                        Don't have an account?{" "}
                        <Link href="/auth/register" className="text-emerald-500 hover:text-emerald-400 transition-colors font-medium">
                            Create one
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
